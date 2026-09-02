// Supabase Edge Function: submit-professional-application
// Public pre-membership intake for therapist, influencer and professional partners.
//
// DEVELOPMENT CODE. Do not deploy/enable until the professional_applications migration,
// allowed origins and anti-abuse controls are included in an approved production batch.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const TURNSTILE_ACTION = 'professional_application'
const ALLOWED_TYPES = new Set(['therapist', 'influencer', 'professional'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const normalizeEmail = (value: unknown) => clean(value, 320).toLowerCase()

const cleanArray = (value: unknown, { maxItems = 20, maxLength = 120 } = {}) => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of value) {
    const candidate = clean(item, maxLength)
    if (!candidate || seen.has(candidate.toLowerCase())) continue
    seen.add(candidate.toLowerCase())
    result.push(candidate)
    if (result.length >= maxItems) break
  }
  return result
}

const cleanNumber = (
  value: unknown,
  { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {},
) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) return null
  return integer ? Math.round(number) : number
}

const cleanUrl = (value: unknown, max = 1000) => {
  const candidate = clean(value, max)
  if (!candidate) return null
  try {
    const parsed = new URL(candidate)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return parsed.toString().slice(0, max)
  } catch {
    return null
  }
}

const cleanUrlMap = (value: unknown, maxEntries = 10) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: Record<string, string> = {}
  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
    const key = clean(rawKey, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '')
    const url = cleanUrl(rawValue, 1000)
    if (!key || !url) continue
    result[key] = url
    if (Object.keys(result).length >= maxEntries) break
  }
  return result
}

const sanitizeDetails = (applicationType: string, details: unknown) => {
  const source = details && typeof details === 'object' && !Array.isArray(details)
    ? details as Record<string, unknown>
    : {}

  if (applicationType === 'therapist') {
    const licensedCountries = cleanArray(source.licensedCountries, { maxItems: 20, maxLength: 100 })
    const licensedStates = cleanArray(source.licensedStates, { maxItems: 40, maxLength: 100 })
    const therapyTypes = cleanArray(source.therapyTypes, { maxItems: 20, maxLength: 120 })
    const specializations = cleanArray(source.specializations, { maxItems: 30, maxLength: 120 })
    const certifications = cleanArray(source.certifications, { maxItems: 30, maxLength: 160 })
    const yearsExperience = cleanNumber(source.yearsExperience, { min: 0, max: 80, integer: true })
    const consultationFee = cleanNumber(source.consultationFee, { min: 0, max: 100000 })
    const professionalBio = clean(source.professionalBio, 2000)
    const socialMediaPlatforms = cleanUrlMap(source.socialMediaPlatforms, 10)

    if (!licensedCountries.length || !licensedStates.length) throw new Error('THERAPIST_LICENSE_LOCATION_REQUIRED')
    if (!therapyTypes.length || !specializations.length) throw new Error('THERAPIST_SPECIALTY_REQUIRED')
    if (professionalBio.length < 50) throw new Error('THERAPIST_BIO_REQUIRED')

    return {
      licensedCountries,
      licensedStates,
      therapyTypes,
      specializations,
      certifications,
      yearsExperience,
      consultationFee,
      professionalBio,
      socialMediaPlatforms,
    }
  }

  if (applicationType === 'influencer') {
    const platformLinks = cleanUrlMap(source.platformLinks, 10)
    const followerCount = cleanNumber(source.followerCount, { min: 0, max: 2_000_000_000, integer: true })
    const contentCategories = cleanArray(source.contentCategories, { maxItems: 20, maxLength: 100 })
    const collaborationTypes = cleanArray(source.collaborationTypes, { maxItems: 20, maxLength: 100 })
    const mediaKitUrl = cleanUrl(source.mediaKitUrl, 1000)
    const bio = clean(source.bio, 2000)

    if (!Object.keys(platformLinks).length) throw new Error('INFLUENCER_PLATFORM_REQUIRED')
    if (!contentCategories.length || !collaborationTypes.length) throw new Error('INFLUENCER_DETAILS_REQUIRED')
    if (bio.length < 50) throw new Error('INFLUENCER_BIO_REQUIRED')

    return {
      platformLinks,
      followerCount,
      contentCategories,
      collaborationTypes,
      mediaKitUrl,
      bio,
    }
  }

  const organizationName = clean(source.organizationName, 160)
  const practiceType = clean(source.practiceType, 100)
  const serviceDescription = clean(source.serviceDescription, 500)
  const websiteUrl = cleanUrl(source.websiteUrl, 1000)
  const professionalBio = clean(source.professionalBio, 2000)

  if (!organizationName || !practiceType) throw new Error('PROFESSIONAL_ORGANIZATION_REQUIRED')
  if (serviceDescription.length < 20) throw new Error('PROFESSIONAL_SERVICE_DESCRIPTION_REQUIRED')
  if (professionalBio.length < 50) throw new Error('PROFESSIONAL_BIO_REQUIRED')

  return {
    organizationName,
    practiceType,
    serviceDescription,
    websiteUrl,
    professionalBio,
  }
}

