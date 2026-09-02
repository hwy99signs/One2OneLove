// Supabase Edge Function: member-block
// DEVELOPMENT CODE ONLY. Blocker ownership always comes from the authenticated session.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('MEMBER_SAFETY_ALLOWED_ORIGINS') || '')
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

  if (Deno.env.get('MEMBER_BLOCKING_ENABLED') !== 'true') {
    return json(request, { success: true, enabled: false, blocked_ids: [] })
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
    const action = clean(body?.action, 20) || 'list'
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (action === 'list') {
      const { data, error } = await serviceClient
        .from('member_blocks')
        .select('blocked_id,created_at')
        .eq('blocker_id', caller.id)
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return json(request, { success: true, enabled: true, blocks: data || [], blocked_ids: (data || []).map((row) => row.blocked_id) })
    }

    const blockedId = clean(body?.blocked_user_id, 80)
    if (!blockedId) return json(request, { error: 'BLOCKED_USER_REQUIRED' }, 400)
    if (!UUID_PATTERN.test(blockedId)) return json(request, { error: 'BLOCKED_USER_INVALID' }, 400)
    if (blockedId === caller.id) return json(request, { error: 'CANNOT_BLOCK_SELF' }, 400)

    if (action === 'unblock') {
      const { error } = await serviceClient
        .from('member_blocks')
        .delete()
        .eq('blocker_id', caller.id)
        .eq('blocked_id', blockedId)
      if (error) throw error
      return json(request, { success: true, enabled: true, blocked: false, blocked_user_id: blockedId })
    }

    if (action !== 'block') return json(request, { error: 'INVALID_ACTION' }, 400)

    const { data: target, error: targetError } = await serviceClient
      .from('users')
      .select('id')
      .eq('id', blockedId)
      .maybeSingle()
    if (targetError) throw targetError
    if (!target) return json(request, { error: 'MEMBER_NOT_FOUND' }, 404)

    const { error: insertError } = await serviceClient
      .from('member_blocks')
      .upsert({ blocker_id: caller.id, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true })
    if (insertError) throw insertError

    return json(request, { success: true, enabled: true, blocked: true, blocked_user_id: blockedId })
  } catch (error) {
    console.error('Member block action failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'MEMBER_BLOCK_FAILED' }, 500)
  }
})
