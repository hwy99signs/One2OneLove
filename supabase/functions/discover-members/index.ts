// Supabase Edge Function: discover-members
// DEVELOPMENT CODE ONLY. Provides privacy-minimized member discovery while excluding
// both directions of a blocked pair before any results reach the browser.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const MAX_RESULTS = 50

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const configuredOrigins = () => {
  const values = (Deno.env.get('MEMBER_SAFETY_ALLOWED_ORIGINS') || Deno.env.get('CREATOR_PROGRAMMING_ALLOWED_ORIGINS') || '')
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
    return json(request, { success: true, enabled: false, members: [] })
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
    const search = clean(body?.search, 80).replace(/[%_]/g, '')
    const requestedLimit = Number.parseInt(String(body?.limit || ''), 10)
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, MAX_RESULTS)) : 25

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // service_role is used only to calculate both directions of the block relationship;
    // normal member RLS intentionally exposes only the caller's own block rows.
    const [{ data: outbound, error: outboundError }, { data: inbound, error: inboundError }] = await Promise.all([
      serviceClient.from('member_blocks').select('blocked_id').eq('blocker_id', caller.id),
      serviceClient.from('member_blocks').select('blocker_id').eq('blocked_id', caller.id),
    ])
    if (outboundError) throw outboundError
    if (inboundError) throw inboundError

    const excluded = new Set<string>([caller.id])
    for (const row of outbound || []) excluded.add(row.blocked_id)
    for (const row of inbound || []) excluded.add(row.blocker_id)

    // Run the actual directory lookup as the authenticated caller, not service_role.
    // This preserves member_directory/security_invoker source RLS as a second barrier if
    // manual exclusion logic is ever changed or regresses.
    let query = callerClient
      .from('member_directory')
      .select('id,name,avatar_url,bio,created_at')
      .order('name', { ascending: true })
      .limit(limit)

    if (search) query = query.ilike('name', `%${search}%`)
    if (excluded.size) query = query.not('id', 'in', `(${Array.from(excluded).join(',')})`)

    const { data: members, error: directoryError } = await query
    if (directoryError) throw directoryError

    // Explicit output mapping prevents a future expansion of member_directory from
    // silently expanding this endpoint's public payload. Do not synthesize English
    // display names here; the multilingual client supplies its localized fallback.
    const safeMembers = (members || []).map((member) => ({
      id: member.id,
      name: clean(member.name, 80) || null,
      avatar_url: clean(member.avatar_url, 1000) || null,
      bio: clean(member.bio, 500) || null,
      created_at: member.created_at || null,
    }))

    return json(request, { success: true, enabled: true, members: safeMembers })
  } catch {
    console.error('Member discovery failed')
    return json(request, { error: 'MEMBER_DISCOVERY_FAILED' }, 500)
  }
})
