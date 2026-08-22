// Supabase Edge Function: privacy-request
// Authenticated self-service intake for data-export and account-deletion requests.
//
// DEVELOPMENT CODE. Do not deploy/enable until the privacy_requests migration, final
// privacy/retention policy, allowed origins and controlled tests are production-approved.
// This function records requests only. It does NOT delete an account or generate an export.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const ALLOWED_TYPES = new Set(['data_export', 'account_deletion'])

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const allowedOrigins = () => {
  const configured = (Deno.env.get('PRIVACY_REQUEST_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(configured.length ? configured : [DEFAULT_ORIGIN])
}

const corsHeadersFor = (request: Request) => {
  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  const allowed = allowedOrigins()
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

const bearerToken = (request: Request) => {
  const header = request.headers.get('authorization') || ''
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  // Fail the entire member endpoint closed while production activation is OFF. History
  // reads are part of the privacy feature too and must not become live merely because the
  // function was deployed for controlled setup.
  if (Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true') {
    return json(request, { error: 'REQUESTS_NOT_ENABLED' }, 503)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const token = bearerToken(request)
  if (!supabaseUrl || !serviceRoleKey) return json(request, { error: 'BACKEND_NOT_CONFIGURED' }, 503)
  if (!token) return json(request, { error: 'AUTH_REQUIRED' }, 401)

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await serviceClient.auth.getUser(token)
  const user = authData?.user
  if (authError || !user) return json(request, { error: 'AUTH_REQUIRED' }, 401)
  if (!user.email_confirmed_at && !user.confirmed_at) return json(request, { error: 'EMAIL_CONFIRMATION_REQUIRED' }, 403)

  try {
    const body = await request.json().catch(() => ({}))
    const action = clean(body?.action, 20).toLowerCase() || 'list'

    if (action === 'list') {
      const { data, error } = await serviceClient
        .from('privacy_requests')
        .select('id, request_type, status, created_at, updated_at, completed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Privacy request list failed:', error)
        return json(request, { error: 'REQUEST_LIST_FAILED' }, 500)
      }
      return json(request, { success: true, requests: data || [] })
    }

    if (action !== 'create') return json(request, { error: 'INVALID_ACTION' }, 400)

    const requestType = clean(body?.requestType, 40).toLowerCase()
    const memberNote = clean(body?.memberNote, 500) || null
    if (!ALLOWED_TYPES.has(requestType)) return json(request, { error: 'INVALID_REQUEST_TYPE' }, 400)

    const { data: existing, error: existingError } = await serviceClient
      .from('privacy_requests')
      .select('id, request_type, status, created_at, updated_at, completed_at')
      .eq('user_id', user.id)
      .eq('request_type', requestType)
      .in('status', ['submitted', 'in_review'])
      .maybeSingle()

    if (existingError) {
      console.error('Privacy duplicate check failed:', existingError)
      return json(request, { error: 'REQUEST_CHECK_FAILED' }, 500)
    }
    if (existing) return json(request, { success: true, request: existing, duplicate: true })

    const { data, error } = await serviceClient
      .from('privacy_requests')
      .insert({ user_id: user.id, request_type: requestType, status: 'submitted', member_note: memberNote })
      .select('id, request_type, status, created_at, updated_at, completed_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        const { data: duplicate } = await serviceClient
          .from('privacy_requests')
          .select('id, request_type, status, created_at, updated_at, completed_at')
          .eq('user_id', user.id)
          .eq('request_type', requestType)
          .in('status', ['submitted', 'in_review'])
          .maybeSingle()
        return json(request, { success: true, request: duplicate, duplicate: true })
      }
      console.error('Privacy request insert failed:', error)
      return json(request, { error: 'REQUEST_SAVE_FAILED' }, 500)
    }

    return json(request, { success: true, request: data, duplicate: false })
  } catch (error) {
    console.error('Privacy request failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'INVALID_REQUEST' }, 400)
  }
})
