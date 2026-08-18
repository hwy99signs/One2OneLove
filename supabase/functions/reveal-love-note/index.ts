// Supabase Edge Function: reveal-love-note
// Validates a private Love Note reveal token after authentication and returns
// only the fields needed for the recipient reveal experience.
// DEVELOPMENT CODE. Deploy only through the approved controlled rollout.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const REVEALABLE_STATUSES = new Set(['sent', 'delivered', 'revealed'])

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const normalizeEmail = (value: unknown) => clean(value, 320).toLowerCase()

const allowedOrigins = () => {
  const configured = (Deno.env.get('LOVE_NOTE_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(configured.length ? configured : [DEFAULT_ORIGIN])
}

const corsHeadersFor = (request: Request) => {
  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  const responseOrigin = allowedOrigins().has(origin) ? origin : DEFAULT_ORIGIN
  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const json = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(request), 'Content-Type': 'application/json' },
  })

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(request) })
  }
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) {
    return json(request, { error: 'Origin not allowed', code: 'ORIGIN_NOT_ALLOWED' }, 403)
  }

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return json(request, { error: 'Sign in is required to reveal this Love Note.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(request, { error: 'Server configuration is incomplete' }, 500)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json(request, { error: 'Sign in is required to reveal this Love Note.' }, 401)
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return json(request, {
        error: 'Confirm your email before revealing a Love Note.',
        code: 'EMAIL_NOT_CONFIRMED',
      }, 403)
    }

    const body = await request.json()
    const token = clean(body?.token, 128)
    if (!token || token.length < 40) return json(request, { error: 'This Love Note link is invalid.' }, 400)

    const tokenHash = await sha256(token)
    const { data: invitation, error: lookupError } = await serviceClient
      .from('love_note_invitations')
      .select('id, sender_name, recipient_name, recipient_contact, delivery_method, recipient_user_id, note_content, status, token_expires_at, revealed_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (lookupError) {
      console.error('Love Note reveal lookup failed:', lookupError)
      return json(request, { error: 'Unable to open this Love Note right now.' }, 500)
    }

    if (!invitation) return json(request, { error: 'This Love Note link is invalid or no longer available.' }, 404)

    const expiresAt = invitation.token_expires_at ? new Date(invitation.token_expires_at) : null
    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return json(request, { error: 'This Love Note link has expired.' }, 410)
    }

    // A token must never reveal a note before delivery has actually succeeded.
    if (!REVEALABLE_STATUSES.has(invitation.status)) {
      if (invitation.status === 'canceled' || invitation.status === 'failed') {
        return json(request, { error: 'This Love Note is no longer available.' }, 410)
      }
      return json(request, { error: 'This Love Note is not ready to reveal yet.' }, 409)
    }

    if (invitation.recipient_user_id && invitation.recipient_user_id !== user.id) {
      return json(request, { error: 'This Love Note has already been claimed by another account.' }, 403)
    }

    // Email invitations are additionally bound to the confirmed account email that
    // actually received the invitation. SMS remains disabled in the current rollout;
    // if enabled later, token possession + a confirmed One2OneLove account is required.
    if (invitation.delivery_method === 'email') {
      const invitedEmail = normalizeEmail(invitation.recipient_contact)
      const accountEmail = normalizeEmail(user.email)

      if (!accountEmail || accountEmail !== invitedEmail) {
        return json(request, {
          error: 'Sign in with the verified email address that received this Love Note invitation.'
        }, 403)
      }
    }

    if (!invitation.recipient_user_id) {
      const now = new Date().toISOString()
      const { data: claimed, error: claimError } = await serviceClient
        .from('love_note_invitations')
        .update({
          recipient_user_id: user.id,
          status: 'revealed',
          revealed_at: now,
        })
        .eq('id', invitation.id)
        .is('recipient_user_id', null)
        .in('status', ['sent', 'delivered'])
        .select('recipient_user_id')
        .maybeSingle()

      if (claimError) {
        console.error('Love Note claim failed:', claimError)
        return json(request, { error: 'Unable to claim this Love Note right now.' }, 409)
      }

      if (!claimed || claimed.recipient_user_id !== user.id) {
        // It may have been claimed milliseconds earlier. Re-read once so a legitimate
        // repeat request from the same recipient remains idempotent.
        const { data: current } = await serviceClient
          .from('love_note_invitations')
          .select('recipient_user_id, status')
          .eq('id', invitation.id)
          .maybeSingle()

        if (!current || current.recipient_user_id !== user.id || current.status !== 'revealed') {
          return json(request, { error: 'This Love Note was just claimed by another account.' }, 409)
        }
      }
    } else if (invitation.status !== 'revealed') {
      const { error: revealStateError } = await serviceClient
        .from('love_note_invitations')
        .update({ status: 'revealed', revealed_at: invitation.revealed_at || new Date().toISOString() })
        .eq('id', invitation.id)
        .eq('recipient_user_id', user.id)
        .in('status', ['sent', 'delivered'])

      if (revealStateError) {
        console.error('Love Note reveal-state update failed:', revealStateError)
        return json(request, { error: 'Unable to open this Love Note right now.' }, 409)
      }
    }

    return json(request, {
      invitation_id: invitation.id,
      sender_name: invitation.sender_name,
      recipient_name: invitation.recipient_name,
      note_content: invitation.note_content,
      status: 'revealed',
    })
  } catch (error) {
    console.error('reveal-love-note error:', error)
    return json(request, { error: 'Unable to reveal this Love Note right now.' }, 500)
  }
})
