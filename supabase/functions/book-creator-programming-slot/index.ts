// Supabase Edge Function: book-creator-programming-slot
// DEVELOPMENT CODE ONLY. Do not deploy until the creator programming schema and
// production approval batch are explicitly approved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const GLOBAL_ROOM = 'global-relationship-room'
const FREE_DAILY_LIMIT = 2
const MIN_DURATION_MS = 15 * 60 * 1000
const MAX_DURATION_MS = 4 * 60 * 60 * 1000
const CREATOR_PROGRAMMING_POLICY_VERSION = 'creator-programming-v1'

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('CREATOR_PROGRAMMING_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

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
    return json(request, { error: 'FEATURE_DISABLED' }, 503)
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

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Creator eligibility is a product role, not staff/admin authority. Internal O2OL
    // administrative actions are separately restricted to server-side UUID allowlists.
    const { data: creator, error: creatorError } = await serviceClient
      .from('users')
      .select('id,user_type')
      .eq('id', caller.id)
      .single()

    if (creatorError || creator?.user_type !== 'influencer') {
      return json(request, { error: 'CREATOR_NOT_APPROVED' }, 403)
    }

    const body = await request.json()
    const title = clean(body?.title, 120)
    const description = clean(body?.description, 1000)
    const timezone = clean(body?.timezone, 80)
    const roomSlug = clean(body?.room_slug, 80) || GLOBAL_ROOM
    const contentMode = clean(body?.content_mode, 20) === 'replay' ? 'replay' : 'live'
    const bookingTier = clean(body?.booking_tier, 20) || 'free'
    const replayUrl = contentMode === 'replay' ? cleanReplayUrl(body?.replay_url) : null
    const policyAcknowledged = body?.policy_acknowledged === true
    const startsAt = new Date(body?.starts_at)
    const endsAt = new Date(body?.ends_at)

    if (!title) return json(request, { error: 'TITLE_REQUIRED' }, 400)
    if (!policyAcknowledged) return json(request, { error: 'POLICY_ACK_REQUIRED' }, 400)
    if (roomSlug !== GLOBAL_ROOM) return json(request, { error: 'ROOM_NOT_AVAILABLE' }, 400)
    if (!validTimezone(timezone)) return json(request, { error: 'INVALID_TIMEZONE' }, 400)
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return json(request, { error: 'INVALID_TIME' }, 400)

    const duration = endsAt.getTime() - startsAt.getTime()
    if (startsAt.getTime() <= Date.now() || duration < MIN_DURATION_MS || duration > MAX_DURATION_MS) {
      return json(request, { error: 'INVALID_TIME' }, 400)
    }

    if (contentMode === 'replay' && !replayUrl) return json(request, { error: 'REPLAY_URL_HTTPS_REQUIRED' }, 400)

    // The schema is future-ready for paid bookings, but v1 intentionally accepts free
    // creator slots only. A future paid rollout requires its own approved payment flow.
    if (bookingTier !== 'free') return json(request, { error: 'PAID_SLOTS_NOT_ENABLED' }, 403)

    const creatorLocalDate = localDateFor(startsAt, timezone)

    const { count: freeCount, error: countError } = await serviceClient
      .from('creator_programming_slots')
      .select('id', { head: true, count: 'exact' })
      .eq('program_source', 'creator')
      .eq('creator_user_id', caller.id)
      .eq('creator_local_date', creatorLocalDate)
      .eq('booking_tier', 'free')
      .eq('status', 'booked')

    if (countError) throw countError
    if ((freeCount || 0) >= FREE_DAILY_LIMIT) {
      return json(request, { error: 'DAILY_FREE_LIMIT_REACHED' }, 409)
    }

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

    const { data: slot, error: insertError } = await serviceClient
      .from('creator_programming_slots')
      .insert({
        creator_user_id: caller.id,
        program_source: 'creator',
        room_slug: roomSlug,
        title,
        description,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        creator_timezone: timezone,
        creator_local_date: creatorLocalDate,
        content_mode: contentMode,
        replay_url: replayUrl,
        booking_tier: 'free',
        price_cents: 0,
        payment_status: 'not_required',
        policy_version: CREATOR_PROGRAMMING_POLICY_VERSION,
        policy_acknowledged_at: new Date().toISOString(),
        status: 'booked',
      })
      .select('id,program_source,room_slug,title,description,starts_at,ends_at,creator_timezone,creator_local_date,content_mode,replay_url,booking_tier,price_cents,payment_status,status,created_at')
      .single()

    if (insertError) {
      // Database constraints are the final authority under concurrent booking attempts.
      // Preserve the same member-facing result when the advisory-lock trigger catches a
      // third free booking after the earlier count check already passed.
      if (
        insertError.code === 'P0001'
        && String(insertError.message || '').includes('CREATOR_DAILY_FREE_LIMIT_REACHED')
      ) {
        return json(request, { error: 'DAILY_FREE_LIMIT_REACHED' }, 409)
      }
      if (insertError.code === '23P01' || insertError.code === '23505') {
        return json(request, { error: 'SLOT_CONFLICT' }, 409)
      }
      throw insertError
    }

    return json(request, { success: true, slot })
  } catch (error) {
    console.error('Creator programming booking failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'BOOKING_FAILED' }, 500)
  }
})
