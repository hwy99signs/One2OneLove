// Supabase Edge Function: manage-privacy-requests
// DEVELOPMENT CODE ONLY. This queue reviews request status only. It does not execute
// data export, data correction, billing changes, communications, or account deletion.
// An accepted request becomes `awaiting_fulfillment`; this endpoint has no fulfilled or
// completed action because actual fulfillment is a separate future workstream.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REVIEW_FIELDS = 'id,request_type,member_note,status,staff_response,reviewed_at,decision_at,canceled_at,created_at,updated_at'

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('PRIVACY_REQUEST_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

// Staff access is intentionally independent of member profile roles. Only explicit,
// server-side UUID allowlisting can open this private review queue.
const allowedAdminIds = () => new Set(
  (Deno.env.get('O2OL_PRIVACY_ADMIN_USER_IDS') || '')
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
    if (!caller.email_confirmed_at && !caller.confirmed_at) {
      return json(request, { error: 'EMAIL_CONFIRMATION_REQUIRED' }, 403)
    }

    const body = await request.json().catch(() => ({}))
    const action = clean(body?.action, 40) || 'access'
    const eligible = allowedAdminIds().has(caller.id)

    if (action === 'access') return json(request, { success: true, enabled: true, eligible })
    if (!eligible) return json(request, { error: 'O2OL_PRIVACY_ADMIN_REQUIRED' }, 403)

    // Explicitly reject the retired semantic. This review endpoint cannot claim that a
    // privacy request was fulfilled when it cannot perform the underlying operation.
    if (['complete', 'completed', 'fulfill', 'fulfilled'].includes(action)) {
      return json(request, { error: 'PRIVACY_FULFILLMENT_NOT_AVAILABLE' }, 409)
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Never return user_id or reviewer_user_id from this review surface. Identity
    // resolution belongs only in a separately approved fulfillment process.
    if (action === 'list') {
      const statusFilter = clean(body?.status, 30)
      let query = serviceClient
        .from('privacy_requests')
        .select(REVIEW_FIELDS)
        .order('created_at', { ascending: true })
        .limit(100)

      if (['submitted','in_review','awaiting_fulfillment','declined','canceled'].includes(statusFilter)) {
        query = query.eq('status', statusFilter)
      } else {
        query = query.in('status', ['submitted','in_review'])
      }

      const { data, error } = await query
      if (error) throw error
      return json(request, { success: true, enabled: true, eligible: true, requests: data || [] })
    }

    const requestId = clean(body?.request_id, 80)
    if (!UUID_PATTERN.test(requestId)) return json(request, { error: 'REQUEST_ID_INVALID' }, 400)

    if (action === 'start') {
      const now = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('privacy_requests')
        .update({
          status: 'in_review',
          reviewer_user_id: caller.id,
          reviewed_at: now,
          decision_at: null,
          staff_response: null,
          canceled_at: null,
        })
        .eq('id', requestId)
        .eq('status', 'submitted')
        .select(REVIEW_FIELDS)
        .maybeSingle()
      if (error) throw error
      if (!data) return json(request, { error: 'REQUEST_STATE_CONFLICT' }, 409)
      return json(request, { success: true, enabled: true, eligible: true, request: data })
    }

    if (action === 'accept' || action === 'decline' || action === 'reject') {
      const response = clean(body?.response, 4000)
      if (response.length < 3) return json(request, { error: 'RESPONSE_TOO_SHORT' }, 400)
      const now = new Date().toISOString()
      const accepted = action === 'accept'
      const { data, error } = await serviceClient
        .from('privacy_requests')
        .update({
          status: accepted ? 'awaiting_fulfillment' : 'declined',
          staff_response: response,
          reviewer_user_id: caller.id,
          reviewed_at: now,
          decision_at: now,
          canceled_at: null,
        })
        .eq('id', requestId)
        .eq('status', 'in_review')
        .select(REVIEW_FIELDS)
        .maybeSingle()
      if (error) throw error
      if (!data) return json(request, { error: 'REQUEST_STATE_CONFLICT' }, 409)
      return json(request, { success: true, enabled: true, eligible: true, request: data })
    }

    if (action === 'reopen') {
      const now = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('privacy_requests')
        .update({
          status: 'in_review',
          reviewer_user_id: caller.id,
          reviewed_at: now,
          decision_at: null,
          staff_response: null,
          canceled_at: null,
        })
        .eq('id', requestId)
        .in('status', ['awaiting_fulfillment','declined'])
        .select(REVIEW_FIELDS)
        .maybeSingle()
      if (error) throw error
      if (!data) return json(request, { error: 'REQUEST_STATE_CONFLICT' }, 409)
      return json(request, { success: true, enabled: true, eligible: true, request: data })
    }

    return json(request, { error: 'INVALID_ACTION' }, 400)
  } catch (error) {
    console.error('Privacy request management failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'PRIVACY_REQUEST_MANAGEMENT_FAILED' }, 500)
  }
})
