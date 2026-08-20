// Supabase Edge Function: manage-support-requests
// DEVELOPMENT CODE ONLY. Staff authority is controlled only by the server-side
// O2OL_SUPPORT_ADMIN_USER_IDS allowlist; no public profile user_type grants access.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('SUPPORT_REQUEST_ALLOWED_ORIGINS') || Deno.env.get('CREATOR_PROGRAMMING_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

const allowedAdminIds = () => new Set(
  (Deno.env.get('O2OL_SUPPORT_ADMIN_USER_IDS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
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
        .select('id,category,subject,message,status,staff_response,responded_at,closed_at,created_at,updated_at')
        .order('created_at', { ascending: true })
        .limit(100)
      if (['open','in_progress','resolved','closed'].includes(statusFilter)) query = query.eq('status', statusFilter)
      else query = query.in('status', ['open','in_progress'])
      const { data, error } = await query
      if (error) throw error

      // Deliberately omit member user_id. The support queue should center on the issue;
      // account identity can be resolved through a separate reviewed admin path only if
      // a specific account-level support action truly requires it.
      return json(request, { success: true, enabled: true, eligible: true, requests: data || [] })
    }

    const requestId = clean(body?.request_id, 80)
    if (!requestId) return json(request, { error: 'REQUEST_ID_REQUIRED' }, 400)

    if (action === 'start') {
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({ status: 'in_progress' })
        .eq('id', requestId)
        .eq('status', 'open')
        .select('id,category,subject,message,status,staff_response,responded_at,closed_at,created_at,updated_at')
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('support_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: 'staff_started' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'respond') {
      const response = clean(body?.response, 4000)
      if (response.length < 3) return json(request, { error: 'RESPONSE_TOO_SHORT' }, 400)
      const respondedAt = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({ status: 'resolved', staff_response: response, responded_at: respondedAt, closed_at: null })
        .eq('id', requestId)
        .in('status', ['open','in_progress','resolved'])
        .select('id,category,subject,message,status,staff_response,responded_at,closed_at,created_at,updated_at')
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('support_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: 'staff_resolved' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'close') {
      const closedAt = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({ status: 'closed', closed_at: closedAt })
        .eq('id', requestId)
        .in('status', ['open','in_progress','resolved'])
        .select('id,category,subject,message,status,staff_response,responded_at,closed_at,created_at,updated_at')
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('support_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: 'staff_closed' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'reopen') {
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({ status: 'in_progress', closed_at: null })
        .eq('id', requestId)
        .in('status', ['resolved','closed'])
        .select('id,category,subject,message,status,staff_response,responded_at,closed_at,created_at,updated_at')
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('support_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: 'staff_reopened' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    return json(request, { error: 'INVALID_ACTION' }, 400)
  } catch (error) {
    console.error('Support queue management failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'SUPPORT_MANAGEMENT_FAILED' }, 500)
  }
})
