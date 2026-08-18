// Supabase Edge Function: stripe-webhook
// Server-owned Stripe state synchronization for the One2OneLove relaunch membership.
//
// DEVELOPMENT CODE. Do not replace the production webhook until existing Stripe usage
// has been inventoried and Approval Batch 001 authorizes the controlled migration.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const PLAN_KEY = 'membership'
const PRICING_VERSION = 'launch_2026'
const INTRO_MONTHS = 6
const STANDARD_RELEASE_MONTHS = 1
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED_STATUSES = new Set([
  'inactive', 'checkout_pending', 'trialing', 'active', 'past_due', 'canceled',
  'unpaid', 'incomplete', 'incomplete_expired', 'paused',
])

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

const hexToBytes = (value: string) => {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return new Uint8Array()
  const result = new Uint8Array(value.length / 2)
  for (let index = 0; index < result.length; index += 1) {
    result[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  return result
}

const verifyStripeSignature = async (rawBody: string, signatureHeader: string, secret: string) => {
  const pieces = signatureHeader.split(',').map((piece) => piece.trim())
  const timestampText = pieces.find((piece) => piece.startsWith('t='))?.slice(2) || ''
  const signatures = pieces.filter((piece) => piece.startsWith('v1=')).map((piece) => piece.slice(3))
  const timestamp = Number(timestampText)
  const tolerance = Math.min(Math.max(Number(Deno.env.get('STRIPE_WEBHOOK_TOLERANCE_SECONDS')) || 300, 60), 900)

  if (!Number.isFinite(timestamp) || signatures.length === 0) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > tolerance) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = new Uint8Array(await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestampText}.${rawBody}`),
  ))

  return signatures.some((signature) => timingSafeEqual(digest, hexToBytes(signature)))
}

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
    throw new Error(clean(payload?.error?.message, 500) || `Stripe returned ${response.status}`)
  }
  return payload
}

const stripeId = (value: any) => {
  if (typeof value === 'string') return clean(value, 200)
  return clean(value?.id, 200)
}

const subscriptionIdFromInvoice = (invoice: any) =>
  stripeId(invoice?.subscription)
  || stripeId(invoice?.parent?.subscription_details?.subscription)

const currentPeriodEnd = (subscription: any) => {
  const direct = Number(subscription?.current_period_end)
  if (Number.isFinite(direct) && direct > 0) return new Date(direct * 1000).toISOString()

  const itemEnds = Array.isArray(subscription?.items?.data)
    ? subscription.items.data.map((item: any) => Number(item?.current_period_end)).filter((value: number) => Number.isFinite(value) && value > 0)
    : []
  return itemEnds.length ? new Date(Math.max(...itemEnds) * 1000).toISOString() : null
}

const currentPriceId = (subscription: any) =>
  stripeId(subscription?.items?.data?.[0]?.price)

const normalizedStatus = (status: unknown) => {
  const value = clean(status, 40)
  return ALLOWED_STATUSES.has(value) ? value : 'inactive'
}

const launchMetadata = (object: any) => {
  const metadata = object?.metadata || {}
  const userId = clean(metadata?.o2ol_user_id, 80)
  const planKey = clean(metadata?.o2ol_plan_key, 40)
  const pricingVersion = clean(metadata?.o2ol_pricing_version, 80)
  if (!UUID_PATTERN.test(userId) || planKey !== PLAN_KEY || pricingVersion !== PRICING_VERSION) return null
  return { userId, planKey, pricingVersion }
}

const retrieveSubscription = async (subscriptionId: string) => {
  if (!subscriptionId) throw new Error('Subscription ID is missing')
  return stripeRequest(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`)
}

