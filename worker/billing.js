import { neon } from '@neondatabase/serverless';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const stripeStatusToO2OL = (status) => {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trial';
  if (status === 'canceled') return 'cancelled';
  if (status === 'incomplete_expired') return 'expired';
  return 'inactive';
};

const appendParam = (params, key, value) => {
  if (value === undefined || value === null) return;
  params.append(key, String(value));
};

async function stripeRequest(env, path, { method = 'POST', params = null } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured');

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params ? params.toString() : undefined,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || 'Stripe request failed');
  }
  return body;
}

const sqlFor = (env) => {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(env.DATABASE_URL);
};

async function createCheckoutSession(request, env, userId) {
  const body = await request.json().catch(() => ({}));
  const planName = body?.planName;
  if (!['Premiere', 'Exclusive'].includes(planName)) {
    return json({ error: 'Invalid paid subscription plan' }, 400);
  }

  const sql = sqlFor(env);
  const [user] = await sql`
    select email, stripe_customer_id
    from public.users
    where id=${userId}::uuid
    limit 1
  `;
  if (!user) return json({ error: 'User profile not found' }, 404);

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const params = new URLSearchParams();
    appendParam(params, 'email', body?.userEmail || user.email);
    appendParam(params, 'metadata[user_id]', userId);
    const customer = await stripeRequest(env, 'customers', { params });
    customerId = customer.id;
    await sql`update public.users set stripe_customer_id=${customerId}, updated_at=now() where id=${userId}::uuid`;
  }

  const configuredPrice =
    planName === 'Premiere' ? env.STRIPE_PRICE_PREMIERE : env.STRIPE_PRICE_EXCLUSIVE;
  const priceId = configuredPrice || body?.priceId;
  if (!priceId) return json({ error: `No Stripe price configured for ${planName}` }, 503);

  const origin = request.headers.get('Origin') || new URL(request.url).origin;
  const params = new URLSearchParams();
  appendParam(params, 'customer', customerId);
  appendParam(params, 'mode', 'subscription');
  appendParam(params, 'line_items[0][price]', priceId);
  appendParam(params, 'line_items[0][quantity]', 1);
  appendParam(params, 'success_url', `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
  appendParam(params, 'cancel_url', `${origin}/subscription?canceled=true`);
  appendParam(params, 'metadata[user_id]', userId);
  appendParam(params, 'metadata[plan_name]', planName);
  appendParam(params, 'subscription_data[metadata][user_id]', userId);
  appendParam(params, 'subscription_data[metadata][plan_name]', planName);

  const session = await stripeRequest(env, 'checkout/sessions', { params });
  return json({ sessionId: session.id, url: session.url });
}

async function changeCancellation(env, userId, cancelAtPeriodEnd) {
  const sql = sqlFor(env);
  const [user] = await sql`
    select stripe_subscription_id
    from public.users
    where id=${userId}::uuid
    limit 1
  `;
  if (!user?.stripe_subscription_id) {
    return json({ error: 'No active Stripe subscription found' }, 409);
  }

  const params = new URLSearchParams();
  appendParam(params, 'cancel_at_period_end', cancelAtPeriodEnd ? 'true' : 'false');
  const subscription = await stripeRequest(
    env,
    `subscriptions/${encodeURIComponent(user.stripe_subscription_id)}`,
    { params },
  );

  await sql`
    update public.users
    set cancel_at_period_end=${Boolean(subscription.cancel_at_period_end)}, updated_at=now()
    where id=${userId}::uuid
  `;
  return json({ success: true });
}

export async function handleBillingFunction(request, env, name, userId) {
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    if (name === 'create-checkout-session') {
      return await createCheckoutSession(request, env, userId);
    }
    if (name === 'cancel-subscription') {
      return await changeCancellation(env, userId, true);
    }
    if (name === 'reactivate-subscription') {
      return await changeCancellation(env, userId, false);
    }
    return json({ error: 'Unknown function' }, 404);
  } catch (error) {
    console.error(`Billing function ${name} failed:`, error);
    return json({ error: error?.message || 'Billing function failed' }, 400);
  }
}

async function hmacHex(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > 300) return false;

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((signature) => signature === expected);
}

async function retrieveSubscription(env, subscription) {
  if (!subscription) return null;
  if (typeof subscription === 'object') return subscription;
  return stripeRequest(env, `subscriptions/${encodeURIComponent(subscription)}`, { method: 'GET' });
}

async function updateSubscriptionFromStripe(env, sql, subscription, fallbackPlan = null) {
  const userId = subscription?.metadata?.user_id;
  if (!userId) return;
  const planName = subscription?.metadata?.plan_name || fallbackPlan;
  const status = stripeStatusToO2OL(subscription?.status);
  const start = subscription?.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : null;
  const end = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await sql`
    update public.users
    set
      subscription_plan=coalesce(${planName}, subscription_plan),
      subscription_status=${status},
      stripe_subscription_id=${subscription.id || null},
      subscription_current_period_start=${start},
      subscription_current_period_end=${end},
      cancel_at_period_end=${Boolean(subscription?.cancel_at_period_end)},
      canceled_at=${status === 'cancelled' ? new Date().toISOString() : null},
      updated_at=now()
    where id=${userId}::uuid
  `;
}

export async function handleStripeWebhook(request, env) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('Stripe-Signature');
    const valid = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return new Response('Invalid Stripe signature', { status: 400 });

    const event = JSON.parse(rawBody);
    const object = event?.data?.object || {};
    const sql = sqlFor(env);

    if (event.type === 'checkout.session.completed') {
      const userId = object?.metadata?.user_id;
      const planName = object?.metadata?.plan_name;
      const subscription = await retrieveSubscription(env, object?.subscription);
      if (userId && subscription) {
        if (!subscription.metadata) subscription.metadata = {};
        subscription.metadata.user_id ||= userId;
        subscription.metadata.plan_name ||= planName;
        await updateSubscriptionFromStripe(env, sql, subscription, planName);
        await sql`
          update public.users
          set subscription_price=${Number(object?.amount_total || 0) / 100},
              stripe_customer_id=coalesce(${typeof object?.customer === 'string' ? object.customer : object?.customer?.id || null},stripe_customer_id),
              updated_at=now()
          where id=${userId}::uuid
        `;
      }
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      await updateSubscriptionFromStripe(env, sql, object);
    } else if (event.type === 'customer.subscription.deleted') {
      const userId = object?.metadata?.user_id;
      const fromPlan = object?.metadata?.plan_name || null;
      if (userId) {
        await sql`
          update public.users
          set subscription_plan='Basic',subscription_price=0,subscription_status='cancelled',
              stripe_subscription_id=null,cancel_at_period_end=false,canceled_at=now(),updated_at=now()
          where id=${userId}::uuid
        `;
        await sql`
          insert into public.subscription_changes(user_id,from_plan,to_plan,change_type,effective_date)
          values(${userId}::uuid,${fromPlan},'Basic','cancel',now())
        `;
      }
    } else if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
      const subscription = await retrieveSubscription(env, object?.subscription);
      const userId = subscription?.metadata?.user_id;
      const planName = subscription?.metadata?.plan_name || null;
      if (userId) {
        const succeeded = event.type === 'invoice.payment_succeeded';
        await sql`
          insert into public.payment_history(
            user_id,stripe_payment_intent_id,stripe_invoice_id,amount,currency,status,subscription_plan,created_at,updated_at
          ) values(
            ${userId}::uuid,
            ${typeof object?.payment_intent === 'string' ? object.payment_intent : object?.payment_intent?.id || null},
            ${object?.id || null},
            ${Number(succeeded ? object?.amount_paid || 0 : object?.amount_due || 0) / 100},
            ${object?.currency || 'usd'},
            ${succeeded ? 'succeeded' : 'failed'},
            ${planName},
            now(),now()
          )
        `;
        if (!succeeded) {
          await sql`update public.users set subscription_status='inactive',updated_at=now() where id=${userId}::uuid`;
        }
      }
    }

    return json({ received: true });
  } catch (error) {
    console.error('Stripe webhook failed:', error);
    return json({ error: error?.message || 'Webhook failed' }, 400);
  }
}
