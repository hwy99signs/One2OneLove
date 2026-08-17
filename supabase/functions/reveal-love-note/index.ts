// Supabase Edge Function: reveal-love-note
// Validates a private Love Note reveal token after authentication and returns
// only the fields needed for the recipient reveal experience.
// DEVELOPMENT CODE: do not deploy until the Love Notes migration is approved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Sign in is required to reveal this Love Note.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Server configuration is incomplete' }, 500)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Sign in is required to reveal this Love Note.' }, 401)

    const body = await req.json()
    const token = clean(body?.token, 128)
    if (!token || token.length < 40) return json({ error: 'This Love Note link is invalid.' }, 400)

    const tokenHash = await sha256(token)
    const { data: invitation, error: lookupError } = await serviceClient
      .from('love_note_invitations')
      .select('id, sender_name, recipient_name, recipient_user_id, note_content, status, token_expires_at, revealed_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (lookupError) {
      console.error('Love Note reveal lookup failed:', lookupError)
      return json({ error: 'Unable to open this Love Note right now.' }, 500)
    }

    if (!invitation) return json({ error: 'This Love Note link is invalid or no longer available.' }, 404)

    const expiresAt = invitation.token_expires_at ? new Date(invitation.token_expires_at) : null
    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return json({ error: 'This Love Note link has expired.' }, 410)
    }

    if (invitation.status === 'canceled' || invitation.status === 'failed') {
      return json({ error: 'This Love Note is no longer available.' }, 410)
    }

    if (invitation.recipient_user_id && invitation.recipient_user_id !== user.id) {
      return json({ error: 'This Love Note has already been claimed by another account.' }, 403)
    }

    if (!invitation.recipient_user_id) {
      const { error: claimError } = await serviceClient
        .from('love_note_invitations')
        .update({
          recipient_user_id: user.id,
          status: 'revealed',
          revealed_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)
        .is('recipient_user_id', null)

      if (claimError) {
        console.error('Love Note claim failed:', claimError)
        return json({ error: 'Unable to claim this Love Note right now.' }, 409)
      }
    } else if (invitation.status !== 'revealed') {
      await serviceClient
        .from('love_note_invitations')
        .update({ status: 'revealed', revealed_at: invitation.revealed_at || new Date().toISOString() })
        .eq('id', invitation.id)
        .eq('recipient_user_id', user.id)
    }

    return json({
      invitation_id: invitation.id,
      sender_name: invitation.sender_name,
      recipient_name: invitation.recipient_name,
      note_content: invitation.note_content,
      status: 'revealed',
    })
  } catch (error) {
    console.error('reveal-love-note error:', error)
    return json({ error: 'Unable to reveal this Love Note right now.' }, 500)
  }
})
