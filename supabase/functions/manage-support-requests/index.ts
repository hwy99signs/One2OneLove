// Supabase Edge Function: manage-support-requests
// DEVELOPMENT CODE ONLY. Staff authority is controlled only by the server-side
// O2OL_SUPPORT_ADMIN_USER_IDS allowlist; no public profile user_type grants access.
// Support lifecycle auditing is database-atomic; this function never writes audit rows separately.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REVIEW_FIELDS = 'id,category,subject,message,status,staff_response,responded_at,closed_at,created_at,updated_at'

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('SUPPORT_REQUEST_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

const allowedAdminIds = () => new Set(
  (Deno.env.get('O2OL_SUPPORT_ADMIN_USER_IDS') || '')
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

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!configuredOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  if (Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, eligible: false, requests: [] })
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

    if (action === 'access') return json(request, { success: true, enabled: true, eligible })
    if (!eligible) return json(request, { error: 'O2OL_SUPPORT_ADMIN_REQUIRED' }, 403)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (action === 'list') {
      const statusFilter = clean(body?.status, 20)
      let query = serviceClient
        .from('support_requests')
        .select(REVIEW_FIELDS)
        .order('created_at', { ascending: true })
        .limit(100)
      if (['open','in_progress','resolved','closed'].includes(statusFilter)) query = query.eq('status', statusFilter)
      else query = query.in('status', ['open','in_progress'])
      const { data, error } = await query
      if (error) throw error

      // Deliberately omit member user_id and last_actor_* metadata. The support queue
      // centers on the issue; identity resolution remains a separate reviewed admin path.
      return json(request, { success: true, enabled: true, eligible: true, requests: data || [] })
    }

    const requestId = clean(body?.request_id, 80)
    if (!requestId) return json(request, { error: 'REQUEST_ID_REQUIRED' }, 400)
    if (!UUID_PATTERN.test(requestId)) return json(request, { error: 'REQUEST_ID_INVALID' }, 400)

    if (action === 'start') {
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({
          status: 'in_progress',
          last_actor_user_id: caller.id,
          last_actor_kind: 'staff',
        })
        .eq('id', requestId)
        .eq('status', 'open')
        .select(REVIEW_FIELDS)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'respond') {
      const response = clean(body?.response, 4000)
      if (response.length < 3) return json(request, { error: 'RESPONSE_TOO_SHORT' }, 400)
      const respondedAt = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({
          status: 'resolved',
          staff_response: response,
          responded_at: respondedAt,
          closed_at: null,
          last_actor_user_id: caller.id,
          last_actor_kind: 'staff',
        })
        .eq('id', requestId)
        .in('status', ['open','in_progress','resolved'])
        .select(REVIEW_FIELDS)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'close') {
      const closedAt = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({
          status: 'closed',
          closed_at: closedAt,
          last_actor_user_id: caller.id,
          last_actor_kind: 'staff',
        })
        .eq('id', requestId)
        .in('status', ['open','in_progress','resolved'])
        .select(REVIEW_FIELDS)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'reopen') {
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({
          status: 'in_progress',
          closed_at: null,
          last_actor_user_id: caller.id,
          last_actor_kind: 'staff',
        })
        .eq('id', requestId)
        .in('status', ['resolved','closed'])
        .select(REVIEW_FIELDS)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    return json(request, { error: 'INVALID_ACTION' }, 400)
  } catch (error) {
    console.error('Support queue management failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'SUPPORT_MANAGEMENT_FAILED' }, 500)
  }
})
