// Supabase Edge Function: stripe-webhook
// Server-owned Stripe state synchronization for the One2OneLove relaunch membership.
//
// DEVELOPMENT CODE. Do not replace the production webhook until existing Stripe usage
// has been inventoried and Approval #22 authorizes the controlled migration.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const PLAN_KEY = 'membership'
const PRICING_VERSION = 'launch_2026'
const INTRO_MONTHS = 6
const STANDARD_RELEASE_MONTHS = 1
const WEBHOOK_CLAIM_STALE_MS = 5 * 60 * 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STRIPE_EVENT_ID_PATTERN = /^evt_[A-Za-z0-9]+$/
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
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY_NOT_CONFIGURED')

  const response = await fetch(`https://api.stripe.com${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body?.toString(),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`STRIPE_API_${response.status}`)
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

const claimWebhookEvent = async (serviceClient: any, event: any, eventId: string, eventType: string) => {
  const now = new Date()
  const eventCreated = Number(event?.created)
  const row = {
    event_id: eventId,
    event_type: eventType,
    livemode: Boolean(event?.livemode),
    event_created: Number.isFinite(eventCreated) && eventCreated > 0 ? Math.floor(eventCreated) : null,
    status: 'processing',
    attempts: 1,
    last_attempt_at: now.toISOString(),
    processed_at: null,
    last_error_code: null,
  }

  const { data: inserted, error: insertError } = await serviceClient
    .from('stripe_webhook_events')
    .insert(row)
    .select('event_id,event_type,livemode,status,attempts,last_attempt_at')
    .maybeSingle()

  if (!insertError && inserted) return { claimed: true, duplicate: '' }
  if (insertError?.code !== '23505') throw insertError

  const { data: existing, error: existingError } = await serviceClient
    .from('stripe_webhook_events')
    .select('event_id,event_type,livemode,status,attempts,last_attempt_at')
    .eq('event_id', eventId)
    .single()
  if (existingError) throw existingError

  if (existing.event_type !== eventType || Boolean(existing.livemode) !== Boolean(event?.livemode)) {
    throw new Error('STRIPE_EVENT_ID_COLLISION')
  }
  if (existing.status === 'processed') return { claimed: false, duplicate: 'processed' }

  const staleBefore = new Date(now.getTime() - WEBHOOK_CLAIM_STALE_MS).toISOString()
  let retryQuery = serviceClient
    .from('stripe_webhook_events')
    .update({
      status: 'processing',
      attempts: Math.min(Number(existing.attempts || 1) + 1, 1000),
      last_attempt_at: now.toISOString(),
      processed_at: null,
      last_error_code: null,
    })
    .eq('event_id', eventId)

  if (existing.status === 'failed') {
    retryQuery = retryQuery.eq('status', 'failed')
  } else {
    const lastAttemptAt = new Date(existing.last_attempt_at)
    if (!Number.isNaN(lastAttemptAt.getTime()) && lastAttemptAt.getTime() > now.getTime() - WEBHOOK_CLAIM_STALE_MS) {
      return { claimed: false, duplicate: 'processing' }
    }
    retryQuery = retryQuery.eq('status', 'processing').lt('last_attempt_at', staleBefore)
  }

  const { data: reclaimed, error: reclaimError } = await retryQuery
    .select('event_id')
    .maybeSingle()
  if (reclaimError) throw reclaimError
  return reclaimed ? { claimed: true, duplicate: '' } : { claimed: false, duplicate: 'processing' }
}

const completeWebhookEvent = async (serviceClient: any, eventId: string, body: Record<string, unknown>) => {
  const { data, error } = await serviceClient
    .from('stripe_webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      last_error_code: null,
    })
    .eq('event_id', eventId)
    .eq('status', 'processing')
    .select('event_id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('STRIPE_EVENT_COMPLETION_STATE_LOST')
  return json(body)
}

const failWebhookEvent = async (serviceClient: any, eventId: string) => {
  const { error } = await serviceClient
    .from('stripe_webhook_events')
    .update({
      status: 'failed',
      processed_at: null,
      last_error_code: 'WEBHOOK_PROCESSING_FAILED',
    })
    .eq('event_id', eventId)
    .eq('status', 'processing')
  if (error) console.error('Stripe event failure-state persistence failed:', eventId)
}

const retrieveSubscription = async (subscriptionId: string) => {
  if (!subscriptionId) throw new Error('STRIPE_SUBSCRIPTION_ID_MISSING')
  return stripeRequest(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`)
}

