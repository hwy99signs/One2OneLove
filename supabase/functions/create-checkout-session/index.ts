// Supabase Edge Function: create-checkout-session
// Server-controlled One2OneLove relaunch membership checkout.
//
// DEVELOPMENT CODE. Deploy with PAYMENTS_ENABLED=false first. The browser never
// supplies a Stripe Price ID, amount, user ID, or billing email.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const PLAN_KEY = 'membership'
const PRICING_VERSION = 'launch_2026'
const INTRO_CENTS = 199
const STANDARD_CENTS = 599
const CHECKOUT_CLAIM_STALE_MS = 2 * 60 * 1000
const BLOCKING_STATUSES = new Set(['trialing', 'active', 'past_due', 'unpaid'])

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const allowedOrigins = () => {
  const configured = (Deno.env.get('PAYMENT_ALLOWED_ORIGINS') || '')
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

const stripeRequest = async (path: string, body?: URLSearchParams, idempotencyKey = '') => {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY_NOT_CONFIGURED')

  const response = await fetch(`https://api.stripe.com${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(body && idempotencyKey ? { 'Idempotency-Key': idempotencyKey.slice(0, 255) } : {}),
    },
    body: body?.toString(),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`STRIPE_API_${response.status}`)
  return payload
}

const validateLaunchPrices = async (introPriceId: string, standardPriceId: string) => {
  const expectedCurrency = clean(Deno.env.get('STRIPE_EXPECTED_CURRENCY') || 'usd', 10).toLowerCase()
  const [intro, standard] = await Promise.all([
    stripeRequest(`/v1/prices/${encodeURIComponent(introPriceId)}`),
    stripeRequest(`/v1/prices/${encodeURIComponent(standardPriceId)}`),
  ])

  const validMonthlyPrice = (price: any, expectedCents: number) =>
    price?.active === true
    && price?.type === 'recurring'
    && price?.recurring?.interval === 'month'
    && Number(price?.recurring?.interval_count || 1) === 1
    && Number(price?.unit_amount) === expectedCents
    && clean(price?.currency, 10).toLowerCase() === expectedCurrency

  if (!validMonthlyPrice(intro, INTRO_CENTS) || !validMonthlyPrice(standard, STANDARD_CENTS)) {
    throw new Error('STRIPE_LAUNCH_PRICE_VALIDATION_FAILED')
  }
}

const requireHttpsSiteUrl = () => {
  const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
  if (!siteUrl || !/^https:\/\//i.test(siteUrl)) throw new Error('SITE_URL_HTTPS_REQUIRED')
  return siteUrl
}

const validHttpsUrl = (value: unknown) => {
  const candidate = clean(value, 2000)
  if (!candidate) return ''
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' ? url.toString().slice(0, 2000) : ''
  } catch {
    return ''
  }
}

const claimCheckoutAttempt = async (serviceClient: any, userId: string) => {
  const now = new Date()
  const token = crypto.randomUUID()
  const initial = {
    user_id: userId,
    attempt_token: token,
    status: 'processing',
    attempts: 1,
    started_at: now.toISOString(),
    updated_at: now.toISOString(),
    stripe_checkout_session_id: null,
    expires_at: null,
    last_error_code: null,
  }

  const { data: inserted, error: insertError } = await serviceClient
    .from('stripe_checkout_attempts')
    .insert(initial)
    .select('user_id,attempt_token,status,stripe_checkout_session_id,attempts,started_at,updated_at,expires_at')
    .maybeSingle()

  if (!insertError && inserted) return { state: 'processing', attempt: inserted }
  if (insertError?.code !== '23505') throw insertError

  const { data: existing, error: existingError } = await serviceClient
    .from('stripe_checkout_attempts')
    .select('user_id,attempt_token,status,stripe_checkout_session_id,attempts,started_at,updated_at,expires_at')
    .eq('user_id', userId)
    .single()
  if (existingError) throw existingError

  if (existing.status === 'open') return { state: 'open', attempt: existing }
  if (existing.status === 'completed') return { state: 'completed', attempt: existing }

  if (existing.status === 'processing') {
    const updatedAt = new Date(existing.updated_at)
    if (!Number.isNaN(updatedAt.getTime()) && updatedAt.getTime() > now.getTime() - CHECKOUT_CLAIM_STALE_MS) {
      return { state: 'busy', attempt: existing }
    }
  }

  if (existing.status === 'failed' || existing.status === 'processing') {
    // Preserve the existing attempt token. If Stripe succeeded but O2OL lost the response,
    // retrying with the same Idempotency-Key returns the same customer/session operation.
    let retry = serviceClient
      .from('stripe_checkout_attempts')
      .update({
        status: 'processing',
        attempts: Math.min(Number(existing.attempts || 1) + 1, 1000),
        updated_at: now.toISOString(),
        last_error_code: null,
      })
      .eq('user_id', userId)
      .eq('attempt_token', existing.attempt_token)

    if (existing.status === 'failed') retry = retry.eq('status', 'failed')
    else retry = retry.eq('status', 'processing').eq('updated_at', existing.updated_at)

    const { data: reclaimed, error: retryError } = await retry
      .select('user_id,attempt_token,status,stripe_checkout_session_id,attempts,started_at,updated_at,expires_at')
      .maybeSingle()
    if (retryError) throw retryError
    return reclaimed ? { state: 'processing', attempt: reclaimed } : { state: 'busy', attempt: existing }
  }

  // Expired attempts deliberately receive a new token so Stripe may create a fresh
  // Checkout Session after the earlier session can no longer be used.
  if (existing.status === 'expired') {
    const { data: reset, error: resetError } = await serviceClient
      .from('stripe_checkout_attempts')
      .update({
        attempt_token: token,
        status: 'processing',
        stripe_checkout_session_id: null,
        attempts: Math.min(Number(existing.attempts || 1) + 1, 1000),
        started_at: now.toISOString(),
        updated_at: now.toISOString(),
        expires_at: null,
        last_error_code: null,
      })
      .eq('user_id', userId)
      .eq('attempt_token', existing.attempt_token)
      .eq('status', 'expired')
      .select('user_id,attempt_token,status,stripe_checkout_session_id,attempts,started_at,updated_at,expires_at')
      .maybeSingle()
    if (resetError) throw resetError
    return reset ? { state: 'processing', attempt: reset } : { state: 'busy', attempt: existing }
  }

  return { state: 'busy', attempt: existing }
}

const resetExpiredOpenAttempt = async (serviceClient: any, attempt: any) => {
  const now = new Date()
  const newToken = crypto.randomUUID()
  const { data, error } = await serviceClient
    .from('stripe_checkout_attempts')
    .update({
      attempt_token: newToken,
      status: 'processing',
      stripe_checkout_session_id: null,
      attempts: Math.min(Number(attempt.attempts || 1) + 1, 1000),
      started_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: null,
      last_error_code: null,
    })
    .eq('user_id', attempt.user_id)
    .eq('attempt_token', attempt.attempt_token)
    .eq('status', 'open')
    .select('user_id,attempt_token,status,stripe_checkout_session_id,attempts,started_at,updated_at,expires_at')
    .maybeSingle()
  if (error) throw error
  return data || null
}

const markCheckoutAttemptFailed = async (serviceClient: any, userId: string, attemptToken: string) => {
  if (!attemptToken) return
  const { error } = await serviceClient
    .from('stripe_checkout_attempts')
    .update({ status: 'failed', updated_at: new Date().toISOString(), last_error_code: 'CHECKOUT_UNAVAILABLE' })
    .eq('user_id', userId)
    .eq('attempt_token', attemptToken)
    .eq('status', 'processing')
  if (error) console.error('Checkout attempt failure-state persistence failed:', userId)
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  if (Deno.env.get('PAYMENTS_ENABLED') !== 'true') {
    return json(request, { error: 'PAYMENTS_NOT_ENABLED' }, 503)
  }

  let serviceClient: any = null
  let callerUserId = ''
  let activeAttemptToken = ''

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return json(request, { error: 'AUTHENTICATION_REQUIRED' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(request, { error: 'BACKEND_NOT_CONFIGURED' }, 503)
    }

    const introPriceId = clean(Deno.env.get('STRIPE_PRICE_INTRO'), 200)
    const standardPriceId = clean(Deno.env.get('STRIPE_PRICE_STANDARD'), 200)
    if (!introPriceId || !standardPriceId) {
      return json(request, { error: 'MEMBERSHIP_PRICING_NOT_CONFIGURED' }, 503)
    }

    const body = await request.json().catch(() => ({}))
    if (body?.planKey && body.planKey !== PLAN_KEY) {
      return json(request, { error: 'UNKNOWN_PLAN' }, 400)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json(request, { error: 'AUTHENTICATION_REQUIRED' }, 401)
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return json(request, { error: 'EMAIL_NOT_CONFIRMED' }, 403)
    }
    if (!user.email) return json(request, { error: 'ACCOUNT_EMAIL_REQUIRED' }, 400)
    callerUserId = user.id

    // Fail closed before claiming/creating a checkout if configured launch prices are
    // not exactly the approved amount, currency, recurrence and active state.
    await validateLaunchPrices(introPriceId, standardPriceId)

    const { data: membership, error: membershipError } = await serviceClient
      .from('member_subscriptions')
      .select('status, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) {
      console.error('Membership lookup failed:', membershipError)
      return json(request, { error: 'MEMBERSHIP_BACKEND_UNAVAILABLE' }, 503)
    }

    if (membership?.stripe_subscription_id && BLOCKING_STATUSES.has(membership.status)) {
      return json(request, { error: 'MEMBERSHIP_ALREADY_EXISTS' }, 409)
    }

    let claim = await claimCheckoutAttempt(serviceClient, user.id)
    if (claim.state === 'busy') return json(request, { error: 'CHECKOUT_ALREADY_IN_PROGRESS' }, 409)
    if (claim.state === 'completed') return json(request, { error: 'CHECKOUT_PROCESSING' }, 409)

    if (claim.state === 'open') {
      const sessionId = clean(claim.attempt?.stripe_checkout_session_id, 200)
      if (!sessionId) throw new Error('CHECKOUT_ATTEMPT_SESSION_ID_MISSING')
      const session = await stripeRequest(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`)
      const status = clean(session?.status, 40)
      const checkoutUrl = validHttpsUrl(session?.url)

      if (status === 'open' && checkoutUrl) {
        return json(request, { sessionId, url: checkoutUrl, reused: true })
      }
      if (status === 'complete') {
        await serviceClient
          .from('stripe_checkout_attempts')
          .update({ status: 'completed', updated_at: new Date().toISOString(), last_error_code: null })
          .eq('user_id', user.id)
          .eq('attempt_token', claim.attempt.attempt_token)
          .eq('status', 'open')
        return json(request, { error: 'CHECKOUT_PROCESSING' }, 409)
      }

      const reset = await resetExpiredOpenAttempt(serviceClient, claim.attempt)
      if (!reset) return json(request, { error: 'CHECKOUT_ALREADY_IN_PROGRESS' }, 409)
      claim = { state: 'processing', attempt: reset }
    }

    activeAttemptToken = String(claim.attempt?.attempt_token || '')
    if (!activeAttemptToken) throw new Error('CHECKOUT_ATTEMPT_TOKEN_MISSING')

    let customerId = clean(membership?.stripe_customer_id, 200)

    // During transition, reuse a legacy server-side customer ID if one already exists on
    // the private users record. Never expose or accept this ID from browser code.
    if (!customerId) {
      const { data: legacyProfile } = await serviceClient
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle()
      customerId = clean(legacyProfile?.stripe_customer_id, 200)
    }

    if (!customerId) {
      const customerBody = new URLSearchParams()
      customerBody.set('email', user.email)
      customerBody.set('metadata[o2ol_user_id]', user.id)
      customerBody.set('metadata[o2ol_product]', 'membership')
      const customer = await stripeRequest('/v1/customers', customerBody, `o2ol-customer-${user.id}`)
      customerId = clean(customer?.id, 200)
      if (!customerId) throw new Error('STRIPE_CUSTOMER_ID_MISSING')
    }

    const siteUrl = requireHttpsSiteUrl()
    const sessionBody = new URLSearchParams()
    sessionBody.set('mode', 'subscription')
    sessionBody.set('customer', customerId)
    sessionBody.set('client_reference_id', user.id)
    sessionBody.set('line_items[0][price]', introPriceId)
    sessionBody.set('line_items[0][quantity]', '1')
    sessionBody.set('success_url', `${siteUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`)
    sessionBody.set('cancel_url', `${siteUrl}/Subscription?checkout=canceled`)
    sessionBody.set('metadata[o2ol_user_id]', user.id)
    sessionBody.set('metadata[o2ol_plan_key]', PLAN_KEY)
    sessionBody.set('metadata[o2ol_pricing_version]', PRICING_VERSION)
    sessionBody.set('subscription_data[metadata][o2ol_user_id]', user.id)
    sessionBody.set('subscription_data[metadata][o2ol_plan_key]', PLAN_KEY)
    sessionBody.set('subscription_data[metadata][o2ol_pricing_version]', PRICING_VERSION)

    const session = await stripeRequest('/v1/checkout/sessions', sessionBody, `o2ol-checkout-${activeAttemptToken}`)
    const sessionId = clean(session?.id, 200)
    const checkoutUrl = validHttpsUrl(session?.url)
    const expiresAtSeconds = Number(session?.expires_at)
    if (!sessionId || !checkoutUrl || !Number.isFinite(expiresAtSeconds) || expiresAtSeconds <= 0) {
      throw new Error('STRIPE_CHECKOUT_SESSION_INVALID')
    }
    const expiresAt = new Date(expiresAtSeconds * 1000).toISOString()

    const { data: openedAttempt, error: attemptError } = await serviceClient
      .from('stripe_checkout_attempts')
      .update({
        status: 'open',
        stripe_checkout_session_id: sessionId,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt,
        last_error_code: null,
      })
      .eq('user_id', user.id)
      .eq('attempt_token', activeAttemptToken)
      .eq('status', 'processing')
      .select('user_id')
      .maybeSingle()
    if (attemptError) throw attemptError
    if (!openedAttempt) throw new Error('CHECKOUT_ATTEMPT_STATE_LOST')

    const { error: stateError } = await serviceClient
      .from('member_subscriptions')
      .upsert({
        user_id: user.id,
        plan_key: PLAN_KEY,
        pricing_version: PRICING_VERSION,
        status: 'checkout_pending',
        pricing_transition_status: 'not_started',
        stripe_customer_id: customerId,
        checkout_started_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (stateError) {
      // The one active Stripe session is safely retained in stripe_checkout_attempts;
      // later retry can reuse it instead of manufacturing a second session.
      console.error('Checkout membership state persistence failed after Stripe session creation:', user.id)
      return json(request, { error: 'CHECKOUT_RECONCILIATION_REQUIRED', sessionId }, 503)
    }

    return json(request, { sessionId, url: checkoutUrl, reused: false })
  } catch (error) {
    if (serviceClient && callerUserId && activeAttemptToken) {
      await markCheckoutAttemptFailed(serviceClient, callerUserId, activeAttemptToken)
    }
    console.error('create-checkout-session error:', callerUserId || 'unknown', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'CHECKOUT_UNAVAILABLE' }, 500)
  }
})