const configureLaunchPricingSchedule = async (subscription: any, metadata: { userId: string }) => {
  const introPriceId = clean(Deno.env.get('STRIPE_PRICE_INTRO'), 200)
  const standardPriceId = clean(Deno.env.get('STRIPE_PRICE_STANDARD'), 200)
  if (!introPriceId || !standardPriceId) throw new Error('Launch Stripe Price IDs are not configured')
  if (currentPriceId(subscription) !== introPriceId) {
    throw new Error('Checkout subscription does not use the configured intro price')
  }

  const existingScheduleId = stripeId(subscription?.schedule)
  if (existingScheduleId) {
    const existingSchedule = await stripeRequest(`/v1/subscription_schedules/${encodeURIComponent(existingScheduleId)}`)
    const scheduleMetadata = launchMetadata(existingSchedule)
    if (!scheduleMetadata || scheduleMetadata.userId !== metadata.userId) {
      throw new Error('Subscription is already attached to an unrecognized schedule')
    }
    return existingSchedule
  }

  const createBody = new URLSearchParams()
  createBody.set('from_subscription', subscription.id)
  const created = await stripeRequest('/v1/subscription_schedules', createBody)
  const scheduleId = stripeId(created)
  if (!scheduleId) throw new Error('Stripe did not return a subscription schedule ID')

  const phaseStart = Number(created?.phases?.[0]?.start_date || subscription?.current_period_start)
  if (!Number.isFinite(phaseStart) || phaseStart <= 0) {
    throw new Error('Unable to determine subscription schedule phase start')
  }

  const updateBody = new URLSearchParams()
  updateBody.set('end_behavior', 'release')
  updateBody.set('metadata[o2ol_user_id]', metadata.userId)
  updateBody.set('metadata[o2ol_plan_key]', PLAN_KEY)
  updateBody.set('metadata[o2ol_pricing_version]', PRICING_VERSION)

  updateBody.set('phases[0][start_date]', String(phaseStart))
  updateBody.set('phases[0][items][0][price]', introPriceId)
  updateBody.set('phases[0][items][0][quantity]', '1')
  updateBody.set('phases[0][duration][interval]', 'month')
  updateBody.set('phases[0][duration][interval_count]', String(INTRO_MONTHS))
  updateBody.set('phases[0][proration_behavior]', 'none')
  updateBody.set('phases[0][metadata][o2ol_pricing_phase]', 'intro')

  // The second phase changes the subscription to the standard recurring price for one
  // month, then `release` leaves that subscription running indefinitely at the standard
  // price without keeping it schedule-managed forever.
  updateBody.set('phases[1][items][0][price]', standardPriceId)
  updateBody.set('phases[1][items][0][quantity]', '1')
  updateBody.set('phases[1][duration][interval]', 'month')
  updateBody.set('phases[1][duration][interval_count]', String(STANDARD_RELEASE_MONTHS))
  updateBody.set('phases[1][proration_behavior]', 'none')
  updateBody.set('phases[1][metadata][o2ol_pricing_phase]', 'standard')

  return stripeRequest(`/v1/subscription_schedules/${encodeURIComponent(scheduleId)}`, updateBody)
}

const upsertMembershipFromSubscription = async (
  serviceClient: any,
  subscription: any,
  metadata: { userId: string },
  extra: Record<string, unknown> = {},
) => {
  const customerId = stripeId(subscription?.customer)
  const scheduleId = stripeId(subscription?.schedule)
  const payload = {
    user_id: metadata.userId,
    plan_key: PLAN_KEY,
    pricing_version: PRICING_VERSION,
    status: normalizedStatus(subscription?.status),
    stripe_customer_id: customerId || null,
    stripe_subscription_id: stripeId(subscription),
    stripe_schedule_id: scheduleId || null,
    current_price_id: currentPriceId(subscription) || null,
    current_period_end: currentPeriodEnd(subscription),
    cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
    ...extra,
  }

  const { error } = await serviceClient
    .from('member_subscriptions')
    .upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

const recordPayment = async (serviceClient: any, invoice: any, userId: string, status: 'succeeded' | 'failed') => {
  const invoiceId = stripeId(invoice)
  if (!invoiceId) return

  const { data: existing } = await serviceClient
    .from('payment_history')
    .select('id')
    .eq('stripe_invoice_id', invoiceId)
    .maybeSingle()
  if (existing?.id) return

  const amountCents = status === 'succeeded'
    ? Number(invoice?.amount_paid || 0)
    : Number(invoice?.amount_due || 0)

  const { error } = await serviceClient
    .from('payment_history')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: stripeId(invoice?.payment_intent) || null,
      stripe_invoice_id: invoiceId,
      amount: Number.isFinite(amountCents) ? amountCents / 100 : 0,
      currency: clean(invoice?.currency, 10) || 'usd',
      status,
      subscription_plan: 'Membership',
      created_at: new Date().toISOString(),
    })

  if (error?.code === '23505') return
  if (error) throw error
}

serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405)

  const signature = request.headers.get('stripe-signature') || ''
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
  if (!signature || !webhookSecret || webhookSecret.length < 20) {
    return json({ error: 'WEBHOOK_NOT_CONFIGURED' }, 503)
  }

  const rawBody = await request.text()
  if (!(await verifyStripeSignature(rawBody, signature, webhookSecret))) {
    return json({ error: 'INVALID_SIGNATURE' }, 400)
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'INVALID_PAYLOAD' }, 400)
  }

  const expectedLivemode = clean(Deno.env.get('STRIPE_EXPECT_LIVEMODE'), 10)
  if (expectedLivemode === 'true' || expectedLivemode === 'false') {
    if (Boolean(event?.livemode) !== (expectedLivemode === 'true')) {
      console.error('Stripe event livemode mismatch:', event?.id)
      return json({ error: 'LIVEMODE_MISMATCH' }, 400)
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'BACKEND_NOT_CONFIGURED' }, 503)

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const type = clean(event?.type, 100)
    const object = event?.data?.object

    if (type === 'checkout.session.completed') {
      const metadata = launchMetadata(object)
      if (!metadata) return json({ received: true, ignored: 'not_launch_membership' })

      const subscriptionId = stripeId(object?.subscription)
      if (!subscriptionId) throw new Error('Completed membership checkout has no subscription ID')
      const subscription = await retrieveSubscription(subscriptionId)
      const subscriptionMetadata = launchMetadata(subscription)
      if (!subscriptionMetadata || subscriptionMetadata.userId !== metadata.userId) {
        throw new Error('Checkout/subscription membership metadata mismatch')
      }

      await upsertMembershipFromSubscription(serviceClient, subscription, metadata, {
        pricing_transition_status: 'pending',
        activated_at: new Date().toISOString(),
      })

      try {
        const schedule = await configureLaunchPricingSchedule(subscription, metadata)
        const scheduleId = stripeId(schedule)
        const introEnd = Number(schedule?.phases?.[0]?.end_date)

        const { error } = await serviceClient
          .from('member_subscriptions')
          .update({
            stripe_schedule_id: scheduleId || null,
            pricing_transition_status: 'configured',
            intro_ends_at: Number.isFinite(introEnd) && introEnd > 0 ? new Date(introEnd * 1000).toISOString() : null,
          })
          .eq('user_id', metadata.userId)
          .eq('stripe_subscription_id', subscriptionId)
        if (error) throw error
      } catch (scheduleError) {
        console.error('Launch pricing schedule configuration failed:', metadata.userId, scheduleError instanceof Error ? scheduleError.message : 'unknown')
        await serviceClient
          .from('member_subscriptions')
          .update({ pricing_transition_status: 'reconciliation_required' })
          .eq('user_id', metadata.userId)
        throw scheduleError
      }
    } else if (type === 'customer.subscription.created' || type === 'customer.subscription.updated') {
      const metadata = launchMetadata(object)
      if (!metadata) return json({ received: true, ignored: 'not_launch_membership' })

      const allowedPriceIds = new Set([
        clean(Deno.env.get('STRIPE_PRICE_INTRO'), 200),
        clean(Deno.env.get('STRIPE_PRICE_STANDARD'), 200),
      ].filter(Boolean))
      const priceId = currentPriceId(object)
      if (!priceId || !allowedPriceIds.has(priceId)) {
        throw new Error('Launch membership subscription uses an unrecognized Price ID')
      }

      await upsertMembershipFromSubscription(serviceClient, object, metadata)
    } else if (type === 'customer.subscription.deleted') {
      const metadata = launchMetadata(object)
      if (!metadata) return json({ received: true, ignored: 'not_launch_membership' })

      await upsertMembershipFromSubscription(serviceClient, object, metadata, {
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })

      await serviceClient.from('subscription_changes').insert({
        user_id: metadata.userId,
        from_plan: 'Membership',
        to_plan: null,
        change_type: 'cancel',
        created_at: new Date().toISOString(),
      })
    } else if (type === 'invoice.payment_succeeded' || type === 'invoice.payment_failed') {
      const subscriptionId = subscriptionIdFromInvoice(object)
      if (!subscriptionId) return json({ received: true, ignored: 'invoice_without_subscription' })

      const subscription = await retrieveSubscription(subscriptionId)
      const metadata = launchMetadata(subscription)
      if (!metadata) return json({ received: true, ignored: 'not_launch_membership' })

      if (type === 'invoice.payment_succeeded') {
        await recordPayment(serviceClient, object, metadata.userId, 'succeeded')
        await upsertMembershipFromSubscription(serviceClient, subscription, metadata)
      } else {
        await recordPayment(serviceClient, object, metadata.userId, 'failed')
        await upsertMembershipFromSubscription(serviceClient, subscription, metadata, { status: 'past_due' })
      }
    } else if (type === 'subscription_schedule.released' || type === 'subscription_schedule.updated') {
      const metadata = launchMetadata(object)
      if (!metadata) return json({ received: true, ignored: 'not_launch_membership' })

      const scheduleId = stripeId(object)
      const subscriptionId = stripeId(object?.subscription) || stripeId(object?.released_subscription)
      const updates: Record<string, unknown> = {
        stripe_schedule_id: scheduleId || null,
        pricing_transition_status: 'configured',
      }
      if (subscriptionId) updates.stripe_subscription_id = subscriptionId

      const { error } = await serviceClient
        .from('member_subscriptions')
        .update(updates)
        .eq('user_id', metadata.userId)
      if (error) throw error
    } else {
      return json({ received: true, ignored: 'unhandled_event' })
    }

    return json({ received: true })
  } catch (error) {
    // 5xx asks Stripe to retry transient or incomplete processing. No secret/provider
    // detail is returned to the caller; diagnostics stay in server logs.
    console.error('stripe-webhook processing error:', event?.id, error instanceof Error ? error.message : 'unknown')
    return json({ error: 'WEBHOOK_PROCESSING_FAILED' }, 500)
  }
})
