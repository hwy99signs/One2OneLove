// One2OneLove Love Notes SMS consent-intent capture.
// DEVELOPMENT ONLY — do not deploy/enable until a later production approval.
// This endpoint records a recipient-controlled website opt-in intent without exposing
// the consent table to browser roles and without persisting the raw/partial phone number.
// A website checkbox alone never authorizes SMS sending: captured rows remain
// pending_verification until a separately reviewed workflow proves number control.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  consentHashFor,
  normalizeE164,
  normalizeSmsLanguage,
} from '../_shared/loveNoteSms.ts'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const PROGRAM_VERSION = 'love-notes-transactional-v1'
const DISCLOSURE_VERSION = 'sms-consent-2026-08-20-v1'
const TERMS_VERSION = 'sms-terms-draft-2026-08-20-v1'
const PRIVACY_VERSION = 'sms-privacy-draft-2026-08-20-v1'

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
    headers: {
      ...corsHeadersFor(request),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  // Separate switch from SMS sending. A consent-intent form can be tested without ever
  // activating delivery, but production capture remains fail-closed by default.
  if (Deno.env.get('LOVE_NOTE_SMS_CONSENT_CAPTURE_ENABLED') !== 'true') {
    return json(request, { error: 'SMS_CONSENT_CAPTURE_DISABLED' }, 503)
  }

  try {
    const body = await request.json()
    if (body?.consent_checked !== true || body?.owns_number !== true) {
      return json(request, { error: 'EXPLICIT_RECIPIENT_CONSENT_REQUIRED' }, 400)
    }

    const phone = normalizeE164(body?.phone)
    if (!phone) return json(request, { error: 'SMS_PHONE_E164_REQUIRED' }, 400)

    const language = normalizeSmsLanguage(body?.language)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceRoleKey) return json(request, { error: 'BACKEND_NOT_CONFIGURED' }, 503)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const phoneHash = await consentHashFor(phone)
    const evidenceRef = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error } = await serviceClient
      .from('love_note_sms_consents')
      .upsert({
        phone_hash: phoneHash,
        status: 'pending_verification',
        consent_method: 'web_form',
        language,
        program_version: PROGRAM_VERSION,
        disclosure_version: DISCLOSURE_VERSION,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        evidence_ref: evidenceRef,
        consented_at: now,
        verified_at: null,
        revoked_at: null,
        updated_at: now,
      }, { onConflict: 'phone_hash' })

    if (error) {
      console.error('Love Note SMS consent-intent persistence failed:', error.code || 'unknown')
      return json(request, { error: 'SMS_CONSENT_SAVE_UNAVAILABLE' }, 503)
    }

    // Never echo the phone or hash. The receipt is an opaque event reference only.
    // pending_verification is deliberately non-authorizing; the SMS send adapter accepts
    // only active consent produced by a separately approved verification workflow.
    return json(request, {
      success: true,
      status: 'pending_verification',
      verification_required: true,
      language,
      consent_receipt: evidenceRef,
      program_version: PROGRAM_VERSION,
      disclosure_version: DISCLOSURE_VERSION,
    })
  } catch (error) {
    console.error('manage-love-note-sms-consent error:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'SMS_CONSENT_UNAVAILABLE' }, 500)
  }
})
