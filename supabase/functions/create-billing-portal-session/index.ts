// Supabase Edge Function: create-billing-portal-session
// Creates a short-lived Stripe-hosted billing portal session for the authenticated user.
// DEVELOPMENT CODE. Deploy with PAYMENTS_ENABLED=false first.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'

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

const requireHttpsSiteUrl = () => {
  const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
  if (!siteUrl || !/^https:\/\//i.test(siteUrl)) throw new Error('SITE_URL must use HTTPS')
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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecretKey) {
      return json(request, { error: 'BACKEND_NOT_CONFIGURED' }, 503)
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

    const { data: membership } = await serviceClient
      .from('member_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = clean(membership?.stripe_customer_id, 200)
    if (!customerId) {
      const { data: legacyProfile } = await serviceClient
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle()
      customerId = clean(legacyProfile?.stripe_customer_id, 200)
    }

    if (!customerId) return json(request, { error: 'NO_BILLING_ACCOUNT' }, 404)

    const form = new URLSearchParams()
    form.set('customer', customerId)
    form.set('return_url', `${requireHttpsSiteUrl()}/Subscription`)

    const portalConfigurationId = clean(Deno.env.get('STRIPE_PORTAL_CONFIGURATION_ID'), 200)
    if (portalConfigurationId) form.set('configuration', portalConfigurationId)

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('Stripe billing portal session failed:', response.status, clean(payload?.error?.message, 300))
      return json(request, { error: 'BILLING_PORTAL_UNAVAILABLE' }, 502)
    }

    const url = clean(payload?.url, 2000)
    if (!url) return json(request, { error: 'BILLING_PORTAL_UNAVAILABLE' }, 502)

    return json(request, { url })
  } catch (error) {
    console.error('create-billing-portal-session error:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'BILLING_PORTAL_UNAVAILABLE' }, 500)
  }
})
