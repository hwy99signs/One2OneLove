// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const MIN_AMOUNT_CENTS = 500;
const MAX_AMOUNT_CENTS = 10000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}
async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw Object.assign(new Error('Expected application/json body.'), { status: 400, code: 'bad_request' });
  }
  return request.json();
}
function validAmountCents(value) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= MIN_AMOUNT_CENTS && amount <= MAX_AMOUNT_CENTS && amount % 100 === 0;
}
function sendsForAmount(amountCents) {
  if (!validAmountCents(amountCents)) return null;
  return Number(amountCents) / 50;
}
async function stripeRequest(env, method, path, params = null) {
  if (!env.STRIPE_SECRET_KEY) {
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
async function getOrCreateCustomer(db, env, auth) {
  const result = await db.query('SELECT email,stripe_customer_id FROM public.users WHERE id=$1::uuid', [auth.user.id]);
  const user = result.rows[0];
  if (!user) throw Object.assign(new Error('User profile not found.'), { status: 404, code: 'not_found' });
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const params = new URLSearchParams();
  params.set('email', auth.user.email || user.email || '');
  params.set('metadata[user_id]', auth.user.id);
  params.set('metadata[platform]', 'One2OneLove');
  const customer = await stripeRequest(env, 'POST', '/customers', params);
  await db.query('UPDATE public.users SET stripe_customer_id=$1,updated_at=now() WHERE id=$2::uuid', [customer.id, auth.user.id]);
  return customer.id;
}
async function wallet(db, userId) {
  const [balance, purchases] = await Promise.all([
    db.query('SELECT available_sends,lifetime_purchased_sends,updated_at FROM public.sms_send_credit_wallets WHERE user_id=$1::uuid', [userId]),
    db.query(`SELECT amount_cents,currency,sends_purchased,status,created_at
                FROM public.sms_send_credit_purchases
               WHERE user_id=$1::uuid
               ORDER BY created_at DESC LIMIT 20`, [userId]),
  ]);
  return {
    availableSends: Number(balance.rows[0]?.available_sends || 0),
    lifetimePurchasedSends: Number(balance.rows[0]?.lifetime_purchased_sends || 0),
    updatedAt: balance.rows[0]?.updated_at || null,
    purchases: purchases.rows,
  };
}
async function createCheckout(db, env, request, auth, input) {
  const amountCents = Number(input?.amountCents ?? input?.amount_cents);
  if (!validAmountCents(amountCents)) {
    return fail('Choose a whole-dollar amount from $5 to $100.', 400, 'invalid_amount');
  }
  const sends = sendsForAmount(amountCents);
  const customerId = await getOrCreateCustomer(db, env, auth);
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('customer', customerId);
  params.set('mode', 'payment');
  params.set('payment_method_types[0]', 'card');
  params.set('branding_settings[display_name]', 'One2OneLove');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set('line_items[0][price_data][product_data][name]', 'One2OneLove Extra Love Note Sends');
  params.set('line_items[0][price_data][product_data][description]', `${sends} extra SMS Love Note sends`);
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/SendCredits?payment=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/SendCredits?payment=canceled`);
  params.set('client_reference_id', auth.user.id);
  params.set('metadata[purchase_type]', 'sms_send_credits');
  params.set('metadata[user_id]', auth.user.id);
  params.set('metadata[amount_cents]', String(amountCents));
  params.set('metadata[sends]', String(sends));
  params.set('payment_intent_data[metadata][purchase_type]', 'sms_send_credits');
  params.set('payment_intent_data[metadata][user_id]', auth.user.id);
  params.set('payment_intent_data[metadata][sends]', String(sends));
  const checkoutSession = await stripeRequest(env, 'POST', '/checkout/sessions', params);
  return json({ ok: true, sessionId: checkoutSession.id, url: checkoutSession.url, amountCents, sends });
}
async function creditPurchase(db, stripeSession, expectedUserId = null) {
  if (stripeSession?.metadata?.purchase_type !== 'sms_send_credits') {
    throw Object.assign(new Error('This checkout is not a send-credit purchase.'), { status: 400, code: 'wrong_checkout_type' });
  }
  if (stripeSession.payment_status !== 'paid') {
    throw Object.assign(new Error('Stripe has not marked this payment as paid.'), { status: 409, code: 'payment_not_paid' });
  }
  const userId = stripeSession.metadata?.user_id || stripeSession.client_reference_id;
  if (!userId) throw Object.assign(new Error('Checkout is missing its user reference.'), { status: 400, code: 'invalid_checkout' });
  if (expectedUserId && userId !== expectedUserId) {
    throw Object.assign(new Error('This checkout belongs to a different account.'), { status: 403, code: 'forbidden' });
  }

  const amountCents = Number(stripeSession.amount_total || stripeSession.metadata?.amount_cents);
  const sends = sendsForAmount(amountCents);
  if (!sends || Number(stripeSession.metadata?.sends) !== sends) {
    throw Object.assign(new Error('Send-credit checkout amount could not be verified.'), { status: 400, code: 'invalid_checkout_amount' });
  }

  const paymentIntent = typeof stripeSession.payment_intent === 'string'
    ? stripeSession.payment_intent
    : stripeSession.payment_intent?.id || null;

  await db.query('BEGIN');
  try {
    const inserted = await db.query(
      `INSERT INTO public.sms_send_credit_purchases
        (user_id,stripe_checkout_session_id,stripe_payment_intent_id,amount_cents,currency,sends_purchased,status)
       VALUES($1::uuid,$2,$3,$4,$5,$6,'succeeded')
       ON CONFLICT (stripe_checkout_session_id) DO NOTHING
       RETURNING id`,
      [userId, stripeSession.id, paymentIntent, amountCents, String(stripeSession.currency || 'usd').toLowerCase(), sends],
    );
    if (inserted.rowCount) {
      await db.query(
        `INSERT INTO public.sms_send_credit_wallets(user_id,available_sends,lifetime_purchased_sends,updated_at)
         VALUES($1::uuid,$2,$2,now())
         ON CONFLICT (user_id) DO UPDATE SET
           available_sends=public.sms_send_credit_wallets.available_sends + EXCLUDED.available_sends,
           lifetime_purchased_sends=public.sms_send_credit_wallets.lifetime_purchased_sends + EXCLUDED.lifetime_purchased_sends,
           updated_at=now()`,
        [userId, sends],
      );
    }
    await db.query('COMMIT');
    return { credited: Boolean(inserted.rowCount), userId, sends, amountCents };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
async function confirmCheckout(db, env, auth, input) {
  const sessionId = String(input?.sessionId || input?.session_id || '').trim();
  if (!/^cs_/.test(sessionId)) return fail('A valid Stripe checkout session is required.', 400, 'invalid_session');
  const stripeSession = await stripeRequest(env, 'GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const result = await creditPurchase(db, stripeSession, auth.user.id);
  return json({ ok: true, ...result, wallet: await wallet(db, auth.user.id) });
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

export async function handleSendCreditWebhook(request, env, url) {
  if (url.pathname !== '/api/billing/webhook' || request.method !== 'POST') return null;
  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) return null;
  const body = await request.text();
  const valid = await verifyStripeSignature(body, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return null;
  const event = JSON.parse(body);
  const object = event?.data?.object || {};
  if (event?.type !== 'checkout.session.completed' || object?.metadata?.purchase_type !== 'sms_send_credits') return null;
  const result = await withDb(env, db => creditPurchase(db, object));
  return json({ received: true, sendCredits: true, credited: result.credited });
}

export async function handleSendCreditsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/send-credits')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    return await withDb(env, async db => {
      if (url.pathname === '/api/send-credits/balance' && request.method === 'GET') {
        return json({ ok: true, wallet: await wallet(db, auth.user.id) });
      }
      if (url.pathname === '/api/send-credits/config' && request.method === 'GET') {
        return json({ ok: true, packages: [
          { amountCents: 500, sends: 10 },
          { amountCents: 1000, sends: 20 },
          { amountCents: 1500, sends: 30 },
        ], minAmountCents: MIN_AMOUNT_CENTS, maxAmountCents: MAX_AMOUNT_CENTS, sendsPerDollar: 2 });
      }
      if (url.pathname === '/api/send-credits/checkout' && request.method === 'POST') {
        return createCheckout(db, env, request, auth, await readJson(request));
      }
      if (url.pathname === '/api/send-credits/confirm' && request.method === 'POST') {
        return confirmCheckout(db, env, auth, await readJson(request));
      }
      return fail('Not found.', 404, 'not_found');
    });
  } catch (error) {
    console.error('Send credits API error:', error?.message || error);
    return fail(error?.message || 'Unable to manage send credits.', error?.status || 500, error?.code || 'send_credits_error');
  }
}
