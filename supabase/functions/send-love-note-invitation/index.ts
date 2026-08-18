// Supabase Edge Function: send-love-note-invitation
// Authenticated Love Note invitation creation/delivery.
// DEVELOPMENT CODE. Deploy/enable only through the approved controlled rollout.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const normalizeEmail = (value: unknown) => clean(value, 320).toLowerCase()

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

const json = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(request),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const positiveIntEnv = (name: string, min: number, max: number) => {
  const raw = Deno.env.get(name) || ''
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value < min || value > max) return null
  return value
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

const idempotentResponse = (request: Request, existing: any) => {
  if (!existing) return null
  if (['scheduled', 'sent', 'delivered', 'revealed'].includes(existing.status)) {
    return json(request, {
      success: true,
      invitation_id: existing.id,
      status: existing.status,
      idempotent: true,
    })
  }
  if (existing.status === 'queued') {
    return json(request, {
      error: 'This Love Note submission is already being reconciled. Do not resend it.',
      code: 'DELIVERY_RECONCILIATION_REQUIRED',
      invitation_id: existing.id,
    }, 409)
  }
  return json(request, {
    error: 'This Love Note submission cannot be retried with the same request ID.',
    code: 'REQUEST_ALREADY_FINALIZED',
    invitation_id: existing.id,
    status: existing.status,
  }, 409)
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  if (Deno.env.get('LOVE_NOTE_DELIVERY_ENABLED') !== 'true') {
    return json(request, { error: 'Love Note delivery is not enabled yet.', code: 'DELIVERY_DISABLED' }, 503)
  }

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return json(request, { error: 'AUTHENTICATION_REQUIRED' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !siteUrl || !/^https:\/\//i.test(siteUrl)) {
      return json(request, { error: 'BACKEND_NOT_CONFIGURED' }, 503)
    }

    const maxPerHour = positiveIntEnv('LOVE_NOTE_MAX_PER_HOUR', 1, 1000)
    const maxPerDay = positiveIntEnv('LOVE_NOTE_MAX_PER_DAY', 1, 5000)
    const maxScheduleDays = positiveIntEnv('LOVE_NOTE_MAX_SCHEDULE_DAYS', 1, 3650)
    if (!maxPerHour || !maxPerDay || !maxScheduleDays) {
      return json(request, { error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json(request, { error: 'AUTHENTICATION_REQUIRED' }, 401)
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return json(request, { error: 'Confirm your email before sending a Love Note.', code: 'EMAIL_NOT_CONFIRMED' }, 403)
    }

    const body = await request.json()
    const clientRequestId = clean(body?.client_request_id || body?.clientRequestId, 80)
    const recipientName = clean(body?.recipient_name || body?.recipientName, 80)
    const deliveryMethod = clean(body?.delivery_method || body?.deliveryMethod, 20).toLowerCase()
    const noteContent = clean(body?.note_content || body?.noteContent || body?.message, 500)
    const scheduleTimezone = clean(body?.schedule_timezone || body?.scheduleTimezone || body?.timezone, 80) || null
    const scheduledRaw = clean(body?.scheduled_for || body?.scheduledFor || body?.scheduledAt, 80)

    if (!UUID_PATTERN.test(clientRequestId)) return json(request, { error: 'INVALID_REQUEST_ID' }, 400)
    if (!['email', 'sms'].includes(deliveryMethod)) return json(request, { error: 'INVALID_DELIVERY_METHOD' }, 400)
    if (!noteContent) return json(request, { error: 'LOVE_NOTE_REQUIRED' }, 400)
    if (deliveryMethod === 'sms' && Deno.env.get('LOVE_NOTE_SMS_ENABLED') !== 'true') {
      return json(request, { error: 'SMS delivery is not enabled.', code: 'SMS_DISABLED' }, 503)
    }

    const recipientContact = deliveryMethod === 'email'
      ? normalizeEmail(body?.recipient_contact || body?.recipientContact)
      : clean(body?.recipient_contact || body?.recipientContact, 160)
    if (!recipientContact || (deliveryMethod === 'email' && !EMAIL_PATTERN.test(recipientContact))) {
      return json(request, { error: 'VALID_RECIPIENT_REQUIRED' }, 400)
    }

    // Return the existing result before rate-limit checks so a network retry of the same
    // logical submission never creates or sends another invitation.
    const { data: existing, error: existingError } = await serviceClient
      .from('love_note_invitations')
      .select('id, status')
      .eq('sender_user_id', user.id)
      .eq('client_request_id', clientRequestId)
      .maybeSingle()
    if (existingError) throw existingError
    const existingResponse = idempotentResponse(request, existing)
    if (existingResponse) return existingResponse

    let senderName = ''
    const { data: profile } = await serviceClient
      .from('users')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()
    senderName = clean(profile?.name, 80) || clean(user.user_metadata?.name, 80) || 'One2OneLove member'

    const now = Date.now()
    const hourAgo = new Date(now - 60 * 60 * 1000).toISOString()
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()

    const [{ count: hourCount, error: hourError }, { count: dayCount, error: dayError }] = await Promise.all([
      serviceClient.from('love_note_invitations').select('id', { count: 'exact', head: true }).eq('sender_user_id', user.id).gte('created_at', hourAgo),
      serviceClient.from('love_note_invitations').select('id', { count: 'exact', head: true }).eq('sender_user_id', user.id).gte('created_at', dayAgo),
    ])
    if (hourError || dayError) throw hourError || dayError
    if ((hourCount || 0) >= maxPerHour || (dayCount || 0) >= maxPerDay) {
      return json(request, { error: 'LOVE_NOTE_RATE_LIMITED', code: 'RATE_LIMITED' }, 429)
    }

    let scheduledFor: string | null = null
    if (scheduledRaw) {
      const scheduledDate = new Date(scheduledRaw)
      if (Number.isNaN(scheduledDate.getTime())) return json(request, { error: 'INVALID_SCHEDULE' }, 400)
      if (scheduledDate.getTime() <= now + 30_000) return json(request, { error: 'SCHEDULE_MUST_BE_FUTURE' }, 400)
      if (scheduledDate.getTime() > now + maxScheduleDays * 24 * 60 * 60 * 1000) {
        return json(request, { error: 'SCHEDULE_TOO_FAR' }, 400)
      }
      scheduledFor = scheduledDate.toISOString()
    }

    let rawToken: string | null = null
    let tokenHash: string | null = null
    let tokenExpiresAt: string | null = null
    if (!scheduledFor) {
      rawToken = randomToken()
      tokenHash = await sha256(rawToken)
      tokenExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const insertPayload = {
      sender_user_id: user.id,
      client_request_id: clientRequestId,
      sender_name: senderName,
      recipient_name: recipientName || null,
      recipient_contact: recipientContact,
      delivery_method: deliveryMethod,
      note_content: noteContent,
      token_hash: tokenHash,
      token_expires_at: tokenExpiresAt,
      scheduled_for: scheduledFor,
      schedule_timezone: scheduleTimezone,
      status: scheduledFor ? 'scheduled' : 'queued',
    }

    const { data: invitation, error: insertError } = await serviceClient
      .from('love_note_invitations')
      .insert(insertPayload)
      .select('id, status')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: raced } = await serviceClient
          .from('love_note_invitations')
          .select('id, status')
          .eq('sender_user_id', user.id)
          .eq('client_request_id', clientRequestId)
          .maybeSingle()
        const racedResponse = idempotentResponse(request, raced)
        if (racedResponse) return racedResponse
      }
      throw insertError
    }

    if (scheduledFor) {
      return json(request, { success: true, invitation_id: invitation.id, status: 'scheduled' })
    }

    const revealUrl = `${siteUrl}/LoveNoteReveal?token=${encodeURIComponent(rawToken || '')}`
    const copy = buildCopy(senderName, revealUrl)

    try {
      const providerMessageId = deliveryMethod === 'email'
        ? await deliverEmailWithResend({ to: recipientContact, invitationId: invitation.id, copy })
        : await deliverSmsThroughConfiguredAdapter({ to: recipientContact, invitationId: invitation.id, copy })

      const { error: sentStateError } = await serviceClient
        .from('love_note_invitations')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: providerMessageId,
          failure_reason: null,
        })
        .eq('id', invitation.id)
        .eq('status', 'queued')

      if (sentStateError) {
        console.error('Love Note provider succeeded but sent-state persistence failed:', invitation.id, sentStateError)
        return json(request, {
          error: 'Delivery succeeded but requires server reconciliation. Do not resend this submission.',
          code: 'DELIVERY_RECONCILIATION_REQUIRED',
          invitation_id: invitation.id,
        }, 503)
      }

      return json(request, { success: true, invitation_id: invitation.id, status: 'sent' })
    } catch (deliveryError) {
      console.error('Love Note delivery failed:', invitation.id, deliveryError instanceof Error ? deliveryError.message : 'unknown')
      await serviceClient
        .from('love_note_invitations')
        .update({
          status: 'failed',
          failure_reason: clean(deliveryError instanceof Error ? deliveryError.message : String(deliveryError), 500),
        })
        .eq('id', invitation.id)
        .eq('status', 'queued')

      return json(request, { error: 'LOVE_NOTE_DELIVERY_FAILED', code: 'DELIVERY_FAILED' }, 502)
    }
  } catch (error) {
    console.error('send-love-note-invitation error:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'LOVE_NOTE_SEND_UNAVAILABLE' }, 500)
  }
})
