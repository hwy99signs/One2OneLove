// Supabase Edge Function: manage-professional-applications
// DEVELOPMENT CODE ONLY. Provides a private review queue for professional, therapist and
// influencer applications. It never creates accounts, changes users.user_type, sends
// messages, or grants member/staff authority.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REVIEW_FIELDS = 'id,application_type,first_name,last_name,email,phone,details,status,email_verified,phone_verified,reviewer_user_id,reviewed_at,review_notes,created_at,updated_at'

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

const allowedAdminIds = () => new Set(
  (Deno.env.get('O2OL_PROFESSIONAL_APPLICATION_ADMIN_USER_IDS') || '')
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

  if (Deno.env.get('PROFESSIONAL_APPLICATION_REVIEW_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, eligible: false, applications: [] })
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

    const eligible = allowedAdminIds().has(caller.id)
    const body = await request.json().catch(() => ({}))
    const action = clean(body?.action, 30) || 'access'

    if (action === 'access') return json(request, { success: true, enabled: true, eligible })
    if (!eligible) return json(request, { error: 'O2OL_PRO_APPLICATION_ADMIN_REQUIRED' }, 403)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (action === 'list') {
      const status = clean(body?.status, 30)
      const type = clean(body?.application_type, 30)
      let query = serviceClient
        .from('professional_applications')
        .select(REVIEW_FIELDS)
        .order('created_at', { ascending: true })
        .limit(100)
      if (['submitted','under_review','approved','rejected','withdrawn'].includes(status)) query = query.eq('status', status)
      else query = query.in('status', ['submitted','under_review'])
      if (['therapist','influencer','professional'].includes(type)) query = query.eq('application_type', type)
      const { data, error } = await query
      if (error) throw error
      return json(request, { success: true, enabled: true, eligible: true, applications: data || [] })
    }

    const applicationId = clean(body?.application_id, 80)
    if (!UUID_PATTERN.test(applicationId)) return json(request, { error: 'APPLICATION_ID_INVALID' }, 400)

    if (action === 'get') {
      const { data, error } = await serviceClient
        .from('professional_applications')
        .select(REVIEW_FIELDS)
        .eq('id', applicationId)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, eligible: true, application: data || null })
    }

    const now = new Date().toISOString()
    const reviewNotes = clean(body?.review_notes, 4000) || null
    let nextStatus = ''
    let auditAction = ''
    let allowedStatuses: string[] = []

    if (action === 'start') {
      nextStatus = 'under_review'
      auditAction = 'review_started'
      allowedStatuses = ['submitted']
    } else if (action === 'approve') {
      nextStatus = 'approved'
      auditAction = 'approved'
      allowedStatuses = ['under_review']
    } else if (action === 'reject') {
      if (!reviewNotes || reviewNotes.length < 3) return json(request, { error: 'REVIEW_NOTES_REQUIRED' }, 400)
      nextStatus = 'rejected'
      auditAction = 'rejected'
      allowedStatuses = ['submitted','under_review']
    } else if (action === 'reopen') {
      nextStatus = 'under_review'
      auditAction = 'reopened'
      allowedStatuses = ['approved','rejected']
    } else {
      return json(request, { error: 'INVALID_ACTION' }, 400)
    }

    const { data: updated, error: updateError } = await serviceClient
      .from('professional_applications')
      .update({
        status: nextStatus,
        reviewer_user_id: caller.id,
        reviewed_at: now,
        review_notes: reviewNotes,
      })
      .eq('id', applicationId)
      .in('status', allowedStatuses)
      .select(REVIEW_FIELDS)
      .maybeSingle()

    if (updateError) {
      if (updateError.code === 'P0001' && String(updateError.message || '').includes('O2OL_PRO_APPLICATION_VERIFICATION_REQUIRED')) {
        return json(request, { error: 'APPLICATION_VERIFICATION_REQUIRED' }, 409)
      }
      throw updateError
    }
    if (!updated) return json(request, { error: 'APPLICATION_STATE_CONFLICT' }, 409)

    const { error: auditError } = await serviceClient
      .from('professional_application_audit')
      .insert({ application_id: updated.id, actor_user_id: caller.id, action: auditAction })
    if (auditError) {
      console.error('Professional application audit persistence failed:', auditError.code || 'unknown')
      return json(request, { error: 'APPLICATION_REVIEW_RECONCILIATION_REQUIRED' }, 503)
    }

    return json(request, { success: true, enabled: true, eligible: true, application: updated })
  } catch (error) {
    console.error('Professional application review failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'PROFESSIONAL_APPLICATION_REVIEW_FAILED' }, 500)
  }
})
