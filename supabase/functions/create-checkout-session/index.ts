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

const stripeRequest = async (path: string, body?: URLSearchParams) => {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')

  const response = await fetch(`https://api.stripe.com${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body?.toString(),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = clean(payload?.error?.message, 500) || `Stripe returned ${response.status}`
    throw new Error(message)
  }
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
    throw new Error('Configured Stripe prices do not match the approved launch monthly pricing')
  }
}

const requireHttpsSiteUrl = () => {
  const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
  if (!siteUrl || !/^https:\/\//i.test(siteUrl)) throw new Error('SITE_URL must be configured with HTTPS')
  return siteUrl
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)

  if (Deno.env.get('PAYMENTS_ENABLED') !== 'true') {
    return json(request, { error: 'PAYMENTS_NOT_ENABLED' }, 503)
  }

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
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json(request, { error: 'AUTHENTICATION_REQUIRED' }, 401)
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return json(request, { error: 'EMAIL_NOT_CONFIRMED' }, 403)
    }
    if (!user.email) return json(request, { error: 'ACCOUNT_EMAIL_REQUIRED' }, 400)

    // Fail closed before creating a customer/session if either configured Price ID has
    // the wrong amount, currency, recurrence, or active state.
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
      const customer = await stripeRequest('/v1/customers', customerBody)
      customerId = clean(customer?.id, 200)
      if (!customerId) throw new Error('Stripe did not return a customer ID')
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

    const session = await stripeRequest('/v1/checkout/sessions', sessionBody)
    const sessionId = clean(session?.id, 200)
    const checkoutUrl = clean(session?.url, 2000)
    if (!sessionId || !checkoutUrl) throw new Error('Stripe did not return a checkout session URL')

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
      // A Stripe session now exists. Do not manufacture another one; surface a controlled
      // reconciliation error so the operator can inspect the single created session.
      console.error('Checkout state persistence failed after Stripe session creation:', stateError)
      return json(request, { error: 'CHECKOUT_RECONCILIATION_REQUIRED', sessionId }, 503)
    }

    return json(request, { sessionId, url: checkoutUrl })
  } catch (error) {
    console.error('create-checkout-session error:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'CHECKOUT_UNAVAILABLE' }, 500)
  }
})
