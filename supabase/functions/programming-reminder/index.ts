// Supabase Edge Function: programming-reminder
// DEVELOPMENT CODE ONLY. Member reminder writes are mediated here so callers cannot
// choose arbitrary user IDs, reminder times, or non-existent programming slots.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const REMINDER_LEAD_MS = 15 * 60 * 1000

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

  if (Deno.env.get('PROGRAMMING_REMINDERS_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, reminder: null })
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
    const action = clean(body?.action, 20) || 'status'
    const slotId = clean(body?.slot_id, 80)
    if (!slotId) return json(request, { error: 'SLOT_ID_REQUIRED' }, 400)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (action === 'status') {
      const { data, error } = await serviceClient
        .from('programming_reminders')
        .select('id,slot_id,remind_at,status,created_at,updated_at')
        .eq('user_id', caller.id)
        .eq('slot_id', slotId)
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, reminder: data || null })
    }

    if (action === 'cancel') {
      const { data, error } = await serviceClient
        .from('programming_reminders')
        .update({ status: 'cancelled' })
        .eq('user_id', caller.id)
        .eq('slot_id', slotId)
        .in('status', ['active', 'processing'])
        .select('id,slot_id,remind_at,status,created_at,updated_at')
        .maybeSingle()
      if (error) throw error
      return json(request, { success: true, enabled: true, reminder: data || null })
    }

    if (action !== 'set') return json(request, { error: 'INVALID_ACTION' }, 400)

    const { data: slot, error: slotError } = await serviceClient
      .from('creator_programming_slots')
      .select('id,starts_at,status')
      .eq('id', slotId)
      .eq('status', 'booked')
      .single()

    if (slotError || !slot) return json(request, { error: 'PROGRAM_NOT_AVAILABLE' }, 404)

    const startsAt = new Date(slot.starts_at)
    const now = new Date()
    if (Number.isNaN(startsAt.getTime()) || startsAt <= now) {
      return json(request, { error: 'PROGRAM_ALREADY_STARTED' }, 409)
    }

    const desiredReminder = new Date(startsAt.getTime() - REMINDER_LEAD_MS)
    const remindAt = desiredReminder > now ? desiredReminder : now

    const { data: existing, error: existingError } = await serviceClient
      .from('programming_reminders')
      .select('id,status')
      .eq('user_id', caller.id)
      .eq('slot_id', slotId)
      .maybeSingle()
    if (existingError) throw existingError

    let reminder
    if (existing) {
      const { data, error } = await serviceClient
        .from('programming_reminders')
        .update({ remind_at: remindAt.toISOString(), status: 'active' })
        .eq('id', existing.id)
        .eq('user_id', caller.id)
        .select('id,slot_id,remind_at,status,created_at,updated_at')
        .single()
      if (error) throw error
      reminder = data
    } else {
      const { data, error } = await serviceClient
        .from('programming_reminders')
        .insert({ user_id: caller.id, slot_id: slotId, remind_at: remindAt.toISOString(), status: 'active' })
        .select('id,slot_id,remind_at,status,created_at,updated_at')
        .single()
      if (error) {
        if (error.code === '23505') {
          const { data: raced, error: raceError } = await serviceClient
            .from('programming_reminders')
            .update({ remind_at: remindAt.toISOString(), status: 'active' })
            .eq('user_id', caller.id)
            .eq('slot_id', slotId)
            .select('id,slot_id,remind_at,status,created_at,updated_at')
            .single()
          if (raceError) throw raceError
          reminder = raced
        } else {
          throw error
        }
      } else {
        reminder = data
      }
    }

    return json(request, { success: true, enabled: true, reminder })
  } catch (error) {
    console.error('Programming reminder action failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'PROGRAMMING_REMINDER_FAILED' }, 500)
  }
})
