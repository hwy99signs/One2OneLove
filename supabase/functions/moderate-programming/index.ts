// Supabase Edge Function: moderate-programming
// DEVELOPMENT CODE ONLY. Programming moderation authority comes only from the
// server-side O2OL_PROGRAMMING_ADMIN_USER_IDS allowlist; profile user_type is ignored.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('CREATOR_PROGRAMMING_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(values.length ? values : [DEFAULT_ORIGIN])
}

const allowedAdminIds = () => new Set(
  (Deno.env.get('O2OL_PROGRAMMING_ADMIN_USER_IDS') || '')
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

  if (Deno.env.get('PROGRAMMING_MODERATION_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, eligible: false, reports: [] })
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

    const eligible = allowedAdminIds().has(caller.id)
    const body = await request.json().catch(() => ({}))
    const action = clean(body?.action, 30) || 'access'

    if (action === 'access') {
      return json(request, { success: true, enabled: true, eligible })
    }
    if (!eligible) return json(request, { error: 'O2OL_PROGRAMMING_ADMIN_REQUIRED' }, 403)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (action === 'list') {
      const { data: reports, error } = await serviceClient
        .from('programming_reports')
        .select('id,slot_id,reason,details,status,created_at,creator_programming_slots(id,program_source,title,description,starts_at,ends_at,content_mode,status)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) throw error

      // Intentionally omit reporter_id from the moderation payload. Review should focus
      // on the reported program and reason, not on unnecessary member identity data.
      return json(request, { success: true, enabled: true, eligible: true, reports: reports || [] })
    }

    if (action !== 'dismiss' && action !== 'remove') {
      return json(request, { error: 'INVALID_ACTION' }, 400)
    }

    const reportId = clean(body?.report_id, 80)
    if (!reportId) return json(request, { error: 'REPORT_ID_REQUIRED' }, 400)
    if (!UUID_PATTERN.test(reportId)) return json(request, { error: 'REPORT_ID_INVALID' }, 400)

    const { data: report, error: reportError } = await serviceClient
      .from('programming_reports')
      .select('id,slot_id,status')
      .eq('id', reportId)
      .eq('status', 'pending')
      .maybeSingle()
    if (reportError) throw reportError
    if (!report) return json(request, { error: 'REPORT_NOT_PENDING' }, 409)

    if (action === 'remove') {
      // Cancelling the shared programming slot automatically triggers the staged
      // reminder-cancellation integrity path for still-active member reminders.
      const { error: slotError } = await serviceClient
        .from('creator_programming_slots')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', report.slot_id)
        .eq('status', 'booked')
      if (slotError) throw slotError

      const { error: reportsError } = await serviceClient
        .from('programming_reports')
        .update({ status: 'actioned', reviewed_at: new Date().toISOString(), reviewed_by: caller.id })
        .eq('slot_id', report.slot_id)
        .eq('status', 'pending')
      if (reportsError) throw reportsError

      return json(request, { success: true, enabled: true, eligible: true, action: 'removed', slot_id: report.slot_id })
    }

    const { data: resolved, error: resolveError } = await serviceClient
      .from('programming_reports')
      .update({ status: 'dismissed', reviewed_at: new Date().toISOString(), reviewed_by: caller.id })
      .eq('id', report.id)
      .eq('status', 'pending')
      .select('id,slot_id,reason,details,status,created_at,reviewed_at')
      .single()
    if (resolveError) throw resolveError

    return json(request, { success: true, enabled: true, eligible: true, action: 'dismissed', report: resolved })
  } catch (error) {
    console.error('Programming moderation failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'PROGRAMMING_MODERATION_FAILED' }, 500)
  }
})
