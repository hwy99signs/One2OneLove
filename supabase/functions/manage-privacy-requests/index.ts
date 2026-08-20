// Supabase Edge Function: manage-privacy-requests
// DEVELOPMENT CODE ONLY. This queue reviews request status only. It does not execute
// data export, data correction, or account deletion.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('PRIVACY_REQUEST_ALLOWED_ORIGINS') || Deno.env.get('SUPPORT_REQUEST_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

const allowedAdminIds = () => new Set(
  (Deno.env.get('O2OL_PRIVACY_ADMIN_USER_IDS') || '')
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

  if (Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true') {
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
    if (!eligible) return json(request, { error: 'O2OL_PRIVACY_ADMIN_REQUIRED' }, 403)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const fields = 'id,request_type,description,status,staff_response,reviewed_at,completed_at,cancelled_at,created_at,updated_at'

    if (action === 'list') {
      const statusFilter = clean(body?.status, 20)
      let query = serviceClient.from('privacy_requests').select(fields).order('created_at', { ascending: true }).limit(100)
      if (['submitted','in_review','completed','cancelled','rejected'].includes(statusFilter)) query = query.eq('status', statusFilter)
      else query = query.in('status', ['submitted','in_review'])
      const { data, error } = await query
      if (error) throw error
      // Deliberately omit member user_id from the review queue. A future execution path
      // may resolve identity internally when actually performing an approved operation.
      return json(request, { success: true, enabled: true, eligible: true, requests: data || [] })
    }

    const requestId = clean(body?.request_id, 80)
    if (!requestId) return json(request, { error: 'REQUEST_ID_REQUIRED' }, 400)

    if (action === 'start') {
      const reviewedAt = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('privacy_requests')
        .update({ status: 'in_review', reviewed_at: reviewedAt })
        .eq('id', requestId)
        .eq('status', 'submitted')
        .select(fields)
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('privacy_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: 'staff_started' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'complete' || action === 'reject') {
      const response = clean(body?.response, 4000)
      if (response.length < 3) return json(request, { error: 'RESPONSE_TOO_SHORT' }, 400)
      const now = new Date().toISOString()
      const nextStatus = action === 'complete' ? 'completed' : 'rejected'
      const patch = {
        status: nextStatus,
        staff_response: response,
        reviewed_at: now,
        completed_at: action === 'complete' ? now : null,
        cancelled_at: null,
      }
      const { data, error } = await serviceClient
        .from('privacy_requests')
        .update(patch)
        .eq('id', requestId)
        .in('status', ['submitted','in_review'])
        .select(fields)
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('privacy_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: action === 'complete' ? 'staff_completed' : 'staff_rejected' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    if (action === 'reopen') {
      const { data, error } = await serviceClient
        .from('privacy_requests')
        .update({ status: 'in_review', completed_at: null, cancelled_at: null })
        .eq('id', requestId)
        .in('status', ['completed','rejected'])
        .select(fields)
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('privacy_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: 'staff_reopened' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, eligible: true, request: data || null })
    }

    return json(request, { error: 'INVALID_ACTION' }, 400)
  } catch (error) {
    console.error('Privacy request management failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'PRIVACY_REQUEST_MANAGEMENT_FAILED' }, 500)
  }
})