const configureLaunchPricingSchedule = async (subscription: any, metadata: { userId: string }) => {
  const introPriceId = clean(Deno.env.get('STRIPE_PRICE_INTRO'), 200)
  const standardPriceId = clean(Deno.env.get('STRIPE_PRICE_STANDARD'), 200)
  if (!introPriceId || !standardPriceId) throw new Error('STRIPE_LAUNCH_PRICE_IDS_NOT_CONFIGURED')
  if (currentPriceId(subscription) !== introPriceId) {
    throw new Error('STRIPE_INTRO_PRICE_MISMATCH')
  }

  const existingScheduleId = stripeId(subscription?.schedule)
  if (existingScheduleId) {
    const existingSchedule = await stripeRequest(`/v1/subscription_schedules/${encodeURIComponent(existingScheduleId)}`)
    const scheduleMetadata = launchMetadata(existingSchedule)
    if (!scheduleMetadata || scheduleMetadata.userId !== metadata.userId) {
      throw new Error('STRIPE_SCHEDULE_METADATA_MISMATCH')
    }
    return existingSchedule
  }

  const createBody = new URLSearchParams()
  createBody.set('from_subscription', subscription.id)
  const created = await stripeRequest('/v1/subscription_schedules', createBody)
  const scheduleId = stripeId(created)
  if (!scheduleId) throw new Error('STRIPE_SCHEDULE_ID_MISSING')

  const phaseStart = Number(created?.phases?.[0]?.start_date || subscription?.current_period_start)
  if (!Number.isFinite(phaseStart) || phaseStart <= 0) {
    throw new Error('STRIPE_SCHEDULE_PHASE_START_INVALID')
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

const recordCancellationChange = async (serviceClient: any, userId: string, eventId: string) => {
  const { error } = await serviceClient.from('subscription_changes').insert({
    user_id: userId,
    from_plan: 'Membership',
    to_plan: null,
    change_type: 'cancel',
    stripe_event_id: eventId,
    created_at: new Date().toISOString(),
  })

  if (!error) return
  if (error.code !== '23505') throw error

  const { data: existing, error: existingError } = await serviceClient
    .from('subscription_changes')
    .select('user_id,change_type,stripe_event_id')
    .eq('stripe_event_id', eventId)
    .maybeSingle()
  if (existingError) throw existingError
  if (!existing || existing.user_id !== userId || existing.change_type !== 'cancel') {
    throw new Error('STRIPE_CANCELLATION_EVENT_COLLISION')
  }
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

  const eventId = clean(event?.id, 200)
  const eventType = clean(event?.type, 120)
  if (!STRIPE_EVENT_ID_PATTERN.test(eventId) || !eventType) {
    return json({ error: 'INVALID_EVENT_IDENTITY' }, 400)
  }

  const expectedLivemode = clean(Deno.env.get('STRIPE_EXPECT_LIVEMODE'), 10)
  if (expectedLivemode === 'true' || expectedLivemode === 'false') {
    if (Boolean(event?.livemode) !== (expectedLivemode === 'true')) {
      console.error('Stripe event livemode mismatch:', eventId)
      return json({ error: 'LIVEMODE_MISMATCH' }, 400)
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'BACKEND_NOT_CONFIGURED' }, 503)

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let claimed = false
  try {
    const claim = await claimWebhookEvent(serviceClient, event, eventId, eventType)
    if (!claim.claimed) {
      return json({ received: true, duplicate: claim.duplicate || 'processing' })
    }
    claimed = true

    const object = event?.data?.object

    if (eventType === 'checkout.session.completed') {
      const metadata = launchMetadata(object)
      if (!metadata) return await completeWebhookEvent(serviceClient, eventId, { received: true, ignored: 'not_launch_membership' })

      const subscriptionId = stripeId(object?.subscription)
      if (!subscriptionId) throw new Error('STRIPE_CHECKOUT_SUBSCRIPTION_ID_MISSING')
      const subscription = await retrieveSubscription(subscriptionId)
      const subscriptionMetadata = launchMetadata(subscription)
      if (!subscriptionMetadata || subscriptionMetadata.userId !== metadata.userId) {
        throw new Error('STRIPE_CHECKOUT_SUBSCRIPTION_METADATA_MISMATCH')
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
        console.error('Launch pricing schedule configuration failed:', metadata.userId)
        await serviceClient
          .from('member_subscriptions')
          .update({ pricing_transition_status: 'reconciliation_required' })
          .eq('user_id', metadata.userId)
        throw scheduleError
      }
    } else if (eventType === 'customer.subscription.created' || eventType === 'customer.subscription.updated') {
      // Re-fetch current Stripe state instead of trusting a potentially stale delivery.
      const subscriptionId = stripeId(object)
      if (!subscriptionId) throw new Error('STRIPE_SUBSCRIPTION_ID_MISSING')
      const subscription = await retrieveSubscription(subscriptionId)
      const metadata = launchMetadata(subscription)
      if (!metadata) return await completeWebhookEvent(serviceClient, eventId, { received: true, ignored: 'not_launch_membership' })

      const allowedPriceIds = new Set([
        clean(Deno.env.get('STRIPE_PRICE_INTRO'), 200),
        clean(Deno.env.get('STRIPE_PRICE_STANDARD'), 200),
      ].filter(Boolean))
      const priceId = currentPriceId(subscription)
      if (!priceId || !allowedPriceIds.has(priceId)) {
        throw new Error('STRIPE_MEMBERSHIP_PRICE_UNRECOGNIZED')
      }

      await upsertMembershipFromSubscription(serviceClient, subscription, metadata)
    } else if (eventType === 'customer.subscription.deleted') {
      // Stripe can deliver an older update after a deletion. Re-fetching the current
      // subscription means entitlement state follows Stripe's latest subscription state.
      const subscriptionId = stripeId(object)
      if (!subscriptionId) throw new Error('STRIPE_SUBSCRIPTION_ID_MISSING')
      const subscription = await retrieveSubscription(subscriptionId)
      const metadata = launchMetadata(subscription) || launchMetadata(object)
      if (!metadata) return await completeWebhookEvent(serviceClient, eventId, { received: true, ignored: 'not_launch_membership' })

      await upsertMembershipFromSubscription(serviceClient, subscription, metadata, {
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      await recordCancellationChange(serviceClient, metadata.userId, eventId)
    } else if (eventType === 'invoice.payment_succeeded' || eventType === 'invoice.payment_failed') {
      const subscriptionId = subscriptionIdFromInvoice(object)
      if (!subscriptionId) return await completeWebhookEvent(serviceClient, eventId, { received: true, ignored: 'invoice_without_subscription' })

      const subscription = await retrieveSubscription(subscriptionId)
      const metadata = launchMetadata(subscription)
      if (!metadata) return await completeWebhookEvent(serviceClient, eventId, { received: true, ignored: 'not_launch_membership' })

      if (eventType === 'invoice.payment_succeeded') {
        await recordPayment(serviceClient, object, metadata.userId, 'succeeded')
        await upsertMembershipFromSubscription(serviceClient, subscription, metadata)
      } else {
        await recordPayment(serviceClient, object, metadata.userId, 'failed')
        await upsertMembershipFromSubscription(serviceClient, subscription, metadata, { status: 'past_due' })
      }
    } else if (eventType === 'subscription_schedule.released' || eventType === 'subscription_schedule.updated') {
      const metadata = launchMetadata(object)
      if (!metadata) return await completeWebhookEvent(serviceClient, eventId, { received: true, ignored: 'not_launch_membership' })

      const scheduleId = stripeId(object)
      const subscriptionId = stripeId(object?.subscription) || stripeId(object?.released_subscription)
      const updates: Record<string, unknown> = {
        // Once Stripe releases a schedule, the subscription continues independently and
        // O2OL should no longer present that released schedule as attached/current.
        stripe_schedule_id: eventType === 'subscription_schedule.released' ? null : (scheduleId || null),
        pricing_transition_status: 'configured',
      }
      if (subscriptionId) updates.stripe_subscription_id = subscriptionId

      const { error } = await serviceClient
        .from('member_subscriptions')
        .update(updates)
        .eq('user_id', metadata.userId)
      if (error) throw error
    } else {
      return await completeWebhookEvent(serviceClient, eventId, { received: true, ignored: 'unhandled_event' })
    }

    return await completeWebhookEvent(serviceClient, eventId, { received: true })
  } catch (error) {
    if (claimed) await failWebhookEvent(serviceClient, eventId)
    // 5xx asks Stripe to retry transient or incomplete processing. No secret/provider
    // detail is returned to the caller; diagnostics stay in server logs.
    console.error('stripe-webhook processing error:', eventId, error instanceof Error ? error.message : 'unknown')
    return json({ error: 'WEBHOOK_PROCESSING_FAILED' }, 500)
  }
})
