// Supabase Edge Function: dispatch-scheduled-love-notes
// Claims due scheduled Love Notes, creates their private reveal token at send time,
// and delivers only the invitation copy through the configured provider adapter.
// DEVELOPMENT CODE: do not deploy or schedule until explicitly approved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
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

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    if (Deno.env.get('LOVE_NOTE_DELIVERY_ENABLED') !== 'true') {
      return json({ error: 'Love Note delivery is not enabled yet.', code: 'DELIVERY_DISABLED' }, 503)
    }

    const expectedSecret = Deno.env.get('LOVE_NOTE_SCHEDULER_SECRET') || ''
    const suppliedSecret = req.headers.get('x-o2ol-scheduler-secret') || ''
    if (!expectedSecret || suppliedSecret !== expectedSecret) {
      return json({ error: 'Unauthorized scheduler request' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
    if (!supabaseUrl || !serviceRoleKey || !siteUrl) return json({ error: 'Server configuration is incomplete' }, 500)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const now = new Date().toISOString()

    const { data: due, error: dueError } = await serviceClient
      .from('love_note_invitations')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(50)

    if (dueError) {
      console.error('Scheduled Love Note lookup failed:', dueError)
      return json({ error: 'Unable to load scheduled Love Notes.' }, 500)
    }

    const results: Array<{ id: string; status: string }> = []

    for (const row of due || []) {
      const { data: claimed, error: claimError } = await serviceClient
        .from('love_note_invitations')
        .update({ status: 'queued' })
        .eq('id', row.id)
        .eq('status', 'scheduled')
        .lte('scheduled_for', now)
        .select('id, sender_name, recipient_contact, delivery_method')
        .maybeSingle()

      if (claimError || !claimed) continue

      const rawToken = randomToken()
      const tokenHash = await sha256(rawToken)
      const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const revealUrl = `${siteUrl}/LoveNoteReveal?token=${encodeURIComponent(rawToken)}`
      const copy = buildCopy(claimed.sender_name, revealUrl)

      try {
        const { error: tokenError } = await serviceClient
          .from('love_note_invitations')
          .update({ token_hash: tokenHash, token_expires_at: tokenExpiresAt })
          .eq('id', claimed.id)
          .eq('status', 'queued')

        if (tokenError) throw tokenError

        const providerMessageId = claimed.delivery_method === 'email'
          ? await deliverEmailWithResend({ to: claimed.recipient_contact, invitationId: claimed.id, copy })
          : await deliverSmsThroughConfiguredAdapter({ to: claimed.recipient_contact, invitationId: claimed.id, copy })

        await serviceClient
          .from('love_note_invitations')
          .update({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: providerMessageId, failure_reason: null })
          .eq('id', claimed.id)
          .eq('status', 'queued')

        results.push({ id: claimed.id, status: 'sent' })
      } catch (error) {
        console.error('Scheduled Love Note delivery failed:', claimed.id, error)
        await serviceClient
          .from('love_note_invitations')
          .update({ status: 'failed', failure_reason: clean(error instanceof Error ? error.message : String(error), 500) })
          .eq('id', claimed.id)

        results.push({ id: claimed.id, status: 'failed' })
      }
    }

    return json({ processed: results.length, results })
  } catch (error) {
    console.error('dispatch-scheduled-love-notes error:', error)
    return json({ error: 'Unable to dispatch scheduled Love Notes right now.' }, 500)
  }
})
