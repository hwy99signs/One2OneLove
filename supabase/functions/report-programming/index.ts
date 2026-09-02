// Supabase Edge Function: report-programming
// DEVELOPMENT CODE ONLY. Member programming reports are private moderation records.
// Do not deploy until the programming moderation migration is approved and applied.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const VALID_REASONS = new Set([
  'harassment_or_hate',
  'sexual_or_exploitative',
  'dangerous_advice',
  'privacy_or_doxxing',
  'spam_or_scam',
  'copyright_or_rights',
  'other',
])

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

  if (Deno.env.get('PROGRAMMING_MODERATION_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, report: null })
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
    const slotId = clean(body?.slot_id, 80)
    const reason = clean(body?.reason, 50)
    const details = clean(body?.details, 1000)

    if (!slotId) return json(request, { error: 'SLOT_ID_REQUIRED' }, 400)
    if (!UUID_PATTERN.test(slotId)) return json(request, { error: 'SLOT_ID_INVALID' }, 400)
    if (!VALID_REASONS.has(reason)) return json(request, { error: 'INVALID_REASON' }, 400)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: slot, error: slotError } = await serviceClient
      .from('creator_programming_slots')
      .select('id,status,ends_at')
      .eq('id', slotId)
      .maybeSingle()
    if (slotError) throw slotError
    if (!slot) return json(request, { error: 'PROGRAM_NOT_FOUND' }, 404)

    // Reports are accepted for currently booked programs and recently ended/cancelled
    // programs that still exist in the schedule history; never allow arbitrary slot IDs.
    const endsAt = new Date(slot.ends_at)
    const reportWindowOpen = !Number.isNaN(endsAt.getTime()) && endsAt.getTime() > Date.now() - (24 * 60 * 60 * 1000)
    if (!reportWindowOpen) return json(request, { error: 'REPORT_WINDOW_CLOSED' }, 409)

    const { data: existing, error: existingError } = await serviceClient
      .from('programming_reports')
      .select('id,slot_id,reason,details,status,created_at')
      .eq('slot_id', slotId)
      .eq('reporter_id', caller.id)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing) return json(request, { success: true, enabled: true, report: existing, duplicate: true })

    const { data: report, error: insertError } = await serviceClient
      .from('programming_reports')
      .insert({
        slot_id: slotId,
        reporter_id: caller.id,
        reason,
        details,
        status: 'pending',
      })
      .select('id,slot_id,reason,details,status,created_at')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: raced, error: raceError } = await serviceClient
          .from('programming_reports')
          .select('id,slot_id,reason,details,status,created_at')
          .eq('slot_id', slotId)
          .eq('reporter_id', caller.id)
          .single()
        if (raceError) throw raceError
        return json(request, { success: true, enabled: true, report: raced, duplicate: true })
      }
      throw insertError
    }

    return json(request, { success: true, enabled: true, report, duplicate: false })
  } catch (error) {
    console.error('Programming report failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'PROGRAMMING_REPORT_FAILED' }, 500)
  }
})
