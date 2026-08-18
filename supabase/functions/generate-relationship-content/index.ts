// Supabase Edge Function: generate-relationship-content
// One2OneLove paid AI-assisted romantic content generation.
// DEVELOPMENT CODE. Deploy disabled first and activate only through an approved batch.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const ACTIVE_MEMBERSHIP_STATUSES = new Set(['trialing', 'active'])
const LANGUAGES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', it: 'Italian', de: 'German', nl: 'Dutch',
}
const CONTENT_TYPES: Record<string, string> = {
  loveNote: 'romantic Love Note',
  apology: 'sincere apology message',
  anniversary: 'anniversary message',
  dateIdea: 'creative date-night idea',
  conversation: 'relationship conversation starter',
  appreciation: 'words of appreciation',
}
const TONES = new Set(['romantic', 'playful', 'sincere', 'passionate', 'sweet', 'funny'])
const LENGTHS: Record<string, string> = {
  short: 'about 60 to 100 words',
  medium: 'about 140 to 220 words',
  long: 'about 260 to 360 words',
}

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const allowedOrigins = () => {
  const configured = (Deno.env.get('PREMIUM_AI_ALLOWED_ORIGINS') || '')
    .split(',').map((value) => value.trim()).filter(Boolean)
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

const extractResponseText = (payload: any) => {
  const output = Array.isArray(payload?.output) ? payload.output : []
  for (const item of output) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue
    for (const part of item.content) {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text.trim()
    }
  }
  return ''
}

const membershipStatus = async (serviceClient: any, userId: string) => {
  const { data, error } = await serviceClient
    .from('member_subscriptions')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { allowed: false, error: true }
  return { allowed: ACTIVE_MEMBERSHIP_STATUSES.has(clean(data?.status, 40)), error: false }
}

