// Supabase Edge Function: submit-professional-application
// Public pre-membership intake for therapist, influencer and professional partners.
//
// DEVELOPMENT CODE. Do not deploy/enable until the professional_applications migration,
// allowed origins and anti-abuse controls are included in an approved production batch.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const ALLOWED_TYPES = new Set(['therapist', 'influencer', 'professional'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const normalizeEmail = (value: unknown) => clean(value, 320).toLowerCase()

const allowedOrigins = () => {
  const configured = (Deno.env.get('PROFESSIONAL_APPLICATION_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(configured.length ? configured : [DEFAULT_ORIGIN])
}

const corsHeadersFor = (request: Request) => {
  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  const allowed = allowedOrigins()
  const responseOrigin = allowed.has(origin) ? origin : DEFAULT_ORIGIN

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

const sanitizeDetails = (details: unknown) => {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {}

  const serialized = JSON.stringify(details)
  if (serialized.length > 20_000) throw new Error('APPLICATION_DETAILS_TOO_LARGE')

  // Round-trip through JSON so only plain serializable input reaches jsonb.
  return JSON.parse(serialized)
}

const verifyTurnstileIfRequired = async (request: Request, token: string) => {
  if (Deno.env.get('PROFESSIONAL_APPLICATION_TURNSTILE_REQUIRED') !== 'true') return true

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY') || ''
  if (!secret || !token) return false

  const form = new FormData()
  form.set('secret', secret)
  form.set('response', token)

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim()
  if (forwardedFor) form.set('remoteip', forwardedFor)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })

  if (!response.ok) return false
  const result = await response.json()
  return result?.success === true
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(request) })
  }

  if (request.method !== 'POST') {
    return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) {
    return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  }

  // A production operator must explicitly enable intake after the database, origins
  // and anti-abuse configuration are ready. Deployment alone cannot start intake.
  if (Deno.env.get('PROFESSIONAL_APPLICATIONS_ENABLED') !== 'true') {
    return json(request, { error: 'APPLICATIONS_NOT_ENABLED' }, 503)
  }

  try {
    const body = await request.json()
    const applicationType = clean(body?.applicationType, 30).toLowerCase()
    const firstName = clean(body?.firstName, 80)
    const lastName = clean(body?.lastName, 80)
    const email = normalizeEmail(body?.email)
    const phone = clean(body?.phone, 40)
    const details = sanitizeDetails(body?.details)
    const turnstileToken = clean(body?.turnstileToken, 2048)

    if (!ALLOWED_TYPES.has(applicationType)) {
      return json(request, { error: 'INVALID_APPLICATION_TYPE' }, 400)
    }
    if (!firstName || !lastName) {
      return json(request, { error: 'NAME_REQUIRED' }, 400)
    }
    if (!EMAIL_PATTERN.test(email)) {
      return json(request, { error: 'VALID_EMAIL_REQUIRED' }, 400)
    }
    if (phone.length < 7) {
      return json(request, { error: 'VALID_PHONE_REQUIRED' }, 400)
    }

    const turnstileValid = await verifyTurnstileIfRequired(request, turnstileToken)
    if (!turnstileValid) {
      return json(request, { error: 'ANTI_ABUSE_CHECK_FAILED' }, 403)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Professional application backend is missing Supabase service configuration')
      return json(request, { error: 'BACKEND_NOT_CONFIGURED' }, 503)
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await serviceClient
      .from('professional_applications')
      .insert({
        application_type: applicationType,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        details,
        status: 'submitted',
        email_verified: false,
        phone_verified: false,
      })
      .select('id, application_type, status, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return json(request, { error: 'ACTIVE_APPLICATION_EXISTS' }, 409)
      }
      console.error('Professional application insert failed:', error)
      return json(request, { error: 'APPLICATION_SAVE_FAILED' }, 500)
    }

    return json(request, {
      success: true,
      application: data,
      verification: {
        email: 'pending_review',
        phone: 'pending_review',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    if (message === 'APPLICATION_DETAILS_TOO_LARGE') {
      return json(request, { error: message }, 413)
    }
    console.error('Professional application request failed:', error)
    return json(request, { error: 'INVALID_REQUEST' }, 400)
  }
})
