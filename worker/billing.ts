// @ts-nocheck
import { Client } from 'pg';
import { FOUNDING_FREE_DAYS, FOUNDING_LIMIT, foundingOfferForNumber, regularPriceCents } from './founding-rules.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const PAID_PLANS = new Set(['Premiere', 'Exclusive']);
const ALL_PLANS = new Set(['Premiere', 'Exclusive']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function canonicalPlan(value) {
  const raw = String(value || '').trim();
  if (raw.toLowerCase() === 'basic') return 'Premiere';
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
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
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
function planMonthlyPrice(plan) {
  if (plan === 'Premiere') return 9.99;
  if (plan === 'Exclusive') return 19.99;
  return 0;
}
function planUsage(plan) {
  if (plan === 'Exclusive') return { smsLoveNotePriceCents: 29, firstPaidSmsLoveNoteFree: true, dateIdeasMonthly: null, loveNoteCategories: 29 };
  return { smsLoveNotePriceCents: 29, firstPaidSmsLoveNoteFree: true, dateIdeasMonthly: 8, loveNoteCategories: 18 };
}
function decorateSubscription(user) {
  const storedPlan = canonicalPlan(user?.subscription_plan) || 'Premiere';
  return {
    ...user,
    effective_plan: storedPlan,
    usage_limits: planUsage(storedPlan),
    server_now: new Date().toISOString(),
    founding_free_expires_at: user?.trial_end_date || null,
    trial_expires_at: user?.trial_end_date || null,
    founding_member: user?.founding_number ? {
      number: Number(user.founding_number),
      cohort: user.founding_cohort || null,
      badgeRetained: user.founding_badge_retained !== false,
      rateForfeited: user.founding_rate_forfeited === true,
      status: user.founding_status || null,
    } : null,
  };
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
    console.error('Stripe billing request failed', { status: response.status, code: payload?.error?.code || 'payment_provider_error', type: payload?.error?.type || null });
    throw Object.assign(new Error('Sorry, payment processing is temporarily unavailable. Please try again in a moment.'), { status: 502, code: 'payment_provider_error' });
  }
  return payload;
}
async function getBillingUser(db, userId) {
  const result = await db.query(
    `SELECT u.id,u.email,u.subscription_plan,u.subscription_status,u.subscription_price,
            u.subscription_start_date,u.subscription_end_date,u.stripe_customer_id,u.stripe_subscription_id,
            u.payment_method,u.subscription_current_period_start,u.subscription_current_period_end,
            u.trial_end_date,u.cancel_at_period_end,u.canceled_at,u.created_at,
            f.founding_number,f.cohort AS founding_cohort,f.status AS founding_status,
            f.badge_retained AS founding_badge_retained,f.founding_rate_forfeited
       FROM public.users u
       LEFT JOIN public.founding_members f ON f.user_id=u.id
      WHERE u.id=$1::uuid`,
    [userId],
  );
  if (!result.rows[0]) throw Object.assign(new Error('User profile not found.'), { status: 404, code: 'not_found' });
  return result.rows[0];
}
async function foundingOfferSnapshot(db, userId = null) {
  const existing=userId
    ? (await db.query(
        `SELECT founding_number,cohort,status,badge_retained,founding_rate_forfeited,activated_at,cancelled_at
           FROM public.founding_members WHERE user_id=$1::uuid LIMIT 1`,
        [userId],
      )).rows[0]||null
    : null;
  const used=(await db.query(
    `SELECT count(*)::int AS count FROM public.founding_members
      WHERE founding_number BETWEEN 1 AND $1
        AND NOT (status='reserved' AND reservation_expires_at IS NOT NULL AND reservation_expires_at<=now())`,
    [FOUNDING_LIMIT],
  )).rows[0]?.count||0;
  const benefit=userId
    ? (await db.query(
        `SELECT monthly_tokens,months_total,months_granted,next_grant_at,status,metadata
           FROM public.o2ol_founding_token_benefits WHERE user_id=$1::uuid LIMIT 1`,
        [userId],
      )).rows[0]||null
    : null;
  return {
    available:Number(used)<FOUNDING_LIMIT,
    existing:Boolean(existing),
    foundingLimit:FOUNDING_LIMIT,
    reservedCount:Number(used),
    remaining:Math.max(0,FOUNDING_LIMIT-Number(used)),
    foundingNumber:existing?.founding_number?Number(existing.founding_number):null,
    cohort:existing?.cohort||null,
    status:existing?.status||benefit?.status||null,
    badgeRetained:existing?.badge_retained!==false,
    tokenBenefit:benefit,
    economicsPendingCalibration:true,
    recurringSubscriptionOffer:false,
    accessModel:'free_tokens',
  };
}

async function reserveFoundingOffer(db, userId) {
  await db.query('BEGIN');
  try {
    await db.query("SELECT pg_advisory_xact_lock(hashtext('one2onelove_founding_members'))");
    await db.query(`
      DELETE FROM public.founding_members
       WHERE status='reserved'
         AND activated_at IS NULL
         AND reservation_expires_at IS NOT NULL
         AND reservation_expires_at <= now()
    `);
    const existing = (await db.query(
      `SELECT founding_number,cohort,status,badge_retained,founding_rate_forfeited
         FROM public.founding_members WHERE user_id=$1::uuid`,
      [userId],
    )).rows[0] || null;
    if (existing) {
      await db.query('COMMIT');
      if (existing.status === 'cancelled' || existing.founding_rate_forfeited === true) return null;
      return foundingOfferForNumber(existing.founding_number);
    }
    const next = await db.query(`
      SELECT n
        FROM generate_series(1,$1::int) AS n
       WHERE NOT EXISTS (SELECT 1 FROM public.founding_members f WHERE f.founding_number=n)
       ORDER BY n
       LIMIT 1
    `, [FOUNDING_LIMIT]);
    const number = Number(next.rows[0]?.n || 0);
    const offer = foundingOfferForNumber(number);
    if (!offer) {
      await db.query('COMMIT');
      return null;
    }
    await db.query(
      `INSERT INTO public.founding_members
        (user_id,founding_number,cohort,status,badge_retained,founding_rate_forfeited,reservation_expires_at)
       VALUES($1::uuid,$2,$3,'reserved',true,false,now()+interval '2 hours')`,
      [userId, offer.foundingNumber, offer.cohort],
    );
    await db.query('COMMIT');
    return offer;
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function releaseFoundingReservation(db, userId) {
  await db.query(
    `DELETE FROM public.founding_members
      WHERE user_id=$1::uuid AND status='reserved' AND activated_at IS NULL`,
    [userId],
  );
}

async function activateFoundingMember(db, userId) {
  await db.query(
    `UPDATE public.founding_members
        SET status='active',activated_at=COALESCE(activated_at,now()),
            reservation_expires_at=NULL,updated_at=now()
      WHERE user_id=$1::uuid AND status='reserved'`,
    [userId],
  );
}

async function forfeitFoundingRate(db, userId) {
  await db.query(
    `UPDATE public.founding_members
        SET status='cancelled',founding_rate_forfeited=true,cancelled_at=now(),updated_at=now()
      WHERE user_id=$1::uuid AND status IN ('reserved','active')`,
    [userId],
  );
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
  const trialEnd = safeUnixDate(subscription?.trial_end);
  const itemPriceCents = Number(subscription?.items?.data?.[0]?.price?.unit_amount);
  const derivedPrice = Number.isFinite(Number(priceOverride)) ? Number(priceOverride) : Number.isFinite(itemPriceCents) ? itemPriceCents / 100 : planMonthlyPrice(plan);
  const fields = [
    'subscription_status=$1',
    'stripe_subscription_id=$2',
    'subscription_current_period_start=$3',
    'subscription_current_period_end=$4',
    'cancel_at_period_end=$5',
    'trial_end_date=$6',
    'updated_at=now()',
  ];
  const values = [status, subscription?.id || null, period.start, period.end, Boolean(subscription?.cancel_at_period_end), trialEnd];
  if (plan && ALL_PLANS.has(plan)) {
    values.push(plan);
    fields.push(`subscription_plan=$${values.length}`);
  }
  if (Number.isFinite(derivedPrice) && derivedPrice >= 0) {
    values.push(derivedPrice);
    fields.push(`subscription_price=$${values.length}`);
  }
  values.push(userId);
  await db.query(`UPDATE public.users SET ${fields.join(',')} WHERE id=$${values.length}::uuid`, values);
}
async function checkout(db, env, request, auth, input) {
  const requestedPlan = canonicalPlan(input?.planName || input?.plan_name || input?.plan);
  const wantsFounding = input?.founding === true || input?.founding_offer === true;
  let foundingOffer = null;
  if (wantsFounding) foundingOffer = await reserveFoundingOffer(db, auth.user.id);
  if (wantsFounding && !foundingOffer) return fail('The Founding Member offer is no longer available for this account.', 409, 'founding_offer_unavailable');
  const plan = foundingOffer?.plan || requestedPlan;
  if (!PAID_PLANS.has(plan)) return fail('Choose Premiere or Exclusive for paid checkout.');
  const priceId = stripePriceForPlan(env, plan);
  if (!foundingOffer && !priceId) return fail(`Stripe price is not configured for ${plan}.`, 503, 'billing_not_configured');
  if (foundingOffer?.cohort === 'second100' && !priceId) return fail('Stripe price is not configured for Premiere.', 503, 'billing_not_configured');

  const billingUser = await getBillingUser(db, auth.user.id);
  if (billingUser.stripe_subscription_id && ['active', 'trial'].includes(billingUser.subscription_status)) {
    return fail('An active subscription already exists. Manage that subscription before starting another checkout.', 409, 'subscription_exists');
  }
  const customerId = await getOrCreateCustomer(db, env, auth, billingUser);
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('customer', customerId);
  params.set('mode', 'subscription');
  params.set('payment_method_types[0]', 'card');
  params.set('payment_method_collection', 'always');
  params.set('branding_settings[display_name]', 'One2OneLove');
  if (foundingOffer?.cohort === 'first100') {
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(foundingOffer.recurringPriceCents));
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set('line_items[0][price_data][product_data][name]', 'One2OneLove Exclusive — Founding Member');
  } else {
    params.set('line_items[0][price]', priceId);
  }
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/subscription?canceled=true`);
  params.set('client_reference_id', auth.user.id);
  params.set('metadata[user_id]', auth.user.id);
  params.set('metadata[plan_name]', plan);
  params.set('subscription_data[metadata][user_id]', auth.user.id);
  params.set('subscription_data[metadata][plan_name]', plan);
  if (foundingOffer) {
    params.set('subscription_data[trial_period_days]', String(foundingOffer.freeDays));
    params.set('metadata[founding_number]', String(foundingOffer.foundingNumber));
    params.set('metadata[founding_cohort]', foundingOffer.cohort);
    params.set('subscription_data[metadata][founding_number]', String(foundingOffer.foundingNumber));
    params.set('subscription_data[metadata][founding_cohort]', foundingOffer.cohort);
  }
  try {
    const checkoutSession = await stripeRequest(env, 'POST', '/checkout/sessions', params);
    return json({
      ok: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      plan,
      founding: foundingOffer ? {
        number: foundingOffer.foundingNumber,
        cohort: foundingOffer.cohort,
        freeDays: foundingOffer.freeDays,
        recurringPriceCents: foundingOffer.recurringPriceCents,
      } : null,
    });
  } catch (error) {
    if (foundingOffer) await releaseFoundingReservation(db, auth.user.id).catch(() => {});
    throw error;
  }
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
async function finalizePendingLoveNoteUsage(env, user, userId) {
  if (!user?.stripe_customer_id) return null;
  const customerId = encodeURIComponent(user.stripe_customer_id);
  const pending = await stripeRequest(env, 'GET', `/invoiceitems?customer=${customerId}&pending=true&limit=100`);
  const loveNoteItems = (pending?.data || []).filter(item => item?.metadata?.o2ol_type === 'love_note_sms');
  if (!loveNoteItems.length) return null;

  const params = new URLSearchParams();
  params.set('customer', user.stripe_customer_id);
  params.set('collection_method', 'charge_automatically');
  params.set('pending_invoice_items_behavior', 'include');
  params.set('auto_advance', 'true');
  params.set('description', 'Final One2OneLove Love Note usage');
  params.set('metadata[o2ol_type]', 'love_note_usage_final');
  params.set('metadata[user_id]', userId);
  const invoice = await stripeRequest(env, 'POST', '/invoices', params);
  if (!invoice?.id) throw new Error('Stripe did not create the final Love Note usage invoice.');

  const finalizeParams = new URLSearchParams();
  finalizeParams.set('auto_advance', 'true');
  return stripeRequest(env, 'POST', `/invoices/${encodeURIComponent(invoice.id)}/finalize`, finalizeParams);
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
  const userId = subscription?.metadata?.user_id || invoice?.metadata?.user_id;
  if (!userId) return;
  const user = await getBillingUser(db, userId).catch(() => null);
  if (!user) return;
  const plan = canonicalPlan(subscription?.metadata?.plan_name || invoice?.metadata?.plan_name || user.subscription_plan) || 'Premiere';
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
      await activateFoundingMember(db, userId);
      await updateFromSubscription(db, userId, subscription, plan);
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
        await db.query(`INSERT INTO public.subscription_changes(user_id,from_plan,to_plan,change_type) VALUES($1::uuid,$2,$2,'cancel')`, [userId,user.subscription_plan]);
      }
      await db.query(
        `UPDATE public.users SET subscription_status='cancelled',
          stripe_subscription_id=NULL,subscription_current_period_start=NULL,subscription_current_period_end=NULL,
          cancel_at_period_end=false,canceled_at=now(),updated_at=now() WHERE id=$1::uuid`,
        [userId],
      );
      await forfeitFoundingRate(db, userId);
      await finalizePendingLoveNoteUsage(env, user, userId);
      break;
    }
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      const subscriptionId = invoiceSubscriptionId(object);
      const subscription = subscriptionId
        ? await stripeRequest(env, 'GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`)
        : null;
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

    if (url.pathname === '/api/billing/founding-offer' && request.method === 'GET') {
      const optionalAuth = await session(request, env).catch(() => null);
      return withDb(env, async db => json({ ok: true, offer: await foundingOfferSnapshot(db, optionalAuth?.user?.id || null) }));
    }

    const auth = await session(request, env);
    if (!auth) return fail('Authentication required.', 401, 'unauthorized');

    return await withDb(env, async db => {
      if (url.pathname === '/api/billing/subscription' && request.method === 'GET') {
        return json({ ok: true, subscription: decorateSubscription(await getBillingUser(db, auth.user.id)) });
      }
      if (url.pathname === '/api/billing/payments' && request.method === 'GET') {
        const result = await db.query('SELECT * FROM public.payment_history WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 100', [auth.user.id]);
        return json({ ok: true, payments: result.rows });
      }
      if (url.pathname === '/api/billing/trial' && request.method === 'POST') {
        return fail('Recurring trials are retired. One2OneLove accounts are free and metered premium services use O2OL Tokens.',410,'legacy_subscription_model_retired');
      }
      if (url.pathname === '/api/billing/checkout' && request.method === 'POST') {
        return fail('Premiere/Exclusive recurring checkout is retired. Use One2OneLove Credit instead.',410,'legacy_subscription_model_retired');
      }
      if (url.pathname === '/api/billing/cancel' && request.method === 'POST') {
        return fail('Legacy subscription changes are frozen in Token Prelaunch while historical value is reconciled. No Stripe subscription was changed.',423,'legacy_subscription_reconciliation_locked');
      }
      if (url.pathname === '/api/billing/reactivate' && request.method === 'POST') {
        return fail('Legacy subscription changes are frozen in Token Prelaunch while historical value is reconciled. No Stripe subscription was changed.',423,'legacy_subscription_reconciliation_locked');
      }
      if (url.pathname === '/api/billing/config' && request.method === 'GET') {
        return json({
          ok:true,
          access_model:'free_tokens',
          free_account:true,
          recurring_checkout_ready:false,
          legacy_subscription_mutations_locked:true,
          token_wallet:'/api/tokens/wallet',
          token_checkout:'/api/tokens/checkout',
          founding_limit:FOUNDING_LIMIT,
          founding_economics_pending_calibration:true,
        });
      }
      return fail('Not found.', 404, 'not_found');
    });
  } catch (error) {
    console.error('Billing API error:', error?.message || error);
    return fail(error?.message || 'Billing request failed.', error?.status || 500, error?.code || 'billing_error');
  }
}
