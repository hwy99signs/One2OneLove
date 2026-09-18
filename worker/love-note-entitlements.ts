// @ts-nocheck
import { Client } from 'pg';
import { scheduledSmsReadiness, scheduledSmsReady } from './scheduled-love-notes';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

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
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'basic') return 'Basic';
  if (raw === 'premier' || raw === 'premiere') return 'Premier';
  if (raw === 'exclusive') return 'Exclusive';
  return 'Basic';
}
function limitsFor(plan) {
  if (plan === 'Exclusive') return { monthly: 60, daily: 2 };
  if (plan === 'Premier') return { monthly: 30, daily: 1 };
  return { monthly: 4, daily: null };
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
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const value = `${values.year}-${values.month}-${values.day}`;
    if (validDateText(value)) return value;
  } catch (_) {}
  return new Date().toISOString().slice(0, 10);
}
async function ensureProfile(db, auth) {
  await db.query(
    `INSERT INTO public.users (id,email,name,user_type,is_active)
     VALUES($1::uuid,$2,$3,'regular',true)
     ON CONFLICT (id) DO UPDATE SET
       email=EXCLUDED.email,
       name=COALESCE(NULLIF(public.users.name,''),EXCLUDED.name),
       is_active=true`,
    [auth.user.id, auth.user.email || '', auth.user.name || auth.user.email?.split('@')[0] || 'Member'],
  );
}
async function planForUser(db, userId) {
  const result = await db.query(
    `SELECT subscription_plan,subscription_status FROM public.users WHERE id=$1::uuid`,
    [userId],
  );
  const row = result.rows[0] || {};
  const stored = canonicalPlan(row.subscription_plan);
  const trial = ['trial', 'trialing'].includes(String(row.subscription_status || '').toLowerCase());
  const effective = trial ? 'Exclusive' : stored;
  return { storedPlan: stored, effectivePlan: effective, subscriptionStatus: row.subscription_status || 'inactive', ...limitsFor(effective) };
}
async function walletBalance(db, userId, lock = false) {
  const result = await db.query(
    `SELECT available_sends,lifetime_purchased_sends,updated_at
       FROM public.sms_send_credit_wallets
      WHERE user_id=$1::uuid${lock ? ' FOR UPDATE' : ''}`,
    [userId],
  );
  return {
    availableSends: Number(result.rows[0]?.available_sends || 0),
    lifetimePurchasedSends: Number(result.rows[0]?.lifetime_purchased_sends || 0),
    updatedAt: result.rows[0]?.updated_at || null,
  };
}
async function usageForDate(db, userId, quotaDate) {
  const plan = await planForUser(db, userId);
  const quotaMonth = monthStart(quotaDate);
  const counts = await db.query(
    `SELECT
       count(*) FILTER (WHERE quota_source='included' AND status IN ('reserved','consumed'))::int AS included_month,
       count(*) FILTER (WHERE quota_date=$3::date AND status IN ('reserved','consumed'))::int AS all_day
     FROM public.love_note_send_entitlements
     WHERE user_id=$1::uuid AND quota_month=$2::date`,
    [userId, quotaMonth, quotaDate],
  );
  const wallet = await walletBalance(db, userId, false);
  const includedUsed = Number(counts.rows[0]?.included_month || 0);
  const dailyUsed = Number(counts.rows[0]?.all_day || 0);
  const includedRemaining = Math.max(0, plan.monthly - includedUsed);
  const dailyRemaining = plan.daily == null ? null : Math.max(0, plan.daily - dailyUsed);
  return {
    plan: plan.effectivePlan,
    storedPlan: plan.storedPlan,
    subscriptionStatus: plan.subscriptionStatus,
    monthlyLimit: plan.monthly,
    dailyLimit: plan.daily,
    includedUsed,
    includedRemaining,
    dailyUsed,
    dailyRemaining,
    extraAvailable: wallet.availableSends,
    totalAvailable: includedRemaining + wallet.availableSends,
    quotaDate,
    quotaMonth,
  };
}
async function allocateEntitlement(db, userId, sourceType, sourceId, quotaDate, status) {
  await db.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`o2ol-love-notes:${userId}`]);
  const usage = await usageForDate(db, userId, quotaDate);
  if (usage.dailyLimit != null && usage.dailyUsed >= usage.dailyLimit) {
    throw Object.assign(new Error(`Your ${usage.plan} plan allows ${usage.dailyLimit} SMS Love Note${usage.dailyLimit === 1 ? '' : 's'} per day.`), {
      status: 429, code: 'daily_send_limit', topUpUrl: '/SendCredits', usage,
    });
  }

  let quotaSource = 'included';
  if (usage.includedUsed >= usage.monthlyLimit) {
    const wallet = await walletBalance(db, userId, true);
    if (wallet.availableSends <= 0) {
      throw Object.assign(new Error('Your included SMS Love Note sends are used. Add more sends to continue.'), {
        status: 402, code: 'send_limit_reached', topUpUrl: '/SendCredits', usage,
      });
    }
    quotaSource = 'purchased';
    await db.query(
      `UPDATE public.sms_send_credit_wallets
          SET available_sends=available_sends-1,updated_at=now()
        WHERE user_id=$1::uuid AND available_sends>0`,
      [userId],
    );
  }

  await db.query(
    `INSERT INTO public.love_note_send_entitlements
      (user_id,source_type,source_id,quota_month,quota_date,quota_source,status)
     VALUES($1::uuid,$2,$3::uuid,$4::date,$5::date,$6,$7)`,
    [userId, sourceType, sourceId, monthStart(quotaDate), quotaDate, quotaSource, status],
  );
  return quotaSource;
}
async function postSent(db, auth, body) {
  const title = cleanText(body.note_title, 250, true);
  const content = cleanText(body.note_content, 10000, true);
  const recipientType = cleanText(body.recipient_type, 50, true);
  const allowedTypes = new Set(['partner', 'sms', 'social_media', 'other']);
  if (!allowedTypes.has(recipientType)) return fail('Invalid recipient_type.');
  const recipient = cleanText(body.recipient_identifier, 500, false);
  const platform = cleanText(body.social_platform, 100, false);
  const isSms = recipientType === 'partner' || recipientType === 'sms';
  const quotaDate = dateForTimezone(cleanText(body.timezone || body.client_timezone || 'UTC', 100, false) || 'UTC');

  await db.query('BEGIN');
  try {
    const result = await db.query(
      `INSERT INTO public.sent_love_notes
        (user_id,note_title,note_content,recipient_type,recipient_identifier,social_platform,created_by)
       VALUES($1::uuid,$2,$3,$4,$5,$6,$1::uuid)
       RETURNING id,note_title,note_content,recipient_type,recipient_identifier,social_platform,sent_date,created_at`,
      [auth.user.id, title, content, recipientType, recipient, platform],
    );
    let quotaSource = null;
    if (isSms) {
      quotaSource = await allocateEntitlement(db, auth.user.id, 'direct', result.rows[0].id, quotaDate, 'consumed');
    }
    await db.query('COMMIT');
    return json({ ok: true, note: result.rows[0], quotaSource, usage: isSms ? await usageForDate(db, auth.user.id, quotaDate) : null }, 201);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
async function postScheduled(db, env, auth, body) {
  const title = cleanText(body.note_title, 250, true);
  const content = cleanText(body.note_content, 10000, true);
  const scheduledDate = cleanText(body.scheduled_date, 10, true);
  const scheduledTime = cleanText(body.scheduled_time, 8, true);
  const scheduledTimezone = cleanText(body.scheduled_timezone || 'UTC', 100, true);
  const rawPhone = cleanText(body.recipient_phone, 100, true);
  const recipientPhone = String(rawPhone || '').replace(/[\\s().-]/g, '');
  const deliveryMethod = cleanText(body.delivery_method || 'sms', 20, true);
  const language = cleanText(body.note_language || 'en', 10, true);
  if (!validDateText(scheduledDate)) return fail('Invalid scheduled date.');
  if (deliveryMethod !== 'sms') return fail('Only scheduled SMS delivery is enabled for this launch.', 400, 'unsupported_delivery_method');
  if (!/^\\+[1-9]\\d{7,14}$/.test(recipientPhone)) return fail('Enter a valid phone number with country code.', 400, 'invalid_phone');
  if (!scheduledSmsReady(env)) return fail('Scheduled SMS delivery is not available yet.', 503, 'scheduled_sms_not_ready');
  const zone = await db.query(`SELECT 1 FROM pg_timezone_names WHERE name=$1 LIMIT 1`, [scheduledTimezone]);
  if (!zone.rowCount) return fail('Invalid scheduled_timezone.');

  await db.query('BEGIN');
  try {
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
    let quotaSource = null;
    if (deliveryMethod === 'sms') {
      quotaSource = await allocateEntitlement(db, auth.user.id, 'scheduled', result.rows[0].id, scheduledDate, 'reserved');
    }
    await db.query('COMMIT');
    return json({ ok: true, note: result.rows[0], quotaSource }, 201);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
async function cancelScheduled(db, auth, noteId) {
  await db.query('BEGIN');
  try {
    const note = await db.query(
      `SELECT id,status FROM public.scheduled_love_notes
        WHERE id=$1::uuid AND user_id=$2::uuid FOR UPDATE`,
      [noteId, auth.user.id],
    );
    if (!note.rows[0] || !['scheduled','failed'].includes(note.rows[0].status)) {
      await db.query('ROLLBACK');
      return fail('Scheduled note not found or cannot be cancelled.', 404, 'not_found');
    }
    const entitlement = await db.query(
      `SELECT id,quota_source,status FROM public.love_note_send_entitlements
        WHERE source_type='scheduled' AND source_id=$1::uuid AND user_id=$2::uuid FOR UPDATE`,
      [noteId, auth.user.id],
    );
    const ent = entitlement.rows[0];
    if (ent && ent.status !== 'released') {
      if (ent.quota_source === 'purchased') {
        await db.query(
          `INSERT INTO public.sms_send_credit_wallets(user_id,available_sends,lifetime_purchased_sends,updated_at)
           VALUES($1::uuid,1,0,now())
           ON CONFLICT (user_id) DO UPDATE SET available_sends=public.sms_send_credit_wallets.available_sends+1,updated_at=now()`,
          [auth.user.id],
        );
      }
      await db.query(`UPDATE public.love_note_send_entitlements SET status='released',updated_at=now() WHERE id=$1::uuid`, [ent.id]);
    }
    const updated = await db.query(
      `UPDATE public.scheduled_love_notes SET status='cancelled',updated_at=now()
        WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id,status,updated_at`,
      [noteId, auth.user.id],
    );
    await db.query('COMMIT');
    return json({ ok: true, note: updated.rows[0] });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

export async function handleLoveNoteEntitlementRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/love-notes/')) return null;
  const supported =
    url.pathname === '/api/love-notes/usage' ||
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
    return fail(error?.message || 'Unable to manage Love Note sending allowance.', error?.status || 500, error?.code || 'love_note_entitlement_error', {
      topUpUrl: error?.topUpUrl,
      usage: error?.usage,
    });
  }
}
