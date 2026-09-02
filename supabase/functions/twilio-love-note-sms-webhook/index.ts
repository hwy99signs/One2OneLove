// One2OneLove Twilio Love Notes SMS webhook.
// DEVELOPMENT ONLY — do not deploy/configure in Twilio until later approval.
//
// Intended future use:
//   * Twilio Messaging Service Advanced Opt-Out inbound webhook (STOP/START/HELP)
//   * server-side consent-state synchronization
//
// Security boundary: this endpoint is designed for verify_jwt=false at the Supabase
// gateway because Twilio does not send an O2OL JWT. Every state-changing request must
// instead pass Twilio's X-Twilio-Signature validation using the server-only Auth Token.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { consentHashFor, normalizeE164 } from '../_shared/loveNoteSms.ts'

const clean = (value: unknown, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const constantTimeEqual = (left: string, right: string) => {
  const a = new TextEncoder().encode(left)
  const b = new TextEncoder().encode(right)
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

const hmacSha1Base64 = async (secret: string, value: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const signatureUrlFor = (request: Request) => {
  // Reverse proxies can make the runtime URL differ from the exact public URL configured
  // in Twilio. Production must set this to the exact HTTPS webhook URL used by Twilio.
  const configured = clean(Deno.env.get('TWILIO_SMS_WEBHOOK_PUBLIC_URL'), 1000)
  if (!configured || !/^https:\/\//i.test(configured)) {
    throw new Error('O2OL_TWILIO_WEBHOOK_URL_NOT_CONFIGURED')
  }
  const requestUrl = new URL(request.url)
  const configuredUrl = new URL(configured)
  if (configuredUrl.search && configuredUrl.search !== requestUrl.search) {
    throw new Error('O2OL_TWILIO_WEBHOOK_QUERY_MISMATCH')
  }
  return configuredUrl.toString()
}

const validateTwilioSignature = async (request: Request, form: URLSearchParams) => {
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
  const supplied = clean(request.headers.get('x-twilio-signature'), 300)
  if (!authToken || authToken.length < 16 || !supplied) return false

  const url = signatureUrlFor(request)
  const pairs = Array.from(form.entries()).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const keyOrder = leftKey.localeCompare(rightKey)
    return keyOrder !== 0 ? keyOrder : leftValue.localeCompare(rightValue)
  })
  let signedValue = url
  for (const [key, value] of pairs) signedValue += `${key}${value}`
  const expected = await hmacSha1Base64(authToken, signedValue)
  return constantTimeEqual(expected, supplied)
}

const emptyTwiml = (status = 200) =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })

serve(async (request) => {
  if (request.method !== 'POST') return emptyTwiml(405)
  if (Deno.env.get('LOVE_NOTE_SMS_WEBHOOK_ENABLED') !== 'true') return emptyTwiml(503)

  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/x-www-form-urlencoded')) {
      return emptyTwiml(415)
    }

    const rawBody = await request.text()
    if (!rawBody || rawBody.length > 32_000) return emptyTwiml(400)
    const form = new URLSearchParams(rawBody)
    if (!(await validateTwilioSignature(request, form))) return emptyTwiml(403)

    const optOutType = clean(form.get('OptOutType'), 20).toUpperCase()
    // Advanced Opt-Out sends STOP, START or HELP. Ignore ordinary inbound content rather
    // than storing Love Note replies or message bodies in this compliance endpoint.
    if (!['STOP', 'START', 'HELP'].includes(optOutType)) return emptyTwiml(200)

    const from = normalizeE164(form.get('From'))
    if (!from) return emptyTwiml(400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceRoleKey) return emptyTwiml(503)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const phoneHash = await consentHashFor(from)
    const now = new Date().toISOString()

    if (optOutType === 'HELP') {
      // Twilio handles the configured HELP reply. No consent state changes here.
      return emptyTwiml(200)
    }

    const { data: existing, error: lookupError } = await serviceClient
      .from('love_note_sms_consents')
      .select('id, language, program_version, disclosure_version, terms_version, privacy_version')
      .eq('phone_hash', phoneHash)
      .maybeSingle()
    if (lookupError) return emptyTwiml(503)

    if (optOutType === 'STOP') {
      if (existing?.id) {
        const { error } = await serviceClient
          .from('love_note_sms_consents')
          .update({ status: 'revoked', revoked_at: now, updated_at: now })
          .eq('id', existing.id)
        if (error) return emptyTwiml(503)
      }
      // No record is also safe: Twilio has blocked the destination and O2OL's own
      // requireVerifiedSmsConsent will continue to deny it because no active consent exists.
      return emptyTwiml(200)
    }

    // START is accepted only as a re-subscription for a number O2OL already knows. The
    // signed provider callback proves control of the originating number for this event,
    // so START is the one staged path that may promote a known record to verified active
    // consent. An unrelated START from an unknown number never creates O2OL consent.
    if (!existing?.id) return emptyTwiml(200)

    const { error: startError } = await serviceClient
      .from('love_note_sms_consents')
      .update({
        status: 'active',
        consent_method: 'inbound_keyword',
        consented_at: now,
        verified_at: now,
        revoked_at: null,
        updated_at: now,
      })
      .eq('id', existing.id)
    if (startError) return emptyTwiml(503)

    return emptyTwiml(200)
  } catch (error) {
    console.error('twilio-love-note-sms-webhook failed:', error instanceof Error ? error.message : 'unknown')
    return emptyTwiml(500)
  }
})
