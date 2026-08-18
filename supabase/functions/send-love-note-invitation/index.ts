// Supabase Edge Function: send-love-note-invitation
// Creates a private Love Note invitation and delivers ONLY invitation copy.
// The Love Note content itself is never sent to the SMS/email delivery provider.
// DEVELOPMENT CODE. Deploy/enable only through the approved controlled rollout.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const normalizeEmail = (value: unknown) => clean(value, 320).toLowerCase()

const positiveIntEnv = (name: string) => {
  const value = Number.parseInt(Deno.env.get(name) || '', 10)
  return Number.isFinite(value) && value > 0 ? value : null
}

const allowedOrigins = () => {
  const configured = (Deno.env.get('LOVE_NOTE_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(configured.length ? configured : [DEFAULT_ORIGIN])
}

const corsHeadersFor = (request: Request) => {
  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  const responseOrigin = allowedOrigins().has(origin) ? origin : DEFAULT_ORIGIN
  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const json = (request: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(request), ...extraHeaders, 'Content-Type': 'application/json' },
  })

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
  // Never derive a public sender display name from private account email.
  return profileName || metadataName || 'One2OneLove member'
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

const enforceSenderRateLimit = async (serviceClient: any, senderUserId: string) => {
  const hourlyLimit = positiveIntEnv('LOVE_NOTE_MAX_PER_HOUR')
  const dailyLimit = positiveIntEnv('LOVE_NOTE_MAX_PER_DAY')

  // Do not allow the delivery kill switch to be enabled without intentional limits.
  if (!hourlyLimit || !dailyLimit) {
    return { allowed: false, configurationError: true, retryAfter: 0 }
  }

  const now = Date.now()
  const hourStart = new Date(now - 60 * 60 * 1000).toISOString()
  const dayStart = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const [{ count: hourCount, error: hourError }, { count: dayCount, error: dayError }] = await Promise.all([
    serviceClient
      .from('love_note_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('sender_user_id', senderUserId)
      .gte('created_at', hourStart),
    serviceClient
      .from('love_note_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('sender_user_id', senderUserId)
      .gte('created_at', dayStart),
  ])

  if (hourError || dayError) {
    console.error('Love Note rate-limit lookup failed:', hourError || dayError)
    return { allowed: false, configurationError: true, retryAfter: 0 }
  }

  if ((hourCount || 0) >= hourlyLimit) {
    return { allowed: false, configurationError: false, retryAfter: 3600 }
  }
  if ((dayCount || 0) >= dailyLimit) {
    return { allowed: false, configurationError: false, retryAfter: 86400 }
  }

  return { allowed: true, configurationError: false, retryAfter: 0 }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(request) })
  }
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) {
    return json(request, { error: 'Origin not allowed', code: 'ORIGIN_NOT_ALLOWED' }, 403)
  }

  try {
    if (Deno.env.get('LOVE_NOTE_DELIVERY_ENABLED') !== 'true') {
      return json(request, { error: 'Love Note delivery is not enabled yet.', code: 'DELIVERY_DISABLED' }, 503)
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return json(request, { error: 'Authentication required' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(request, { error: 'Server configuration is incomplete' }, 500)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json(request, { error: 'Authentication required' }, 401)
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return json(request, { error: 'Confirm your email before sending a Love Note.', code: 'EMAIL_NOT_CONFIRMED' }, 403)
    }

    const rateLimit = await enforceSenderRateLimit(serviceClient, user.id)
    if (!rateLimit.allowed) {
      if (rateLimit.configurationError) {
        return json(request, { error: 'Love Note sending limits are not configured.', code: 'RATE_LIMIT_NOT_CONFIGURED' }, 503)
      }
      return json(
        request,
        { error: 'You have reached the current Love Note sending limit. Please try again later.', code: 'RATE_LIMITED' },
        429,
        { 'Retry-After': String(rateLimit.retryAfter) },
      )
    }

    const body = await request.json()
    const deliveryMethod = body?.delivery_method === 'email' ? 'email' : 'sms'
    if (deliveryMethod === 'sms' && Deno.env.get('LOVE_NOTE_SMS_ENABLED') !== 'true') {
      return json(request, { error: 'Love Note SMS delivery is not enabled yet.', code: 'SMS_DISABLED' }, 503)
    }

    const recipientName = clean(body?.recipient_name, 80)
    const rawRecipientContact = clean(body?.recipient_contact, 160)
    const recipientContact = deliveryMethod === 'email' ? normalizeEmail(rawRecipientContact) : rawRecipientContact
    const noteContent = clean(body?.note_content, 500)
    const deliveryTime = body?.delivery_time === 'schedule' ? 'schedule' : 'now'
    const scheduledFor = clean(body?.scheduled_for, 80)
    const scheduleTimezone = clean(body?.schedule_timezone, 80) || 'UTC'

    if (!recipientContact || !noteContent) {
      return json(request, { error: 'Recipient contact and Love Note content are required.' }, 400)
    }
    if (deliveryMethod === 'email' && !EMAIL_PATTERN.test(recipientContact)) {
      return json(request, { error: 'Enter a valid recipient email address.' }, 400)
    }

    let scheduledAt: string | null = null
    if (deliveryTime === 'schedule') {
      const parsed = new Date(scheduledFor)
      const maxScheduleDays = positiveIntEnv('LOVE_NOTE_MAX_SCHEDULE_DAYS') || 365
      const latestAllowed = Date.now() + maxScheduleDays * 24 * 60 * 60 * 1000
      if (!scheduledFor || Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return json(request, { error: 'Scheduled delivery must be a valid future date/time.' }, 400)
      }
      if (parsed.getTime() > latestAllowed) {
        return json(request, { error: `Love Notes can currently be scheduled up to ${maxScheduleDays} days ahead.` }, 400)
      }
      scheduledAt = parsed.toISOString()
    }

    const senderName = await getSenderName(serviceClient, user)
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
    if (!siteUrl) return json(request, { error: 'SITE_URL is not configured' }, 500)

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
        return json(request, { error: 'Unable to schedule Love Note invitation.' }, 500)
      }

      return json(request, {
        invitation_id: invitation.id,
        status: 'scheduled',
        scheduled_for: invitation.scheduled_for,
        schedule_timezone: invitation.schedule_timezone,
        sender_name: senderName,
      })
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
      return json(request, { error: 'Unable to prepare Love Note invitation.' }, 500)
    }

    const copy = buildCopy(senderName, revealUrl)

    try {
      const providerMessageId = deliveryMethod === 'email'
        ? await deliverEmailWithResend({ to: recipientContact, invitationId: invitation.id, copy })
        : await deliverSmsThroughConfiguredAdapter({ to: recipientContact, invitationId: invitation.id, copy })

      const { error: updateError } = await serviceClient
        .from('love_note_invitations')
        .update({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: providerMessageId, failure_reason: null })
        .eq('id', invitation.id)
        .eq('status', 'queued')

      if (updateError) console.error('Love Note sent-state update failed:', updateError)
      return json(request, { invitation_id: invitation.id, status: 'sent', sender_name: senderName })
    } catch (deliveryError) {
      console.error('Love Note delivery failed:', deliveryError)
      await serviceClient
        .from('love_note_invitations')
        .update({
          status: 'failed',
          failure_reason: clean(deliveryError instanceof Error ? deliveryError.message : String(deliveryError), 500),
        })
        .eq('id', invitation.id)
        .eq('status', 'queued')

      return json(request, { error: 'The Love Note invitation could not be delivered.' }, 502)
    }
  } catch (error) {
    console.error('send-love-note-invitation error:', error)
    return json(request, { error: 'Unable to send Love Note invitation right now.' }, 500)
  }
})
