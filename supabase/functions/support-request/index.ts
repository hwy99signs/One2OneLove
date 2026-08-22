// Supabase Edge Function: support-request
// DEVELOPMENT CODE ONLY. Provides a private in-app support channel for authenticated
// One2OneLove members without requiring an external email/SMS provider.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const MAX_OPEN_REQUESTS = 5
const VALID_CATEGORIES = new Set(['account','technical','billing','safety','feedback','other'])
const MEMBER_FIELDS = 'id,category,subject,message,status,staff_response,responded_at,member_response_read_at,closed_at,created_at,updated_at'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('SUPPORT_REQUEST_ALLOWED_ORIGINS') || Deno.env.get('CREATOR_PROGRAMMING_ALLOWED_ORIGINS') || '')
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

const requireRequestId = (request: Request, value: unknown) => {
  const requestId = clean(value, 80)
  if (!requestId) return { response: json(request, { error: 'REQUEST_ID_REQUIRED' }, 400), requestId: '' }
  if (!UUID_PATTERN.test(requestId)) return { response: json(request, { error: 'REQUEST_ID_INVALID' }, 400), requestId: '' }
  return { response: null, requestId }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!configuredOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  if (Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, request: null, requests: [] })
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
    const action = clean(body?.action, 30) || 'list'
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (action === 'list') {
      const { data, error } = await serviceClient
        .from('support_requests')
        .select(MEMBER_FIELDS)
        .eq('user_id', caller.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return json(request, { success: true, enabled: true, requests: data || [] })
    }

    if (action === 'get') {
      const { response, requestId } = requireRequestId(request, body?.request_id)
      if (response) return response
      const { data, error } = await serviceClient
        .from('support_requests')
        .select(MEMBER_FIELDS)
        .eq('id', requestId)
        .eq('user_id', caller.id)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, request: data || null })
    }

    if (action === 'mark_response_read') {
      const { response, requestId } = requireRequestId(request, body?.request_id)
      if (response) return response
      const readAt = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({ member_response_read_at: readAt })
        .eq('id', requestId)
        .eq('user_id', caller.id)
        .not('staff_response', 'is', null)
        .select(MEMBER_FIELDS)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, request: data || null })
    }

    if (action === 'close') {
      const { response, requestId } = requireRequestId(request, body?.request_id)
      if (response) return response
      const closedAt = new Date().toISOString()
      const { data, error } = await serviceClient
        .from('support_requests')
        .update({ status: 'closed', closed_at: closedAt })
        .eq('id', requestId)
        .eq('user_id', caller.id)
        .in('status', ['open','in_progress','resolved'])
        .select(MEMBER_FIELDS)
        .maybeSingle()
      if (error) throw error
      if (data) {
        const { error: auditError } = await serviceClient.from('support_request_audit').insert({ request_id: data.id, actor_user_id: caller.id, action: 'member_closed' })
        if (auditError) throw auditError
      }
      return json(request, { success: true, enabled: true, request: data || null })
    }

    if (action !== 'create') return json(request, { error: 'INVALID_ACTION' }, 400)

    const category = clean(body?.category, 30)
    const subject = clean(body?.subject, 120)
    const message = clean(body?.message, 4000)
    if (!VALID_CATEGORIES.has(category)) return json(request, { error: 'INVALID_CATEGORY' }, 400)
    if (subject.length < 3) return json(request, { error: 'SUBJECT_TOO_SHORT' }, 400)
    if (message.length < 10) return json(request, { error: 'MESSAGE_TOO_SHORT' }, 400)

    const { count, error: countError } = await serviceClient
      .from('support_requests')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', caller.id)
      .in('status', ['open','in_progress'])
    if (countError) throw countError
    if ((count || 0) >= MAX_OPEN_REQUESTS) return json(request, { error: 'OPEN_REQUEST_LIMIT_REACHED' }, 409)

    const { data: created, error: insertError } = await serviceClient
      .from('support_requests')
      .insert({ user_id: caller.id, category, subject, message, status: 'open' })
      .select(MEMBER_FIELDS)
      .single()
    if (insertError) {
      if (
        insertError.code === 'P0001'
        && String(insertError.message || '').includes('SUPPORT_OPEN_REQUEST_LIMIT_REACHED')
      ) {
        return json(request, { error: 'OPEN_REQUEST_LIMIT_REACHED' }, 409)
      }
      throw insertError
    }

    const { error: auditError } = await serviceClient.from('support_request_audit').insert({ request_id: created.id, actor_user_id: caller.id, action: 'created' })
    if (auditError) throw auditError

    return json(request, { success: true, enabled: true, request: created })
  } catch (error) {
    console.error('Member support request failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'SUPPORT_REQUEST_FAILED' }, 500)
  }
})
