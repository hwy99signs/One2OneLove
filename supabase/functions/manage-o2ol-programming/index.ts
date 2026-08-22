// Supabase Edge Function: manage-o2ol-programming
// DEVELOPMENT CODE ONLY. Internal O2OL programming is controlled by a server-side
// allowlist of authenticated Supabase user IDs. Do not deploy or configure the allowlist
// until the creator-programming activation batch is explicitly approved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const GLOBAL_ROOM = 'global-relationship-room'
const MIN_DURATION_MS = 15 * 60 * 1000
const MAX_DURATION_MS = 4 * 60 * 60 * 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('CREATOR_PROGRAMMING_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

const allowedAdminIds = () => new Set(
  (Deno.env.get('O2OL_PROGRAMMING_ADMIN_USER_IDS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => UUID_PATTERN.test(value))
)

const corsHeadersFor = (request: Request) => {
  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  const allowed = configuredOrigins()
  return {
    'Access-Control-Allow-Origin': allowed.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const json = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(request), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const validTimezone = (timezone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
    return true
  } catch {
    return false
  }
}

const localDateFor = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

const cleanReplayUrl = (value: unknown) => {
  const candidate = clean(value, 1000)
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' ? url.toString().slice(0, 1000) : null
  } catch {
    return null
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!configuredOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  if (Deno.env.get('CREATOR_PROGRAMMING_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, eligible: false })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const authorization = request.headers.get('authorization') || ''
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization.toLowerCase().startsWith('bearer ')) {
    return json(request, { error: 'UNAUTHORIZED' }, 401)
  }

  try {
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    const caller = callerData?.user
    if (callerError || !caller?.id) return json(request, { error: 'UNAUTHORIZED' }, 401)
    if (!caller.email_confirmed_at && !caller.confirmed_at) {
      return json(request, { error: 'EMAIL_CONFIRMATION_REQUIRED' }, 403)
    }

    const body = await request.json().catch(() => ({}))
    const action = clean(body?.action, 30) || 'access'
    const eligible = allowedAdminIds().has(caller.id)

    if (action === 'access') {
      return json(request, { success: true, enabled: true, eligible })
    }
    if (!eligible) return json(request, { error: 'O2OL_PROGRAMMING_ADMIN_REQUIRED' }, 403)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (action === 'cancel') {
      const slotId = clean(body?.slot_id, 80)
      if (!slotId) return json(request, { error: 'SLOT_ID_REQUIRED' }, 400)
      if (!UUID_PATTERN.test(slotId)) return json(request, { error: 'SLOT_ID_INVALID' }, 400)

      const { data: slot, error } = await serviceClient
        .from('creator_programming_slots')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', slotId)
        .eq('program_source', 'o2ol')
        .eq('status', 'booked')
        .select('id,program_source,room_slug,title,description,starts_at,ends_at,content_mode,status')
        .single()

      if (error) throw error
      return json(request, { success: true, slot })
    }

    if (action !== 'book') return json(request, { error: 'INVALID_ACTION' }, 400)

    const title = clean(body?.title, 120)
    const description = clean(body?.description, 1000)
    const timezone = clean(body?.timezone, 80)
    const roomSlug = clean(body?.room_slug, 80) || GLOBAL_ROOM
    const contentMode = clean(body?.content_mode, 20) === 'replay' ? 'replay' : 'live'
    const replayUrl = contentMode === 'replay' ? cleanReplayUrl(body?.replay_url) : null
    const startsAt = new Date(body?.starts_at)
    const endsAt = new Date(body?.ends_at)

    if (!title) return json(request, { error: 'TITLE_REQUIRED' }, 400)
    if (roomSlug !== GLOBAL_ROOM) return json(request, { error: 'ROOM_NOT_AVAILABLE' }, 400)
    if (!validTimezone(timezone)) return json(request, { error: 'INVALID_TIMEZONE' }, 400)
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return json(request, { error: 'INVALID_TIME' }, 400)

    const duration = endsAt.getTime() - startsAt.getTime()
    if (startsAt.getTime() <= Date.now() || duration < MIN_DURATION_MS || duration > MAX_DURATION_MS) {
      return json(request, { error: 'INVALID_TIME' }, 400)
    }
    if (contentMode === 'replay' && !replayUrl) return json(request, { error: 'REPLAY_URL_HTTPS_REQUIRED' }, 400)

    const { data: conflicts, error: conflictError } = await serviceClient
      .from('creator_programming_slots')
      .select('id')
      .eq('room_slug', roomSlug)
      .eq('status', 'booked')
      .lt('starts_at', endsAt.toISOString())
      .gt('ends_at', startsAt.toISOString())
      .limit(1)

    if (conflictError) throw conflictError
    if (conflicts?.length) return json(request, { error: 'SLOT_CONFLICT' }, 409)

    const creatorLocalDate = localDateFor(startsAt, timezone)
    const { data: slot, error: insertError } = await serviceClient
      .from('creator_programming_slots')
      .insert({
        creator_user_id: null,
        program_source: 'o2ol',
        room_slug: roomSlug,
        title,
        description,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        creator_timezone: timezone,
        creator_local_date: creatorLocalDate,
        content_mode: contentMode,
        replay_url: replayUrl,
        booking_tier: 'internal',
        price_cents: 0,
        payment_status: 'not_required',
        policy_version: null,
        policy_acknowledged_at: null,
        status: 'booked',
      })
      .select('id,program_source,room_slug,title,description,starts_at,ends_at,content_mode,status')
      .single()

    if (insertError) {
      if (insertError.code === '23P01' || insertError.code === '23505') {
        return json(request, { error: 'SLOT_CONFLICT' }, 409)
      }
      throw insertError
    }

    return json(request, { success: true, slot })
  } catch (error) {
    console.error('O2OL programming management failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'O2OL_PROGRAMMING_FAILED' }, 500)
  }
})
