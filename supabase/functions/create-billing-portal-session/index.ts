// Supabase Edge Function: create-billing-portal-session
// Creates a short-lived Stripe-hosted billing portal session for the authenticated user.
// DEVELOPMENT CODE. Deploy with PAYMENTS_ENABLED=false first.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const DEFAULT_ORIGIN = 'https://one2onelove.com'
const CUSTOMER_ID_PATTERN = /^cus_[A-Za-z0-9]+$/
const PORTAL_CONFIGURATION_ID_PATTERN = /^bpc_[A-Za-z0-9]+$/

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

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)

  const origin = request.headers.get('origin') || DEFAULT_ORIGIN
  if (!allowedOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  if (Deno.env.get('PAYMENTS_ENABLED') !== 'true') return json(request, { error: 'PAYMENTS_NOT_ENABLED' }, 503)

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

    const { data: membership, error: membershipError } = await serviceClient
      .from('member_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (membershipError) return json(request, { error: 'BILLING_ACCOUNT_UNAVAILABLE' }, 503)

    let customerId = clean(membership?.stripe_customer_id, 200)
    if (!customerId) {
      const { data: legacyProfile, error: legacyError } = await serviceClient
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle()
      if (legacyError) return json(request, { error: 'BILLING_ACCOUNT_UNAVAILABLE' }, 503)
      customerId = clean(legacyProfile?.stripe_customer_id, 200)
    }

    if (!customerId) return json(request, { error: 'NO_BILLING_ACCOUNT' }, 404)
    if (!CUSTOMER_ID_PATTERN.test(customerId)) return json(request, { error: 'BILLING_ACCOUNT_RECONCILIATION_REQUIRED' }, 503)

    const form = new URLSearchParams()
    form.set('customer', customerId)
    form.set('return_url', `${requireHttpsSiteUrl()}/Subscription`)

    const portalConfigurationId = clean(Deno.env.get('STRIPE_PORTAL_CONFIGURATION_ID'), 200)
    if (portalConfigurationId) {
      if (!PORTAL_CONFIGURATION_ID_PATTERN.test(portalConfigurationId)) {
        return json(request, { error: 'BILLING_PORTAL_CONFIGURATION_INVALID' }, 503)
      }
      form.set('configuration', portalConfigurationId)
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })

    await response.json().then(async (payload) => {
      if (!response.ok) throw new Error(`STRIPE_API_${response.status}`)
      const url = validHttpsUrl(payload?.url)
      if (!url) throw new Error('STRIPE_PORTAL_URL_INVALID')
      return url
    }).then((url) => {
      throw { __o2olPortalResponse: true, response: json(request, { url }) }
    }).catch((error) => {
      if (error?.__o2olPortalResponse) throw error
      throw error
    })

    return json(request, { error: 'BILLING_PORTAL_UNAVAILABLE' }, 500)
  } catch (error) {
    if (error && typeof error === 'object' && '__o2olPortalResponse' in error) {
      return (error as any).response
    }
    console.error('create-billing-portal-session error:', error instanceof Error ? error.message : 'unknown')
    return json(request, { error: 'BILLING_PORTAL_UNAVAILABLE' }, 500)
  }
})
