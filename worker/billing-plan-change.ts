// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request') { return json({ ok: false, error: { code, message } }, status); }
function canonicalPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'basic') return 'Basic';
  if (raw === 'premier' || raw === 'premiere') return 'Premiere';
  if (raw === 'exclusive') return 'Exclusive';
  return null;
}
function customerPlan(value) {
  const plan = canonicalPlan(value);
  if (plan === 'Basic') return 'Basic';
  if (plan === 'Premiere') return 'Premier';
  return plan || 'Basic';
}
function priceFor(plan) {
  if (plan === 'Basic') return 4.99;
  if (plan === 'Premiere') return 9.99;
  if (plan === 'Exclusive') return 19.99;
  return 0;
}
function rank(plan) {
  if (plan === 'Exclusive') return 3;
  if (plan === 'Premiere') return 2;
  return 1;
}
function priceIdFor(env, plan) {
  if (plan === 'Basic') return env.STRIPE_PRICE_BASIC || null;
  if (plan === 'Premiere') return env.STRIPE_PRICE_PREMIERE || null;
  if (plan === 'Exclusive') return env.STRIPE_PRICE_EXCLUSIVE || null;
  return null;
}
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', { headers: { cookie, accept: 'application/json' } });
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
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw Object.assign(new Error('Expected application/json body.'), { status: 400, code: 'bad_request' });
  return request.json();
}
async function stripeRequest(env, method, path, params = null) {
  if (!env.STRIPE_SECRET_KEY) throw Object.assign(new Error('Payment processing is not configured yet.'), { status: 503, code: 'billing_not_configured' });
  const headers = { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, accept: 'application/json' };
  let body;
  if (params) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    body = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  }
  const response = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(payload?.error?.message || 'Stripe request failed.'), { status: 502, code: payload?.error?.code || 'stripe_error' });
  return payload;
}

export async function handleBillingPlanChangeRequest(request, env, url) {
  if (url.pathname !== '/api/billing/change-plan') return null;
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    const input = await readJson(request);
    const targetPlan = canonicalPlan(input?.planName || input?.plan_name || input?.plan);
    if (!targetPlan) return fail('Choose Basic, Premier, or Exclusive.', 400, 'invalid_plan');
    const targetPriceId = priceIdFor(env, targetPlan);
    if (!targetPriceId) return fail(`Stripe price is not configured for ${customerPlan(targetPlan)}.`, 503, 'billing_not_configured');

    return await withDb(env, async db => {
      const result = await db.query(
        `SELECT subscription_plan,subscription_status,stripe_subscription_id
           FROM public.users WHERE id=$1::uuid`,
        [auth.user.id],
      );
      const user = result.rows[0];
      if (!user?.stripe_subscription_id) return fail('No Stripe subscription is connected to this account.', 409, 'no_paid_subscription');
      if (String(user.subscription_status || '').toLowerCase() !== 'trial') {
        return fail('Plan switching on this screen is currently available during the 7-day trial.', 409, 'trial_change_only');
      }

      const currentPlan = canonicalPlan(user.subscription_plan) || 'Basic';
      const subscription = await stripeRequest(env, 'GET', `/subscriptions/${encodeURIComponent(user.stripe_subscription_id)}`);
      const item = subscription?.items?.data?.[0];
      if (!item?.id) return fail('Stripe subscription item could not be found.', 502, 'stripe_subscription_item_missing');

      const params = new URLSearchParams();
      params.set('items[0][id]', item.id);
      params.set('items[0][price]', targetPriceId);
      params.set('proration_behavior', 'none');
      params.set('metadata[user_id]', auth.user.id);
      params.set('metadata[plan_name]', targetPlan);
      params.set('metadata[trial_entitlement]', 'Exclusive');
      const updated = await stripeRequest(env, 'POST', `/subscriptions/${encodeURIComponent(user.stripe_subscription_id)}`, params);

      await db.query('BEGIN');
      try {
        await db.query(
          `UPDATE public.users
              SET subscription_plan=$1,subscription_price=$2,subscription_status='trial',updated_at=now()
            WHERE id=$3::uuid`,
          [targetPlan, priceFor(targetPlan), auth.user.id],
        );
        if (currentPlan !== targetPlan) {
          await db.query(
            `INSERT INTO public.subscription_changes(user_id,from_plan,to_plan,change_type,effective_date)
             VALUES($1::uuid,$2,$3,$4,now())`,
            [auth.user.id, currentPlan, targetPlan, rank(targetPlan) >= rank(currentPlan) ? 'upgrade' : 'downgrade'],
          );
        }
        await db.query('COMMIT');
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

      return json({
        ok: true,
        plan: customerPlan(targetPlan),
        storedPlan: targetPlan,
        subscriptionStatus: 'trial',
        trialEntitlement: 'Exclusive',
        stripeSubscriptionStatus: updated?.status || 'trialing',
      });
    });
  } catch (error) {
    console.error('Trial plan change error:', error?.message || error);
    return fail(error?.message || 'Unable to change your trial plan.', error?.status || 500, error?.code || 'plan_change_error');
  }
}