const rateLimit = async (serviceClient: any, userId: string) => {
  const hourLimit = Math.min(Math.max(Number.parseInt(Deno.env.get('PREMIUM_AI_MAX_PER_HOUR') || '20', 10) || 20, 1), 100)
  const dayLimit = Math.min(Math.max(Number.parseInt(Deno.env.get('PREMIUM_AI_MAX_PER_DAY') || '80', 10) || 80, 1), 500)
  const now = Date.now()
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const [{ count: hourCount, error: hourError }, { count: dayCount, error: dayError }] = await Promise.all([
    serviceClient.from('premium_ai_usage').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('feature', 'ai_content_creator').gte('created_at', hourAgo),
    serviceClient.from('premium_ai_usage').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('feature', 'ai_content_creator').gte('created_at', dayAgo),
  ])

  if (hourError || dayError) return { allowed: false, backendError: true }
  return { allowed: (hourCount || 0) < hourLimit && (dayCount || 0) < dayLimit, backendError: false }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  // Deployment alone cannot spend AI tokens.
  if (Deno.env.get('PREMIUM_AI_ENABLED') !== 'true') {
    return json(request, { error: 'PREMIUM_AI_NOT_ENABLED' }, 503)
  }
  // Premium AI must never run in an open/free-gating state.
  if (Deno.env.get('MEMBERSHIP_GATING_ENABLED') !== 'true') {
    return json(request, { error: 'MEMBERSHIP_GATING_NOT_READY' }, 503)
  }

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return json(request, { error: 'AUTHENTICATION_REQUIRED' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const openAIKey = Deno.env.get('OPENAI_API_KEY') || ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !openAIKey) {
      return json(request, { error: 'BACKEND_NOT_CONFIGURED' }, 503)
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
      return json(request, { error: 'EMAIL_NOT_CONFIRMED' }, 403)
    }

    const membership = await membershipStatus(serviceClient, user.id)
    if (membership.error) return json(request, { error: 'MEMBERSHIP_BACKEND_UNAVAILABLE' }, 503)
    if (!membership.allowed) return json(request, { error: 'MEMBERSHIP_REQUIRED', feature: 'ai_content_creator' }, 403)

    const body = await request.json().catch(() => ({}))
    const requestId = clean(body?.request_id || body?.requestId, 80)
    const contentType = clean(body?.content_type || body?.contentType, 40)
    const tone = clean(body?.tone, 30).toLowerCase()
    const length = clean(body?.length, 20)
    const partnerName = clean(body?.partner_name || body?.partnerName, 80)
    const details = clean(body?.details, 1200)
    const languageRaw = clean(body?.language, 5).toLowerCase()
    const language = LANGUAGES[languageRaw] ? languageRaw : 'en'

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return json(request, { error: 'INVALID_REQUEST_ID' }, 400)
    }
    if (!CONTENT_TYPES[contentType] || !TONES.has(tone) || !LENGTHS[length]) {
      return json(request, { error: 'INVALID_GENERATION_OPTIONS' }, 400)
    }

    // Idempotency is checked before rate limits. A member retrying the same logical request
    // after a lost HTTP response should recover its already-paid-for result without being
    // blocked by a later usage cap or spending on another model call.
    const { data: existing, error: existingError } = await serviceClient
      .from('premium_ai_usage')
      .select('id, status, result_text')
      .eq('user_id', user.id)
      .eq('feature', 'ai_content_creator')
      .eq('request_id', requestId)
      .maybeSingle()
    if (existingError) return json(request, { error: 'USAGE_BACKEND_UNAVAILABLE' }, 503)
    if (existing?.status === 'succeeded' && existing.result_text) {
      return json(request, { content: existing.result_text, idempotent: true })
    }
    if (existing?.status === 'started') {
      return json(request, { error: 'REQUEST_IN_PROGRESS' }, 409)
    }
    if (existing) {
      return json(request, { error: 'REQUEST_ALREADY_USED', status: existing.status }, 409)
    }

    const limit = await rateLimit(serviceClient, user.id)
    if (limit.backendError) return json(request, { error: 'USAGE_BACKEND_UNAVAILABLE' }, 503)
    if (!limit.allowed) return json(request, { error: 'AI_USAGE_LIMIT_REACHED' }, 429)

    const model = clean(Deno.env.get('OPENAI_MODEL') || 'gpt-5.6', 80)
    const inputChars = partnerName.length + details.length + contentType.length + tone.length + length.length
    const { data: usage, error: usageError } = await serviceClient
      .from('premium_ai_usage')
      .insert({
        user_id: user.id,
        feature: 'ai_content_creator',
        request_id: requestId,
        status: 'started',
        model,
        input_chars: inputChars,
      })
      .select('id')
      .single()
    if (usageError || !usage?.id) {
      if (usageError?.code === '23505') return json(request, { error: 'REQUEST_IN_PROGRESS' }, 409)
      return json(request, { error: 'USAGE_BACKEND_UNAVAILABLE' }, 503)
    }

    const instructions = `You are the One2OneLove romantic writing assistant.
Write in ${LANGUAGES[language]}.
Create only the requested relationship content; do not explain your process.
Keep the result ${LENGTHS[length]} and use a ${tone} tone.
Make it warm, specific and natural rather than generic or overly dramatic.
Never claim facts the user did not provide.
Do not impersonate the recipient, fabricate memories, manipulate, threaten, guilt, stalk, pressure, or encourage deception.
For apology content, take accountability without demanding forgiveness.
If the supplied context describes abuse, threats, coercion, self-harm, medical/legal emergencies, or another high-risk situation, do not write persuasive relationship content; instead provide a brief neutral message encouraging appropriate real-world support.
Do not include headings unless the requested content naturally needs one.`

    const input = [
      `Content type: ${CONTENT_TYPES[contentType]}`,
      partnerName ? `Partner name: ${partnerName}` : '',
      details ? `User-provided context: ${details}` : '',
    ].filter(Boolean).join('\n')

    const aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: length === 'long' ? 700 : length === 'medium' ? 500 : 300,
        instructions,
        input,
      }),
    })

    if (!aiResponse.ok) {
      await serviceClient.from('premium_ai_usage').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', usage.id)
      console.error('AI content generation failed with status:', aiResponse.status)
      return json(request, { error: 'AI_GENERATION_UNAVAILABLE' }, 502)
    }

    const payload = await aiResponse.json()
    const content = clean(extractResponseText(payload), 4000)
    if (!content) {
      await serviceClient.from('premium_ai_usage').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', usage.id)
      return json(request, { error: 'AI_GENERATION_UNAVAILABLE' }, 502)
    }

    const { error: completionError } = await serviceClient
      .from('premium_ai_usage')
      .update({
        status: 'succeeded',
        output_chars: content.length,
        result_text: content,
        completed_at: new Date().toISOString(),
      })
      .eq('id', usage.id)

    if (completionError) {
      // The model already returned a result. Do not automatically retry/spend again if the
      // usage ledger cannot be finalized; surface an operational reconciliation state.
      console.error('AI content result generated but ledger finalization failed:', completionError.code || 'unknown')
      return json(request, { error: 'AI_RESULT_RECONCILIATION_REQUIRED' }, 503)
    }

    return json(request, { content, idempotent: false })
  } catch (error) {
    console.error('generate-relationship-content error:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'AI_GENERATION_UNAVAILABLE' }, 500)
  }
})
