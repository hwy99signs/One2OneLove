// Supabase Edge Function: stripe-webhook
// This function handles Stripe webhook events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Webhook event received:', event.type)

    // Initialize Supabase client (service role for admin access)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabaseClient)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription, supabaseClient)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription, supabaseClient)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice, supabaseClient)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabaseClient)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  const userId = session.metadata?.user_id
  const planName = session.metadata?.plan_name

  if (!userId || !planName) {
    console.error('Missing metadata in session')
    return
  }

  console.log('Checkout completed:', { userId, planName })

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // Update user subscription in database
  await supabaseClient
    .from('users')
    .update({
      subscription_plan: planName,
      subscription_status: 'active',
      subscription_price: (session.amount_total || 0) / 100,
      stripe_subscription_id: subscription.id,
      subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log('User subscription updated successfully')
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  console.log('Subscription updated:', subscription.id)

  await supabaseClient
    .from('users')
    .update({
      subscription_status: subscription.status,
      subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log('Subscription status updated')
}

async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  console.log('Subscription canceled:', subscription.id)

  // Update to free plan
  await supabaseClient
    .from('users')
    .update({
      subscription_plan: 'Basic',
      subscription_price: 0,
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  // Record subscription change
  await supabaseClient
    .from('subscription_changes')
    .insert({
      user_id: userId,
      from_plan: subscription.metadata?.plan_name,
      to_plan: 'Basic',
      change_type: 'cancel',
    })

  console.log('Subscription canceled and user downgraded to free plan')
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )

  const userId = subscription.metadata?.user_id
  const planName = subscription.metadata?.plan_name

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  console.log('Payment succeeded:', invoice.id)

  // Record payment in history
  await supabaseClient
    .from('payment_history')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: invoice.payment_intent,
      stripe_invoice_id: invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency,
      status: 'succeeded',
      subscription_plan: planName,
      created_at: new Date().toISOString(),
    })

  console.log('Payment recorded in history')
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )

  const userId = subscription.metadata?.user_id
  const planName = subscription.metadata?.plan_name

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  console.log('Payment failed:', invoice.id)

  // Record failed payment in history
  await supabaseClient
    .from('payment_history')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: invoice.payment_intent,
      stripe_invoice_id: invoice.id,
      amount: (invoice.amount_due || 0) / 100,
      currency: invoice.currency,
      status: 'failed',
      subscription_plan: planName,
      created_at: new Date().toISOString(),
    })

  // Optionally update subscription status
  await supabaseClient
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log('Failed payment recorded')
}