const allowedOrigins = () => {
  const configured = (Deno.env.get('PROFESSIONAL_APPLICATION_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return new Set(configured.length ? configured : [DEFAULT_ORIGIN])
}

const allowedHostnames = () => {
  const hostnames = new Set<string>()
  for (const origin of allowedOrigins()) {
    try {
      hostnames.add(new URL(origin).hostname.toLowerCase())
    } catch {
      // Invalid configured origins are ignored; the origin check will fail closed.
    }
  }
  return hostnames
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
    headers: { ...corsHeadersFor(request), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const verifyTurnstile = async (request: Request, token: string) => {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY') || ''
  const expectedHostnames = allowedHostnames()
  if (!secret || !token || expectedHostnames.size === 0) return false

  const form = new FormData()
  form.set('secret', secret)
  form.set('response', token)

  const remoteIp = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim()
    || ''
  if (remoteIp) form.set('remoteip', remoteIp)

  let response: Response
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    console.error('Professional application anti-abuse verification unavailable')
    return false
  }

  if (!response.ok) return false
  const result = await response.json()
  const hostname = clean(result?.hostname, 255).toLowerCase()

  return result?.success === true
    && result?.action === TURNSTILE_ACTION
    && expectedHostnames.has(hostname)
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

  // Public pre-membership intake must never be activated in an unprotected mode. The
  // separate requirement flag exists so configuration drift fails closed rather than
  // silently turning Turnstile into an optional control in production.
  if (Deno.env.get('PROFESSIONAL_APPLICATION_TURNSTILE_REQUIRED') !== 'true') {
    return json(request, { error: 'ANTI_ABUSE_NOT_CONFIGURED' }, 503)
  }

  try {
    const body = await request.json()
    const applicationType = clean(body?.applicationType, 30).toLowerCase()
    const firstName = clean(body?.firstName, 80)
    const lastName = clean(body?.lastName, 80)
    const email = normalizeEmail(body?.email)
    const phone = clean(body?.phone, 40)
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

    const details = sanitizeDetails(applicationType, body?.details)

    const turnstileValid = await verifyTurnstile(request, turnstileToken)
    if (!turnstileValid) {
      return json(request, { error: 'ANTI_ABUSE_CHECK_FAILED' }, 403)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Professional application backend configuration incomplete')
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
      console.error('Professional application insert failed:', error.code || 'unknown')
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
    const validationErrors = new Set([
      'THERAPIST_LICENSE_LOCATION_REQUIRED',
      'THERAPIST_SPECIALTY_REQUIRED',
      'THERAPIST_BIO_REQUIRED',
      'INFLUENCER_PLATFORM_REQUIRED',
      'INFLUENCER_DETAILS_REQUIRED',
      'INFLUENCER_BIO_REQUIRED',
      'PROFESSIONAL_ORGANIZATION_REQUIRED',
      'PROFESSIONAL_SERVICE_DESCRIPTION_REQUIRED',
      'PROFESSIONAL_BIO_REQUIRED',
    ])
    if (validationErrors.has(message)) {
      return json(request, { error: message }, 400)
    }
    console.error('Professional application request rejected')
    return json(request, { error: 'INVALID_REQUEST' }, 400)
  }
})
