// Supabase Edge Function: dispatch-scheduled-love-notes
// Claims due scheduled Love Notes, creates their private reveal token at send time,
// and delivers only the invitation copy through the configured provider.
// DEVELOPMENT CODE. Deploy/schedule only through the approved controlled rollout.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  buildLoveNoteSmsCopy,
  normalizeE164,
  normalizeSmsLanguage,
  requireVerifiedSmsConsent,
  sendLoveNoteSmsWithTwilio,
} from '../_shared/loveNoteSms.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const normalizeEmail = (value: unknown) => clean(value, 320).toLowerCase()

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const sha256Bytes = async (value: string) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))

const sha256 = async (value: string) => {
  const digest = await sha256Bytes(value)
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const secretsMatch = async (expected: string, supplied: string) => {
  if (!expected || expected.length < 32 || !supplied) return false
  const [a, b] = await Promise.all([sha256Bytes(expected), sha256Bytes(supplied)])
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

const dispatchBatchSize = () => {
  const configured = Number.parseInt(Deno.env.get('LOVE_NOTE_DISPATCH_BATCH_SIZE') || '', 10)
  if (!Number.isFinite(configured) || configured < 1) return 25
  return Math.min(configured, 100)
}

const buildEmailCopy = (senderName: string, revealUrl: string) => ({
  emailSubject: `${senderName} sent you a private Love Note 💕`,
  emailBody: `${senderName} sent you a private Love Note on One2OneLove.\n\nYour message is being kept private until you open it.\n\nReveal your Love Note: ${revealUrl}`,
})

const deliverEmailWithResend = async ({ to, invitationId, copy }: any) => {
  const apiKey = Deno.env.get('RESEND_API_KEY') || ''
  const from = Deno.env.get('RESEND_FROM_EMAIL') || ''
  if (!apiKey || !from) throw new Error('Resend email delivery is not configured')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'One2OneLove/1.0',
      'Idempotency-Key': `love-note-${invitationId}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: copy.emailSubject,
      text: copy.emailBody,
    }),
  })

  if (!response.ok) {
    const detail = clean(await response.text(), 500)
    throw new Error(`Resend returned ${response.status}${detail ? `: ${detail}` : ''}`)
  }

  const payload = await response.json()
  return clean(payload?.id, 200) || null
}

const isComplianceNotReady = (error: unknown) => {
  const code = clean(error instanceof Error ? error.message : String(error), 100)
  return code === 'O2OL_SMS_COMPLIANCE_NOT_READY'
    || code === 'O2OL_SMS_CONSENT_PEPPER_MISSING'
    || code === 'O2OL_SMS_CONSENT_LOOKUP_FAILED'
}

const isConsentDenied = (error: unknown) => {
  const code = clean(error instanceof Error ? error.message : String(error), 100)
  return code === 'O2OL_SMS_RECIPIENT_CONSENT_REQUIRED'
    || code === 'O2OL_SMS_RECIPIENT_OPTED_OUT'
}

serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    if (Deno.env.get('LOVE_NOTE_DELIVERY_ENABLED') !== 'true') {
      return json({ error: 'Love Note delivery is not enabled yet.', code: 'DELIVERY_DISABLED' }, 503)
    }

    const expectedSecret = Deno.env.get('LOVE_NOTE_SCHEDULER_SECRET') || ''
    const suppliedSecret = request.headers.get('x-o2ol-scheduler-secret') || ''
    if (!(await secretsMatch(expectedSecret, suppliedSecret))) {
      return json({ error: 'Unauthorized scheduler request' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
    if (!supabaseUrl || !serviceRoleKey || !siteUrl) {
      return json({ error: 'Server configuration is incomplete' }, 500)
    }
    if (!/^https:\/\//i.test(siteUrl)) {
      return json({ error: 'SITE_URL must use HTTPS' }, 500)
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const now = new Date().toISOString()
    const smsEnabled = Deno.env.get('LOVE_NOTE_SMS_ENABLED') === 'true'

    const { data: due, error: dueError } = await serviceClient
      .from('love_note_invitations')
      .select('id, delivery_method, recipient_contact, delivery_language')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(dispatchBatchSize())

    if (dueError) {
      console.error('Scheduled Love Note lookup failed:', dueError)
      return json({ error: 'Unable to load scheduled Love Notes.' }, 500)
    }

    const results: Array<{ id: string; status: string }> = []

    for (const row of due || []) {
      // Email can be activated independently. SMS records remain scheduled and untouched
      // while SMS/provider/compliance gates are OFF.
      if (row.delivery_method === 'sms' && !smsEnabled) {
        results.push({ id: row.id, status: 'sms_disabled' })
        continue
      }

      if (row.delivery_method === 'sms') {
        const e164 = normalizeE164(row.recipient_contact)
        if (!e164) {
          await serviceClient
            .from('love_note_invitations')
            .update({ status: 'failed', failure_reason: 'O2OL_SMS_PHONE_INVALID' })
            .eq('id', row.id)
            .eq('status', 'scheduled')
          results.push({ id: row.id, status: 'failed' })
          continue
        }

        try {
          await requireVerifiedSmsConsent(serviceClient, e164)
        } catch (consentError) {
          if (isComplianceNotReady(consentError)) {
            // Infrastructure not ready is not a recipient failure. Leave the note safely
            // scheduled so activation can proceed later without losing the request.
            results.push({ id: row.id, status: 'sms_compliance_not_ready' })
            continue
          }
          if (isConsentDenied(consentError)) {
            // Never send after missing/revoked consent. Preserve the stable reason for
            // operations without exposing the phone number or consent evidence.
            await serviceClient
              .from('love_note_invitations')
              .update({
                status: 'canceled',
                failure_reason: clean(consentError instanceof Error ? consentError.message : String(consentError), 120),
              })
              .eq('id', row.id)
              .eq('status', 'scheduled')
            results.push({ id: row.id, status: 'canceled' })
            continue
          }
          throw consentError
        }
      }

      const { data: claimed, error: claimError } = await serviceClient
        .from('love_note_invitations')
        .update({ status: 'queued' })
        .eq('id', row.id)
        .eq('status', 'scheduled')
        .lte('scheduled_for', now)
        .select('id, sender_name, recipient_contact, delivery_method, delivery_language')
        .maybeSingle()

      if (claimError) {
        console.error('Scheduled Love Note claim failed:', row.id, claimError)
        continue
      }
      if (!claimed) continue

      const senderName = clean(claimed.sender_name, 80) || 'One2OneLove member'
      const deliveryLanguage = normalizeSmsLanguage(claimed.delivery_language)
      const recipientContact = claimed.delivery_method === 'email'
        ? normalizeEmail(claimed.recipient_contact)
        : normalizeE164(claimed.recipient_contact) || ''

      if (!recipientContact || (claimed.delivery_method === 'email' && !EMAIL_PATTERN.test(recipientContact))) {
        await serviceClient
          .from('love_note_invitations')
          .update({ status: 'failed', failure_reason: 'Recipient contact is invalid' })
          .eq('id', claimed.id)
          .eq('status', 'queued')
        results.push({ id: claimed.id, status: 'failed' })
        continue
      }

      const rawToken = randomToken()
      const tokenHash = await sha256(rawToken)
      const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const revealUrl = `${siteUrl}/LoveNoteReveal?token=${encodeURIComponent(rawToken)}`

      try {
        // Re-check immediately before provider submission to close the window between the
        // due-row scan and actual send. A STOP/revocation must win over a scheduled send.
        if (claimed.delivery_method === 'sms') {
          await requireVerifiedSmsConsent(serviceClient, recipientContact)
        }

        const { error: tokenError } = await serviceClient
          .from('love_note_invitations')
          .update({ token_hash: tokenHash, token_expires_at: tokenExpiresAt })
          .eq('id', claimed.id)
          .eq('status', 'queued')

        if (tokenError) throw tokenError

        const providerMessageId = claimed.delivery_method === 'email'
          ? await deliverEmailWithResend({
              to: recipientContact,
              invitationId: claimed.id,
              copy: buildEmailCopy(senderName, revealUrl),
            })
          : await sendLoveNoteSmsWithTwilio({
              to: recipientContact,
              body: buildLoveNoteSmsCopy({ senderName, revealUrl, language: deliveryLanguage }),
            })

        const { error: sentStateError } = await serviceClient
          .from('love_note_invitations')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: providerMessageId,
            failure_reason: null,
          })
          .eq('id', claimed.id)
          .eq('status', 'queued')

        if (sentStateError) {
          // Do not retry automatically after provider success. The provider idempotency
          // behavior cannot make a new reveal token/body equivalent to the prior send.
          console.error('Scheduled Love Note provider succeeded but sent-state update failed:', claimed.id, sentStateError)
          results.push({ id: claimed.id, status: 'reconciliation_required' })
          continue
        }

        results.push({ id: claimed.id, status: 'sent' })
      } catch (error) {
        console.error('Scheduled Love Note delivery failed:', claimed.id, error)

        if (claimed.delivery_method === 'sms' && isConsentDenied(error)) {
          await serviceClient
            .from('love_note_invitations')
            .update({
              status: 'canceled',
              token_hash: null,
              token_expires_at: null,
              failure_reason: clean(error instanceof Error ? error.message : String(error), 120),
            })
            .eq('id', claimed.id)
            .eq('status', 'queued')
          results.push({ id: claimed.id, status: 'canceled' })
          continue
        }

        await serviceClient
          .from('love_note_invitations')
          .update({
            status: 'failed',
            failure_reason: clean(error instanceof Error ? error.message : String(error), 500),
          })
          .eq('id', claimed.id)
          .eq('status', 'queued')

        results.push({ id: claimed.id, status: 'failed' })
      }
    }

    return json({ processed: results.length, results })
  } catch (error) {
    console.error('dispatch-scheduled-love-notes error:', error)
    return json({ error: 'Unable to dispatch scheduled Love Notes right now.' }, 500)
  }
})
