// Supabase Edge Function: current-creator-programming
// DEVELOPMENT CODE ONLY. Supplies the Global Relationship Room with a minimized
// "live now / up next" programming status. It never returns creator account IDs,
// booking/payment fields, policy records, or replay URLs.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const GLOBAL_ROOM = 'global-relationship-room'

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
    headers: {
      ...corsHeadersFor(request),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })

const publicSlot = (slot: Record<string, unknown> | null) => {
  if (!slot) return null
  return {
    id: slot.id,
    program_source: slot.program_source,
    room_slug: slot.room_slug,
    title: slot.title,
    description: slot.description,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    content_mode: slot.content_mode,
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!configuredOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  if (Deno.env.get('CREATOR_PROGRAMMING_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, current: null, next: null })
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
    if (callerError || !callerData?.user?.id) return json(request, { error: 'UNAUTHORIZED' }, 401)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const now = new Date().toISOString()
    const publicFields = 'id,program_source,room_slug,title,description,starts_at,ends_at,content_mode'

    const [{ data: currentRows, error: currentError }, { data: nextRows, error: nextError }] = await Promise.all([
      serviceClient
        .from('creator_programming_slots')
        .select(publicFields)
        .eq('room_slug', GLOBAL_ROOM)
        .eq('status', 'booked')
        .lte('starts_at', now)
        .gt('ends_at', now)
        .order('starts_at', { ascending: false })
        .limit(1),
      serviceClient
        .from('creator_programming_slots')
        .select(publicFields)
        .eq('room_slug', GLOBAL_ROOM)
        .eq('status', 'booked')
        .gt('starts_at', now)
        .order('starts_at', { ascending: true })
        .limit(1),
    ])

    if (currentError) throw currentError
    if (nextError) throw nextError

    return json(request, {
      success: true,
      enabled: true,
      current: publicSlot(currentRows?.[0] || null),
      next: publicSlot(nextRows?.[0] || null),
    })
  } catch (error) {
    console.error('Current creator programming lookup failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'PROGRAMMING_STATUS_FAILED' }, 500)
  }
})
