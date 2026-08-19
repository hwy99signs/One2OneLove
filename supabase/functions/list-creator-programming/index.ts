// Supabase Edge Function: list-creator-programming
// DEVELOPMENT CODE ONLY. Returns a privacy-minimized programming schedule.
// Deploy with JWT verification enabled only after the creator programming batch is approved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const GLOBAL_ROOM = 'global-relationship-room'
const MAX_WINDOW_DAYS = 31

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

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!configuredOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  if (Deno.env.get('CREATOR_PROGRAMMING_ENABLED') !== 'true') return json(request, { error: 'FEATURE_DISABLED' }, 503)

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
    if (callerError || !callerData?.user?.id) return json(request, { error: 'UNAUTHORIZED' }, 401)

    const body = await request.json().catch(() => ({}))
    const roomSlug = clean(body?.room_slug, 80) || GLOBAL_ROOM
    if (roomSlug !== GLOBAL_ROOM) return json(request, { error: 'ROOM_NOT_AVAILABLE' }, 400)

    const now = new Date()
    const requestedFrom = body?.from ? new Date(body.from) : now
    const requestedTo = body?.to ? new Date(body.to) : new Date(requestedFrom.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (Number.isNaN(requestedFrom.getTime()) || Number.isNaN(requestedTo.getTime()) || requestedTo <= requestedFrom) {
      return json(request, { error: 'INVALID_RANGE' }, 400)
    }

    const maxTo = new Date(requestedFrom.getTime() + MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const to = requestedTo > maxTo ? maxTo : requestedTo

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Return every booking that overlaps the requested calendar window, not only
    // bookings whose start time falls inside it. This keeps cross-midnight and
    // multi-hour programs from creating false "Open" time on the 24-hour calendar.
    const { data, error } = await serviceClient
      .from('creator_programming_slots')
      .select('id,program_source,room_slug,title,description,starts_at,ends_at,content_mode,status')
      .eq('room_slug', roomSlug)
      .eq('status', 'booked')
      .lt('starts_at', to.toISOString())
      .gt('ends_at', requestedFrom.toISOString())
      .order('starts_at', { ascending: true })

    if (error) throw error

    return json(request, { success: true, slots: data || [] })
  } catch (error) {
    console.error('Creator programming schedule lookup failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'SCHEDULE_LOOKUP_FAILED' }, 500)
  }
})
