// Supabase Edge Function: list-blocked-members
// DEVELOPMENT CODE ONLY. Returns only the current member's blocked account IDs plus
// display names resolved from the privacy-minimized directory source; no email, partner,
// billing or verification data. Missing display names stay blank so the client can render
// the correct localized fallback rather than receiving server-authored English prose.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'

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

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: blocks, error: blockError } = await serviceClient
      .from('member_blocks')
      .select('blocked_id,created_at')
      .eq('blocker_id', caller.id)
      .order('created_at', { ascending: false })
      .limit(500)
    if (blockError) throw blockError

    const ids = (blocks || []).map((row) => row.blocked_id)
    if (!ids.length) return json(request, { success: true, enabled: true, members: [] })

    // Resolve display-only identity from the same minimized five-field directory source
    // used elsewhere in the relaunch. service_role is used only so a member can continue
    // to see/manage their own block list even though the pairwise directory RLS hides the
    // blocked account during normal discovery.
    const { data: profiles, error: profileError } = await serviceClient
      .from('user_directory_profiles')
      .select('id,name')
      .in('id', ids)
    if (profileError) throw profileError

    const names = new Map((profiles || []).map((profile) => [profile.id, String(profile.name || '').trim()]))
    const members = (blocks || []).map((block) => ({
      id: block.blocked_id,
      name: names.get(block.blocked_id) || '',
      blocked_at: block.created_at,
    }))

    return json(request, { success: true, enabled: true, members })
  } catch (error) {
    console.error('Blocked member listing failed:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'BLOCKED_MEMBER_LIST_FAILED' }, 500)
  }
})
