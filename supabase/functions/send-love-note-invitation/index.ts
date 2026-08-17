// Supabase Edge Function: send-love-note-invitation
// Creates a private Love Note invitation and delivers ONLY the invitation copy.
// The Love Note content itself is never sent to the SMS/email delivery provider.
// DEVELOPMENT CODE: do not deploy until the Love Notes migration/provider are approved.

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

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const getSenderName = async (serviceClient: any, user: any) => {
  const { data } = await serviceClient
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const profileName = clean(data?.name, 80)
  const metadataName = clean(user?.user_metadata?.name, 80)
  const emailName = clean(user?.email?.split('@')?.[0], 80)
  return profileName || metadataName || emailName || 'One2OneLove member'
}

const buildCopy = (senderName: string, revealUrl: string) => ({
  sms: `💕 ${senderName} sent you a private Love Note on One2OneLove. Tap to reveal it: ${revealUrl}`,
  emailSubject: `${senderName} sent you a private Love Note 💕`,
  emailBody: `${senderName} sent you a private Love Note on One2OneLove.\n\nYour message is being kept private until you open it.\n\nReveal your Love Note: ${revealUrl}`,
})

const deliverThroughConfiguredAdapter = async ({
  method,
  to,
  invitationId,
  copy,
}: {
  method: 'sms' | 'email'
  to: string
  invitationId: string
  copy: ReturnType<typeof buildCopy>
}) => {
  const endpoint = method === 'sms'
    ? Deno.env.get('LOVE_NOTE_SMS_ENDPOINT')
    : Deno.env.get('LOVE_NOTE_EMAIL_ENDPOINT')
  const providerKey = Deno.env.get('LOVE_NOTE_DELIVERY_PROVIDER_KEY')

  if (!endpoint || !providerKey) {
    throw new Error(`${method.toUpperCase()} delivery provider is not configured`)
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: method,
      to,
      subject: method === 'email' ? copy.emailSubject : undefined,
      text: method === 'email' ? copy.emailBody : copy.sms,
      metadata: { invitation_id: invitationId, product: 'one2onelove_love_notes' },
    }),
  })

  if (!response.ok) {
    throw new Error(`Delivery provider returned ${response.status}`)
  }

  let payload: any = {}
  try {
    payload = await response.json()
  } catch {
    // Provider response body is optional.
  }

  return clean(payload?.id || payload?.message_id, 200) || null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    if (Deno.env.get('LOVE_NOTE_DELIVERY_ENABLED') !== 'true') {
      return json({
        error: 'Love Note delivery is not enabled yet.',
        code: 'DELIVERY_DISABLED',
      }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Authentication required' }, 401)

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
    if (userError || !user) return json({ error: 'Authentication required' }, 401)

    const body = await req.json()
    const deliveryMethod = body?.delivery_method === 'email' ? 'email' : 'sms'
    const recipientName = clean(body?.recipient_name, 80)
    const recipientContact = clean(body?.recipient_contact, 160)
    const noteContent = clean(body?.note_content, 500)
    const deliveryTime = body?.delivery_time === 'schedule' ? 'schedule' : 'now'
    const scheduledFor = clean(body?.scheduled_for, 80)

    if (!recipientContact || !noteContent) {
      return json({ error: 'Recipient contact and Love Note content are required.' }, 400)
    }

    let scheduledAt: string | null = null
    if (deliveryTime === 'schedule') {
      const parsed = new Date(scheduledFor)
      if (!scheduledFor || Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return json({ error: 'Scheduled delivery must be a valid future date/time.' }, 400)
      }
      scheduledAt = parsed.toISOString()
    }

    // Sender identity comes from the authenticated account, not browser-supplied text.
    const senderName = await getSenderName(serviceClient, user)
    const rawToken = randomToken()
    const tokenHash = await sha256(rawToken)
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
    if (!siteUrl) return json({ error: 'SITE_URL is not configured' }, 500)

    const revealUrl = `${siteUrl}/LoveNoteReveal?token=${encodeURIComponent(rawToken)}`
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const initialStatus = deliveryTime === 'schedule' ? 'scheduled' : 'queued'

    const { data: invitation, error: insertError } = await serviceClient
      .from('love_note_invitations')
      .insert({
        sender_user_id: user.id,
        sender_name: senderName,
        recipient_name: recipientName || null,
        recipient_contact: recipientContact,
        delivery_method: deliveryMethod,
        note_content: noteContent,
        token_hash: tokenHash,
        token_expires_at: tokenExpiresAt,
        scheduled_for: scheduledAt,
        status: initialStatus,
      })
      .select('id, status, scheduled_for, created_at')
      .single()

    if (insertError || !invitation) {
      console.error('Love Note invitation insert failed:', insertError)
      return json({ error: 'Unable to prepare Love Note invitation.' }, 500)
    }

    const copy = buildCopy(senderName, revealUrl)

    if (deliveryTime === 'schedule') {
      // A scheduled worker will deliver this later. The raw reveal token is returned
      // to that worker through a separate secure handoff design before launch; it is
      // intentionally not persisted in plaintext here.
      return json({
        invitation_id: invitation.id,
        status: 'scheduled',
        scheduled_for: invitation.scheduled_for,
        sender_name: senderName,
        invitation_preview: deliveryMethod === 'email' ? copy.emailBody : copy.sms,
      })
    }

    try {
      const providerMessageId = await deliverThroughConfiguredAdapter({
        method: deliveryMethod,
        to: recipientContact,
        invitationId: invitation.id,
        copy,
      })

      await serviceClient
        .from('love_note_invitations')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: providerMessageId,
          failure_reason: null,
        })
        .eq('id', invitation.id)

      return json({
        invitation_id: invitation.id,
        status: 'sent',
        sender_name: senderName,
      })
    } catch (deliveryError) {
      console.error('Love Note delivery failed:', deliveryError)
      await serviceClient
        .from('love_note_invitations')
        .update({
          status: 'failed',
          failure_reason: clean(deliveryError instanceof Error ? deliveryError.message : String(deliveryError), 500),
        })
        .eq('id', invitation.id)

      return json({ error: 'The Love Note invitation could not be delivered.' }, 502)
    }
  } catch (error) {
    console.error('send-love-note-invitation error:', error)
    return json({ error: 'Unable to send Love Note invitation right now.' }, 500)
  }
})
