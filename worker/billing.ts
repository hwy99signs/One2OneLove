// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const PAID_PLANS = new Set(['Premiere', 'Exclusive']);
const ALL_PLANS = new Set(['Basis', 'Premiere', 'Exclusive']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function canonicalPlan(value) {
  const raw = String(value || '').trim();
  if (raw.toLowerCase() === 'basic' || raw.toLowerCase() === 'basis') return 'Basis';
  if (raw.toLowerCase() === 'premiere') return 'Premiere';
  if (raw.toLowerCase() === 'exclusive') return 'Exclusive';
  return null;
}
function normalizedSubscriptionStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'active': return 'active';
    case 'trialing': return 'trial';
    case 'canceled':
    case 'cancelled': return 'cancelled';
    case 'incomplete_expired': return 'expired';
    case 'inactive':
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'paused': return 'inactive';
    default: return 'inactive';
  }
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Expected application/json body.');
  }
  return request.json();
}
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && active ? { user, session: active } : null;
}
async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}
function stripeConfigured(env) {
  return Boolean(env.STRIPE_SECRET_KEY);
}
function stripePriceForPlan(env, plan) {
  if (plan === 'Premiere') return env.STRIPE_PRICE_PREMIERE || null;
  if (plan === 'Exclusive') return env.STRIPE_PRICE_EXCLUSIVE || null;
  return null;
}
async function stripeRequest(env, method, path, params = null) {
  if (!stripeConfigured(env)) {
    throw Object.assign(new Error('Payment processing is not configured yet.'), { status: 503, code: 'billing_not_configured' });
  }
  const headers = {
    authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    accept: 'application/json',
  };
  let body;
  if (params) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    body = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  }
  const response = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || 'Stripe request failed.';
    throw Object.assign(new Error(message), { status: 502, code: payload?.error?.code || 'stripe_error' });
  }
  return payload;
}
async function getBillingUser(db, userId) {
  const result = await db.query(
    `SELECT id,email,subscription_plan,subscription_status,subscription_price,
            subscription_start_date,subscription_end_date,stripe_customer_id,stripe_subscription_id,
            payment_method,subscription_current_period_start,subscription_current_period_end,
            trial_end_date,cancel_at_period_end,canceled_at
       FROM public.users WHERE id=$1::uuid`,
    [userId],
  );
  if (!result.rows[0]) throw Object.assign(new Error('User profile not found.'), { status: 404, code: 'not_found' });
  return result.rows[0];
}
async function getOrCreateCustomer(db, env, auth, billingUser) {
  if (billingUser.stripe_customer_id) return billingUser.stripe_customer_id;
  const params = new URLSearchParams();
  params.set('email', auth.user.email || billingUser.email || '');
  params.set('metadata[user_id]', auth.user.id);
  params.set('metadata[platform]', 'One2OneLove');
  const customer = await stripeRequest(env, 'POST', '/customers', params);
  await db.query('UPDATE public.users SET stripe_customer_id=$1,updated_at=now() WHERE id=$2::uuid', [customer.id, auth.user.id]);
  return customer.id;
}
function safeUnixDate(seconds) {
  const n = Number(seconds);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
}
function subscriptionPeriod(subscription) {
  // Stripe versions differ. Prefer top-level fields, then the first item.
  const item = subscription?.items?.data?.[0] || null;
  return {
    start: safeUnixDate(subscription?.current_period_start || item?.current_period_start),
    end: safeUnixDate(subscription?.current_period_end || item?.current_period_end),
  };
}
async function updateFromSubscription(db, userId, subscription, planOverride = null, priceOverride = null) {
  const plan = canonicalPlan(planOverride || subscription?.metadata?.plan_name);
  const status = normalizedSubscriptionStatus(subscription?.status);
  const period = subscriptionPeriod(subscription);
  const fields = [
    'subscription_status=$1',
    'stripe_subscription_id=$2',
    'subscription_current_period_start=$3',
    'subscription_current_period_end=$4',
    'cancel_at_period_end=$5',
    'updated_at=now()',
  ];
  const values = [status, subscription?.id || null, period.start, period.end, Boolean(subscription?.cancel_at_period_end)];
  if (plan && ALL_PLANS.has(plan)) {
    values.push(plan);
    fields.push(`subscription_plan=$${values.length}`);
  }
  if (Number.isFinite(Number(priceOverride)) && Number(priceOverride) >= 0) {
    values.push(Number(priceOverride));
    fields.push(`subscription_price=$${values.length}`);
  }
  values.push(userId);
  await db.query(`UPDATE public.users SET ${fields.join(',')} WHERE id=$${values.length}::uuid`, values);
}
async function checkout(db, env, request, auth, input) {
  const plan = canonicalPlan(input?.planName || input?.plan_name || input?.plan);
  if (!PAID_PLANS.has(plan)) return fail('Choose Premiere or Exclusive for paid checkout.');
  const priceId = stripePriceForPlan(env, plan);
  if (!priceId) return fail(`Stripe price is not configured for ${plan}.`, 503, 'billing_not_configured');

  const billingUser = await getBillingUser(db, auth.user.id);
  if (billingUser.stripe_subscription_id && ['active', 'trial'].includes(billingUser.subscription_status)) {
    return fail('An active paid subscription already exists. Manage that subscription before starting another checkout.', 409, 'subscription_exists');
  }
  const customerId = await getOrCreateCustomer(db, env, auth, billingUser);
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('customer', customerId);
  params.set('mode', 'subscription');
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][price]', priceId);
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/subscription?canceled=true`);
  params.set('client_reference_id', auth.user.id);
  params.set('metadata[user_id]', auth.user.id);
  params.set('metadata[plan_name]', plan);
  params.set('subscription_data[metadata][user_id]', auth.user.id);
  params.set('subscription_data[metadata][plan_name]', plan);
  const checkoutSession = await stripeRequest(env, 'POST', '/checkout/sessions', params);
  return json({ ok: true, sessionId: checkoutSession.id, url: checkoutSession.url, plan });
}
async function switchToBasis(db, userId) {
  const current = await getBillingUser(db, userId);
  if (current.stripe_subscription_id && ['active', 'trial'].includes(current.subscription_status)) {
    return fail('Cancel the active paid subscription before switching to Basis.', 409, 'active_paid_subscription');
  }
  if (current.subscription_plan !== 'Basis') {
    await db.query(
      `INSERT INTO public.subscription_changes(user_id,from_plan,to_plan,change_type)
       VALUES($1::uuid,$2,'Basis','downgrade')`,
      [userId, current.subscription_plan],
    );
  }
  await db.query(
    `UPDATE public.users SET subscription_plan='Basis',subscription_price=0,subscription_status='active',
      stripe_subscription_id=NULL,subscription_current_period_start=NULL,subscription_current_period_end=NULL,
      cancel_at_period_end=false,updated_at=now() WHERE id=$1::uuid`,
    [userId],
  );
  return json({ ok: true, subscription: await getBillingUser(db, userId) });
}
async function cancelSubscription(db, env, userId) {
  const user = await getBillingUser(db, userId);
  if (!user.stripe_subscription_id) return fail('No paid subscription is connected to this account.', 409, 'no_paid_subscription');
  const params = new URLSearchParams();
  params.set('cancel_at_period_end', 'true');
  const subscription = await stripeRequest(env, 'POST', `/subscriptions/${encodeURIComponent(user.stripe_subscription_id)}`, params);
  await updateFromSubscription(db, userId, subscription, user.subscription_plan);
  return json({ ok: true, subscription: await getBillingUser(db, userId) });
}
async function reactivateSubscription(db, env, userId) {
  const user = await getBillingUser(db, userId);
  if (!user.stripe_subscription_id) return fail('No paid subscription is connected to this account.', 409, 'no_paid_subscription');
  const params = new URLSearchParams();
  params.set('cancel_at_period_end', 'false');
  const subscription = await stripeRequest(env, 'POST', `/subscriptions/${encodeURIComponent(user.stripe_subscription_id)}`, params);
  await updateFromSubscription(db, userId, subscription, user.subscription_plan);
  return json({ ok: true, subscription: await getBillingUser(db, userId) });
}
function hexToBytes(hex) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
async function verifyStripeSignature(body, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(',').map(v => v.trim());
  const timestampPart = parts.find(v => v.startsWith('t='));
  const signatures = parts.filter(v => v.startsWith('v1=')).map(v => v.slice(3));
  const timestamp = Number(timestampPart?.slice(2));
  if (!Number.isFinite(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const payload = encoder.encode(`${timestamp}.${body}`);
  for (const hex of signatures) {
    const bytes = hexToBytes(hex);
    if (bytes && await crypto.subtle.verify('HMAC', key, bytes, payload)) return true;
  }
  return false;
}
function invoiceSubscriptionId(invoice) {
  const direct = invoice?.subscription;
  if (typeof direct === 'string') return direct;
  if (direct?.id) return direct.id;
  const nested = invoice?.parent?.subscription_details?.subscription;
  if (typeof nested === 'string') return nested;
  if (nested?.id) return nested.id;
  return null;
}
async function recordPayment(db, invoice, subscription, succeeded) {
  const userId = subscription?.metadata?.user_id;
  if (!userId) return;
  const user = await getBillingUser(db, userId).catch(() => null);
  if (!user) return;
  const plan = canonicalPlan(subscription?.metadata?.plan_name || user.subscription_plan) || 'Basis';
  const status = succeeded ? 'succeeded' : 'failed';
  const duplicate = await db.query(
    'SELECT 1 FROM public.payment_history WHERE stripe_invoice_id=$1 AND status=$2 LIMIT 1',
    [invoice.id, status],
  );
  if (!duplicate.rowCount) {
    const cents = succeeded ? (invoice.amount_paid || 0) : (invoice.amount_due || 0);
    const paymentIntent = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || null;
    await db.query(
      `INSERT INTO public.payment_history(user_id,stripe_payment_intent_id,stripe_invoice_id,amount,currency,status,subscription_plan)
       VALUES($1::uuid,$2,$3,$4,$5,$6,$7)`,
      [userId, paymentIntent, invoice.id, Number(cents) / 100, String(invoice.currency || 'usd').toLowerCase(), status, plan],
    );
  }
  if (!succeeded) {
    await db.query(`UPDATE public.users SET subscription_status='inactive',updated_at=now() WHERE id=$1::uuid`, [userId]);
  }
}
async function handleWebhookEvent(db, env, event) {
  const object = event?.data?.object || {};
  switch (event?.type) {
    case 'checkout.session.completed': {
      const userId = object.metadata?.user_id || object.client_reference_id;
      const plan = canonicalPlan(object.metadata?.plan_name);
      const subscriptionId = typeof object.subscription === 'string' ? object.subscription : object.subscription?.id;
      if (!userId || !plan || !subscriptionId) return;
      const subscription = await stripeRequest(env, 'GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
      await db.query('UPDATE public.users SET stripe_customer_id=COALESCE(stripe_customer_id,$1) WHERE id=$2::uuid', [typeof object.customer === 'string' ? object.customer : object.customer?.id || null, userId]);
      await updateFromSubscription(db, userId, subscription, plan, Number(object.amount_total || 0) / 100);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const userId = object.metadata?.user_id;
      if (!userId) return;
      await updateFromSubscription(db, userId, object, object.metadata?.plan_name);
      break;
    }
    case 'customer.subscription.deleted': {
      const userId = object.metadata?.user_id;
      if (!userId) return;
      const user = await getBillingUser(db, userId).catch(() => null);
      if (!user) return;
      const recent = await db.query(`SELECT 1 FROM public.subscription_changes WHERE user_id=$1::uuid AND change_type='cancel' AND effective_date>now()-interval '10 minutes' LIMIT 1`, [userId]);
      if (!recent.rowCount) {
        await db.query(`INSERT INTO public.subscription_changes(user_id,from_plan,to_plan,change_type) VALUES($1::uuid,$2,'Basis','cancel')`, [userId,user.subscription_plan]);
      }
      await db.query(
        `UPDATE public.users SET subscription_plan='Basis',subscription_price=0,subscription_status='cancelled',
          stripe_subscription_id=NULL,subscription_current_period_start=NULL,subscription_current_period_end=NULL,
          cancel_at_period_end=false,canceled_at=now(),updated_at=now() WHERE id=$1::uuid`,
        [userId],
      );
      break;
    }
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      const subscriptionId = invoiceSubscriptionId(object);
      if (!subscriptionId) return;
      const subscription = await stripeRequest(env, 'GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
      await recordPayment(db, object, subscription, event.type === 'invoice.payment_succeeded');
      break;
    }
    default:
      break;
  }
}
async function webhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) return fail('Stripe webhook is not configured yet.', 503, 'billing_not_configured');
  const body = await request.text();
  const valid = await verifyStripeSignature(body, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return fail('Invalid Stripe webhook signature.', 400, 'invalid_signature');
  const event = JSON.parse(body);
  await withDb(env, db => handleWebhookEvent(db, env, event));
  return json({ received: true });
}

export async function handleBillingRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/billing')) return null;
  try {
    if (url.pathname === '/api/billing/webhook') {
      if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
      return webhook(request, env);
    }

    const auth = await session(request, env);
    if (!auth) return fail('Authentication required.', 401, 'unauthorized');

    return await withDb(env, async db => {
      if (url.pathname === '/api/billing/subscription' && request.method === 'GET') {
        return json({ ok: true, subscription: await getBillingUser(db, auth.user.id) });
      }
      if (url.pathname === '/api/billing/payments' && request.method === 'GET') {
        const result = await db.query('SELECT * FROM public.payment_history WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 100', [auth.user.id]);
        return json({ ok: true, payments: result.rows });
      }
      if (url.pathname === '/api/billing/basis' && request.method === 'POST') {
        return switchToBasis(db, auth.user.id);
      }
      if (url.pathname === '/api/billing/checkout' && request.method === 'POST') {
        return checkout(db, env, request, auth, await readJson(request));
      }
      if (url.pathname === '/api/billing/cancel' && request.method === 'POST') {
        return cancelSubscription(db, env, auth.user.id);
      }
      if (url.pathname === '/api/billing/reactivate' && request.method === 'POST') {
        return reactivateSubscription(db, env, auth.user.id);
      }
      if (url.pathname === '/api/billing/config' && request.method === 'GET') {
        return json({ ok: true, paid_checkout_ready: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PREMIERE && env.STRIPE_PRICE_EXCLUSIVE), webhook_ready: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET) });
      }
      return fail('Not found.', 404, 'not_found');
    });
  } catch (error) {
    console.error('Billing API error:', error?.message || error);
    return fail(error?.message || 'Billing request failed.', error?.status || 500, error?.code || 'billing_error');
  }
}
