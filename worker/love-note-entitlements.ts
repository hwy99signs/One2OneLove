// @ts-nocheck
import { Client } from 'pg';
import { scheduledSmsReadiness, scheduledSmsReady } from './scheduled-love-notes';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const SMS_PRICE_CENTS = 29;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request', extra = {}) {
  return json({ ok: false, error: { code, message, ...extra } }, status);
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
function cleanText(value, max = 5000, required = false) {
  if (value == null) {
    if (required) throw Object.assign(new Error('Required text value is missing.'), { status: 400, code: 'bad_request' });
    return null;
  }
  const text = String(value).trim();
  if (required && !text) throw Object.assign(new Error('Required text value is empty.'), { status: 400, code: 'bad_request' });
  if (text.length > max) throw Object.assign(new Error(`Text value exceeds ${max} characters.`), { status: 400, code: 'bad_request' });
  return text || null;
}
function canonicalPlan(value) {
  return String(value || '').trim().toLowerCase() === 'exclusive' ? 'Exclusive' : 'Premiere';
}
const LOVE_NOTE_CATEGORY_IDS = [
  'romantic','lgbtqRomantic','lgbtqSupport','lgbtqMilestone','sweet','playful','deep',
  'appreciation','memories','future','morning','night','daily','special','dateIdeas',
  'milestone','justBecause','encouragement','apology','family','friends','heartBroken',
  'sick','goodLuck','holiday','missingYou','religious','service','workplace',
];
const DEFAULT_CATEGORY_IDS = [
  'romantic','sweet','appreciation','memories','daily','encouragement',
  'playful','deep','future','morning','night','special',
  'dateIdeas','milestone','justBecause','apology','family','friends',
];
function categoryLimit(plan) {
  if (plan === 'Exclusive') return LOVE_NOTE_CATEGORY_IDS.length;
  return 18;
}
function monthStart(dateText) {
  return `${String(dateText).slice(0, 7)}-01`;
}
function validDateText(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function dateForTimezone(timeZone = 'UTC') {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const value = `${values.year}-${values.month}-${values.day}`;
    if (validDateText(value)) return value;
  } catch (_) {}
  return new Date().toISOString().slice(0, 10);
}
async function ensureProfile(db, auth) {
  await db.query(
    `INSERT INTO public.users
      (id,email,name,user_type,is_active,subscription_plan,subscription_price,subscription_status)
     VALUES($1::uuid,$2,$3,'regular',true,'Premiere',9.99,'inactive')
     ON CONFLICT (id) DO UPDATE SET
       email=EXCLUDED.email,
       name=COALESCE(NULLIF(public.users.name,''),EXCLUDED.name),
       is_active=true`,
    [auth.user.id, auth.user.email || '', auth.user.name || auth.user.email?.split('@')[0] || 'Member'],
  );
}
async function billingState(db, userId) {
  const result = await db.query(
    `SELECT subscription_plan,subscription_status,stripe_subscription_id,stripe_customer_id,
            EXISTS(
              SELECT 1 FROM public.payment_history ph
               WHERE ph.user_id=$1::uuid
                 AND ph.status='succeeded'
                 AND COALESCE(ph.amount,0) > 0
            ) AS paid_invoice_ready
       FROM public.users WHERE id=$1::uuid`,
    [userId],
  );
  const row = result.rows[0] || {};
  const status = String(row.subscription_status || '').toLowerCase();
  const paidReady = row.paid_invoice_ready === true;
  return {
    storedPlan: canonicalPlan(row.subscription_plan),
    effectivePlan: ['trial','trialing'].includes(status) ? 'Exclusive' : canonicalPlan(row.subscription_plan),
    subscriptionStatus: row.subscription_status || 'inactive',
    stripeSubscriptionId: row.stripe_subscription_id || null,
    stripeCustomerId: row.stripe_customer_id || null,
    paidInvoiceReady: paidReady,
    smsSendingEligible: status === 'active' && Boolean(row.stripe_subscription_id && row.stripe_customer_id && paidReady),
  };
}
async function categoryPreferenceForDate(db, userId, quotaDate) {
  const plan = await billingState(db, userId);
  const quotaMonth = monthStart(quotaDate);
  const limit = categoryLimit(plan.effectivePlan);
  if (plan.effectivePlan === 'Exclusive') {
    return { plan: plan.effectivePlan, limit, quotaMonth, categories: LOVE_NOTE_CATEGORY_IDS, configured: true };
  }
  const result = await db.query(
    `SELECT plan,categories FROM public.love_note_category_preferences
      WHERE user_id=$1::uuid AND quota_month=$2::date`,
    [userId, quotaMonth],
  );
  const stored = Array.isArray(result.rows[0]?.categories) ? result.rows[0].categories : [];
  const allowed = stored.filter(id => LOVE_NOTE_CATEGORY_IDS.includes(id)).slice(0, limit);
  const defaults = DEFAULT_CATEGORY_IDS.slice(0, limit);
  return {
    plan: plan.effectivePlan,
    limit,
    quotaMonth,
    categories: allowed.length ? allowed : defaults,
    configured: allowed.length > 0,
  };
}
async function saveCategoryPreference(db, userId, quotaDate, requestedCategories) {
  const plan = await billingState(db, userId);
  const quotaMonth = monthStart(quotaDate);
  const limit = categoryLimit(plan.effectivePlan);
  if (plan.effectivePlan === 'Exclusive') {
    return { plan: plan.effectivePlan, limit, quotaMonth, categories: LOVE_NOTE_CATEGORY_IDS, configured: true };
  }
  if (!Array.isArray(requestedCategories)) {
    throw Object.assign(new Error('categories must be an array.'), { status: 400, code: 'bad_request' });
  }
  const categories = [...new Set(requestedCategories.map(v => String(v || '').trim()).filter(Boolean))];
  if (!categories.length) {
    throw Object.assign(new Error('Choose at least one Love Note category.'), { status: 400, code: 'category_required' });
  }
  const invalid = categories.filter(id => !LOVE_NOTE_CATEGORY_IDS.includes(id));
  if (invalid.length) {
    throw Object.assign(new Error('One or more Love Note categories are invalid.'), { status: 400, code: 'invalid_category' });
  }
  if (categories.length > limit) {
    throw Object.assign(new Error(`Your ${plan.effectivePlan} plan allows up to ${limit} Love Note categories per month.`), {
      status: 400, code: 'category_limit',
    });
  }
  await db.query(
    `INSERT INTO public.love_note_category_preferences(user_id,quota_month,plan,categories,updated_at)
     VALUES($1::uuid,$2::date,$3,$4::jsonb,now())
     ON CONFLICT(user_id,quota_month) DO UPDATE
       SET plan=EXCLUDED.plan,categories=EXCLUDED.categories,updated_at=now()`,
    [userId, quotaMonth, plan.effectivePlan, JSON.stringify(categories)],
  );
  return { plan: plan.effectivePlan, limit, quotaMonth, categories, configured: true };
}
async function usageForDate(db, userId, quotaDate) {
  const plan = await billingState(db, userId);
  const counts = await db.query(
    `SELECT
       count(*) FILTER (WHERE source_type='scheduled' AND status='consumed')::int AS platform_sms_sent,
       count(*) FILTER (WHERE source_type='scheduled' AND status='consumed' AND quota_source='purchased')::int AS billable_sms_sent
     FROM public.love_note_send_entitlements
     WHERE user_id=$1::uuid`,
    [userId],
  );
  const sent = Number(counts.rows[0]?.platform_sms_sent || 0);
  const billable = Number(counts.rows[0]?.billable_sms_sent || 0);
  return {
    plan: plan.effectivePlan,
    storedPlan: plan.storedPlan,
    subscriptionStatus: plan.subscriptionStatus,
    paidInvoiceReady: plan.paidInvoiceReady,
    smsSendingEligible: plan.smsSendingEligible,
    firstPaidSmsLoveNoteFree: true,
    firstFreeAvailable: plan.paidInvoiceReady && sent === 0,
    smsPriceCents: SMS_PRICE_CENTS,
    platformSmsSent: sent,
    billableSmsSent: billable,
    quotaDate,
    quotaMonth: monthStart(quotaDate),
  };
}
async function postSent(db, auth, body) {
  const title = cleanText(body.note_title, 250, true);
  const content = cleanText(body.note_content, 10000, true);
  const recipientType = cleanText(body.recipient_type, 50, true);
  const allowedTypes = new Set(['partner', 'sms', 'social_media', 'other']);
  if (!allowedTypes.has(recipientType)) return fail('Invalid recipient_type.');
  const recipient = cleanText(body.recipient_identifier, 500, false);
  const platform = cleanText(body.social_platform, 100, false);

  const result = await db.query(
    `INSERT INTO public.sent_love_notes
      (user_id,note_title,note_content,recipient_type,recipient_identifier,social_platform,created_by)
     VALUES($1::uuid,$2,$3,$4,$5,$6,$1::uuid)
     RETURNING id,note_title,note_content,recipient_type,recipient_identifier,social_platform,sent_date,created_at`,
    [auth.user.id, title, content, recipientType, recipient, platform],
  );
  return json({ ok: true, note: result.rows[0] }, 201);
}
async function postScheduled(db, env, auth, body) {
  const title = cleanText(body.note_title, 250, true);
  const content = cleanText(body.note_content, 10000, true);
  const scheduledDate = cleanText(body.scheduled_date, 10, true);
  const scheduledTime = cleanText(body.scheduled_time, 8, true);
  const scheduledTimezone = cleanText(body.scheduled_timezone || 'UTC', 100, true);
  const rawPhone = cleanText(body.recipient_phone, 100, true);
  const recipientPhone = String(rawPhone || '').replace(/[\s().-]/g, '');
  const deliveryMethod = cleanText(body.delivery_method || 'sms', 20, true);
  const language = cleanText(body.note_language || 'en', 10, true);

  if (!validDateText(scheduledDate)) return fail('Invalid scheduled date.');
  if (deliveryMethod !== 'sms') return fail('Only scheduled SMS delivery is supported.', 400, 'unsupported_delivery_method');
  if (!/^\+[1-9]\d{7,14}$/.test(recipientPhone)) return fail('Enter a valid phone number with country code.', 400, 'invalid_phone');
  if (!scheduledSmsReady(env)) return fail('One2OneLove SMS delivery is not available yet.', 503, 'scheduled_sms_not_ready');

  const billing = await billingState(db, auth.user.id);
  if (['trial','trialing'].includes(String(billing.subscriptionStatus || '').toLowerCase())) {
    return fail('SMS Love Note sending is not available during the 7-day Full Access trial.', 402, 'sms_trial_unavailable');
  }
  if (!billing.smsSendingEligible) {
    return fail('SMS Love Note sending unlocks after your first successful paid subscription payment.', 402, 'paid_membership_required');
  }

  const zone = await db.query(`SELECT 1 FROM pg_timezone_names WHERE name=$1 LIMIT 1`, [scheduledTimezone]);
  if (!zone.rowCount) return fail('Invalid scheduled_timezone.');

  const result = await db.query(
    `INSERT INTO public.scheduled_love_notes
      (user_id,note_title,note_content,scheduled_date,scheduled_time,scheduled_timezone,
       recipient_phone,delivery_method,note_language,status)
     VALUES($1::uuid,$2,$3,$4::date,$5::time,$6,$7,$8,$9,'scheduled')
     RETURNING id,note_title,note_content,scheduled_date,scheduled_time,scheduled_timezone,
               recipient_phone,delivery_method,note_language,status,created_at,updated_at`,
    [auth.user.id, title, content, scheduledDate, scheduledTime, scheduledTimezone,
     recipientPhone, deliveryMethod, language],
  );
  const usage = await usageForDate(db, auth.user.id, dateForTimezone(scheduledTimezone));
  return json({
    ok: true,
    note: result.rows[0],
    billing: {
      firstFreeAvailable: usage.firstFreeAvailable,
      smsPriceCents: SMS_PRICE_CENTS,
      groupedWithSubscriptionBilling: true,
    },
  }, 201);
}
async function cancelScheduled(db, auth, noteId) {
  const updated = await db.query(
    `UPDATE public.scheduled_love_notes SET status='cancelled',updated_at=now()
      WHERE id=$1::uuid AND user_id=$2::uuid AND status IN ('scheduled','failed')
      RETURNING id,status,updated_at`,
    [noteId, auth.user.id],
  );
  if (!updated.rows[0]) return fail('Scheduled note not found or cannot be cancelled.', 404, 'not_found');
  return json({ ok: true, note: updated.rows[0] });
}

export async function handleLoveNoteEntitlementRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/love-notes/')) return null;
  const supported =
    url.pathname === '/api/love-notes/usage' ||
    url.pathname === '/api/love-notes/categories' ||
    (url.pathname === '/api/love-notes/delivery-readiness' && request.method === 'GET') ||
    (url.pathname === '/api/love-notes/sent' && request.method === 'POST') ||
    (url.pathname === '/api/love-notes/scheduled' && request.method === 'POST') ||
    /^\/api\/love-notes\/scheduled\/[0-9a-f-]{36}\/cancel$/i.test(url.pathname);
  if (!supported) return null;

  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    return await withDb(env, async db => {
      await ensureProfile(db, auth);
      if (url.pathname === '/api/love-notes/usage' && request.method === 'GET') {
        const quotaDate = dateForTimezone(url.searchParams.get('tz') || 'UTC');
        return json({ ok: true, usage: await usageForDate(db, auth.user.id, quotaDate) });
      }
      if (url.pathname === '/api/love-notes/categories') {
        const quotaDate = dateForTimezone(url.searchParams.get('tz') || 'UTC');
        if (request.method === 'GET') {
          return json({ ok: true, preference: await categoryPreferenceForDate(db, auth.user.id, quotaDate) });
        }
        if (request.method === 'PUT' || request.method === 'POST') {
          const input = await readJson(request);
          return json({ ok: true, preference: await saveCategoryPreference(db, auth.user.id, quotaDate, input?.categories) });
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      if (url.pathname === '/api/love-notes/delivery-readiness' && request.method === 'GET') {
        return json({ ok: true, delivery: scheduledSmsReadiness(env) });
      }
      if (url.pathname === '/api/love-notes/sent' && request.method === 'POST') {
        return postSent(db, auth, await readJson(request));
      }
      if (url.pathname === '/api/love-notes/scheduled' && request.method === 'POST') {
        return postScheduled(db, env, auth, await readJson(request));
      }
      const cancelMatch = url.pathname.match(/^\/api\/love-notes\/scheduled\/([0-9a-f-]{36})\/cancel$/i);
      if (cancelMatch && (request.method === 'PATCH' || request.method === 'POST')) {
        return cancelScheduled(db, auth, cancelMatch[1]);
      }
      return null;
    });
  } catch (error) {
    console.error('Love Note entitlement error:', error?.message || error);
    return fail(error?.message || 'Love Note request failed.', error?.status || 500, error?.code || 'love_note_error');
  }
}
