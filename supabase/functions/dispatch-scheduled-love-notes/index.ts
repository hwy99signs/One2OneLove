// Supabase Edge Function: dispatch-scheduled-love-notes
// Claims due scheduled Love Notes, creates their private reveal token at send time,
// and delivers only the invitation copy through the configured provider adapter.
// DEVELOPMENT CODE. Deploy/schedule only through the approved controlled rollout.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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

const buildCopy = (senderName: string, revealUrl: string) => ({
  sms: `💕 ${senderName} sent you a private Love Note on One2OneLove. Tap to reveal it: ${revealUrl}`,
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

const deliverSmsThroughConfiguredAdapter = async ({ to, invitationId, copy }: any) => {
  if (Deno.env.get('LOVE_NOTE_SMS_ENABLED') !== 'true') {
    throw new Error('SMS delivery is not enabled')
  }

  const endpoint = Deno.env.get('LOVE_NOTE_SMS_ENDPOINT') || ''
  const providerKey = Deno.env.get('LOVE_NOTE_SMS_PROVIDER_KEY') || ''
  if (!endpoint || !providerKey) throw new Error('SMS delivery provider is not configured')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: 'sms',
      to,
      text: copy.sms,
      metadata: { invitation_id: invitationId, product: 'one2onelove_love_notes' },
    }),
  })

  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`)

  try {
    const payload = await response.json()
    return clean(payload?.id || payload?.message_id, 200) || null
  } catch {
    return null
  }
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
      .select('id, delivery_method')
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
      // Email can be activated independently. SMS records remain scheduled and
      // untouched until the account owner separately approves and enables SMS.
      if (row.delivery_method === 'sms' && !smsEnabled) {
        results.push({ id: row.id, status: 'sms_disabled' })
        continue
      }

      const { data: claimed, error: claimError } = await serviceClient
        .from('love_note_invitations')
        .update({ status: 'queued' })
        .eq('id', row.id)
        .eq('status', 'scheduled')
        .lte('scheduled_for', now)
        .select('id, sender_name, recipient_contact, delivery_method')
        .maybeSingle()

      if (claimError) {
        console.error('Scheduled Love Note claim failed:', row.id, claimError)
        continue
      }
      if (!claimed) continue

      const senderName = clean(claimed.sender_name, 80) || 'One2OneLove member'
      const recipientContact = claimed.delivery_method === 'email'
        ? normalizeEmail(claimed.recipient_contact)
        : clean(claimed.recipient_contact, 160)

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
      const copy = buildCopy(senderName, revealUrl)

      try {
        const { error: tokenError } = await serviceClient
          .from('love_note_invitations')
          .update({ token_hash: tokenHash, token_expires_at: tokenExpiresAt })
          .eq('id', claimed.id)
          .eq('status', 'queued')

        if (tokenError) throw tokenError

        const providerMessageId = claimed.delivery_method === 'email'
          ? await deliverEmailWithResend({ to: recipientContact, invitationId: claimed.id, copy })
          : await deliverSmsThroughConfiguredAdapter({ to: recipientContact, invitationId: claimed.id, copy })

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
          // key protects against duplicates, but a new raw token would change the body.
          // Leave the row queued for operator reconciliation rather than risk duplicate
          // or mismatched invitations.
          console.error('Scheduled Love Note provider succeeded but sent-state update failed:', claimed.id, sentStateError)
          results.push({ id: claimed.id, status: 'reconciliation_required' })
          continue
        }

        results.push({ id: claimed.id, status: 'sent' })
      } catch (error) {
        console.error('Scheduled Love Note delivery failed:', claimed.id, error)
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
