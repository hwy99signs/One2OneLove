import { withSupabase } from 'npm:@supabase/server@^1';
import Stripe from 'npm:stripe@22.1.1';

const paidPlans = new Set(['Premiere', 'Exclusive']);

function asId(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id?: string }).id || '');
  return '';
}

function subscriptionPeriod(subscription: any) {
  const item = subscription?.items?.data?.[0];
  const startSeconds = subscription?.current_period_start ?? item?.current_period_start ?? null;
  const endSeconds = subscription?.current_period_end ?? item?.current_period_end ?? null;
  return {
    start: startSeconds ? new Date(startSeconds * 1000).toISOString() : null,
    end: endSeconds ? new Date(endSeconds * 1000).toISOString() : null,
  };
}

function invoiceSubscriptionId(invoice: any) {
  return asId(invoice?.subscription) || asId(invoice?.parent?.subscription_details?.subscription);
}

async function updateSubscriptionFromStripe(ctx: any, subscription: any) {
  const userId = String(subscription?.metadata?.user_id || '');
  const planName = String(subscription?.metadata?.plan_name || '');
  if (!userId || !paidPlans.has(planName)) return;

  const period = subscriptionPeriod(subscription);
  await ctx.supabaseAdmin
    .from('users')
    .update({
      subscription_plan: planName,
      subscription_status: String(subscription.status || 'inactive'),
      stripe_customer_id: asId(subscription.customer) || null,
      stripe_subscription_id: String(subscription.id || '') || null,
      subscription_current_period_start: period.start,
      subscription_current_period_end: period.end,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

async function recordInvoice(ctx: any, stripe: Stripe, invoice: any, status: 'succeeded' | 'failed') {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = String(subscription.metadata?.user_id || '');
  const planName = String(subscription.metadata?.plan_name || '');
  if (!userId || !paidPlans.has(planName)) return;

  const amountCents = status === 'succeeded' ? Number(invoice.amount_paid || 0) : Number(invoice.amount_due || 0);
  const paymentIntentId = asId(invoice.payment_intent) || asId(invoice?.payments?.data?.[0]?.payment?.payment_intent) || null;

  await ctx.supabaseAdmin
    .from('payment_history')
    .upsert(
      {
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        stripe_invoice_id: String(invoice.id || ''),
        amount: amountCents / 100,
        currency: String(invoice.currency || 'usd'),
        status,
        subscription_plan: planName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_invoice_id' },
    );

  if (status === 'failed') {
    await ctx.supabaseAdmin
      .from('users')
      .update({ subscription_status: 'past_due', updated_at: new Date().toISOString() })
      .eq('id', userId);
  }
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return new Response('method_not_allowed', { status: 405 });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')?.trim();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')?.trim();
    const signature = req.headers.get('stripe-signature') || '';
    if (!stripeSecret || !webhookSecret || !signature) {
      return new Response('webhook_not_configured', { status: 503 });
    }

    const stripe = new Stripe(stripeSecret);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
    } catch {
      return new Response('invalid_signature', { status: 400 });
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session: any = event.data.object;
        const subscriptionId = asId(session.subscription);
        const userId = String(session.metadata?.user_id || session.client_reference_id || '');
        const planName = String(session.metadata?.plan_name || '');

        if (subscriptionId && userId && paidPlans.has(planName)) {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const period = subscriptionPeriod(subscription);
          await ctx.supabaseAdmin
            .from('users')
            .update({
              subscription_plan: planName,
              subscription_status: String(subscription.status || 'active'),
              subscription_price: Number(session.amount_total || 0) / 100,
              stripe_customer_id: asId(session.customer) || asId(subscription.customer) || null,
              stripe_subscription_id: subscriptionId,
              subscription_current_period_start: period.start,
              subscription_current_period_end: period.end,
              cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
              canceled_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
      } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        await updateSubscriptionFromStripe(ctx, event.data.object);
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription: any = event.data.object;
        const userId = String(subscription?.metadata?.user_id || '');
        if (userId) {
          await ctx.supabaseAdmin
            .from('users')
            .update({
              subscription_plan: 'Basic',
              subscription_price: 0,
              subscription_status: 'active',
              stripe_subscription_id: null,
              subscription_current_period_start: null,
              subscription_current_period_end: null,
              cancel_at_period_end: false,
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          await ctx.supabaseAdmin.from('subscription_changes').insert({
            user_id: userId,
            from_plan: String(subscription?.metadata?.plan_name || ''),
            to_plan: 'Basic',
            change_type: 'cancel',
          });
        }
      } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
        await recordInvoice(ctx, stripe, event.data.object, 'succeeded');
      } else if (event.type === 'invoice.payment_failed') {
        await recordInvoice(ctx, stripe, event.data.object, 'failed');
      }

      return Response.json({ received: true });
    } catch {
      return new Response('webhook_processing_failed', { status: 500 });
    }
  }),
};
