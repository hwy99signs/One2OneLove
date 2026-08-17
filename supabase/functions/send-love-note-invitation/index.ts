// Supabase Edge Function: send-love-note-invitation
// Creates a private Love Note invitation and delivers ONLY the invitation copy.
// The Love Note content itself is never sent to the SMS/email delivery provider.
// DEVELOPMENT CODE: do not deploy until the Love Notes migration/provider are approved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

const getSenderName = async (serviceClient: any, user: any) => {
  const { data } = await serviceClient
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const profileName = clean(data?.name, 80)
  const metadataName = clean(user?.user_metadata?.name, 80)
  const emailName = clean(user?.email?.split('@')?.[0], 80)
  return profileName || metadataName || emailName || 'One2OneLove member'
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    if (Deno.env.get('LOVE_NOTE_DELIVERY_ENABLED') !== 'true') {
      return json({ error: 'Love Note delivery is not enabled yet.', code: 'DELIVERY_DISABLED' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Authentication required' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Server configuration is incomplete' }, 500)

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Authentication required' }, 401)

    const body = await req.json()
    const deliveryMethod = body?.delivery_method === 'email' ? 'email' : 'sms'
    const recipientName = clean(body?.recipient_name, 80)
    const recipientContact = clean(body?.recipient_contact, 160)
    const noteContent = clean(body?.note_content, 500)
    const deliveryTime = body?.delivery_time === 'schedule' ? 'schedule' : 'now'
    const scheduledFor = clean(body?.scheduled_for, 80)
    const scheduleTimezone = clean(body?.schedule_timezone, 80) || 'UTC'

    if (!recipientContact || !noteContent) return json({ error: 'Recipient contact and Love Note content are required.' }, 400)

    let scheduledAt: string | null = null
    if (deliveryTime === 'schedule') {
      const parsed = new Date(scheduledFor)
      if (!scheduledFor || Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return json({ error: 'Scheduled delivery must be a valid future date/time.' }, 400)
      }
      scheduledAt = parsed.toISOString()
    }

    const senderName = await getSenderName(serviceClient, user)
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
    if (!siteUrl) return json({ error: 'SITE_URL is not configured' }, 500)

    if (deliveryTime === 'schedule') {
      const { data: invitation, error: insertError } = await serviceClient
        .from('love_note_invitations')
        .insert({
          sender_user_id: user.id,
          sender_name: senderName,
          recipient_name: recipientName || null,
          recipient_contact: recipientContact,
          delivery_method: deliveryMethod,
          note_content: noteContent,
          token_hash: null,
          token_expires_at: null,
          scheduled_for: scheduledAt,
          schedule_timezone: scheduleTimezone,
          status: 'scheduled',
        })
        .select('id, status, scheduled_for, schedule_timezone, created_at')
        .single()

      if (insertError || !invitation) {
        console.error('Scheduled Love Note invitation insert failed:', insertError)
        return json({ error: 'Unable to schedule Love Note invitation.' }, 500)
      }

      return json({ invitation_id: invitation.id, status: 'scheduled', scheduled_for: invitation.scheduled_for, schedule_timezone: invitation.schedule_timezone, sender_name: senderName })
    }

    const rawToken = randomToken()
    const tokenHash = await sha256(rawToken)
    const revealUrl = `${siteUrl}/LoveNoteReveal?token=${encodeURIComponent(rawToken)}`
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: invitation, error: insertError } = await serviceClient
      .from('love_note_invitations')
      .insert({
        sender_user_id: user.id,
        sender_name: senderName,
        recipient_name: recipientName || null,
        recipient_contact: recipientContact,
        delivery_method: deliveryMethod,
        note_content: noteContent,
        token_hash: tokenHash,
        token_expires_at: tokenExpiresAt,
        scheduled_for: null,
        schedule_timezone: null,
        status: 'queued',
      })
      .select('id, status, created_at')
      .single()

    if (insertError || !invitation) {
      console.error('Love Note invitation insert failed:', insertError)
      return json({ error: 'Unable to prepare Love Note invitation.' }, 500)
    }

    const copy = buildCopy(senderName, revealUrl)

    try {
      const providerMessageId = deliveryMethod === 'email'
        ? await deliverEmailWithResend({ to: recipientContact, invitationId: invitation.id, copy })
        : await deliverSmsThroughConfiguredAdapter({ to: recipientContact, invitationId: invitation.id, copy })

      await serviceClient
        .from('love_note_invitations')
        .update({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: providerMessageId, failure_reason: null })
        .eq('id', invitation.id)

      return json({ invitation_id: invitation.id, status: 'sent', sender_name: senderName })
    } catch (deliveryError) {
      console.error('Love Note delivery failed:', deliveryError)
      await serviceClient
        .from('love_note_invitations')
        .update({ status: 'failed', failure_reason: clean(deliveryError instanceof Error ? deliveryError.message : String(deliveryError), 500) })
        .eq('id', invitation.id)

      return json({ error: 'The Love Note invitation could not be delivered.' }, 502)
    }
  } catch (error) {
    console.error('send-love-note-invitation error:', error)
    return json({ error: 'Unable to send Love Note invitation right now.' }, 500)
  }
})
