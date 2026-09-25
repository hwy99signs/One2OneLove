// @ts-nocheck
import { Client } from 'pg';
import { scheduledSmsReadiness, scheduledSmsReady, sendTwilioLoveNoteSms } from './scheduled-love-notes';
import {
  CUSTOM_LOVE_NOTE_MAX_CHARACTERS,
  LOVE_NOTE_SEND_PRICE_CENTS,
  loveNoteSendAccess,
  loveNoteUsageSummary,
} from './love-note-billing';

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
  if ([...text].length > max) {
    throw Object.assign(new Error(`Text value exceeds ${max} characters.`), { status: 400, code: 'text_too_long' });
  }
  return text || null;
}
function validateLoveNoteBody(value) {
  const content = cleanText(value, CUSTOM_LOVE_NOTE_MAX_CHARACTERS, true);
  if (/\p{Extended_Pictographic}/u.test(content)) {
    throw Object.assign(new Error('Custom Love Notes cannot contain user-added emojis. One2OneLove adds the ❤️ footer automatically to delivered SMS Love Notes.'), {
      status: 400,
      code: 'emoji_not_allowed',
    });
  }
  return content;
}
function canonicalPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'exclusive') return 'Exclusive';
  return 'Premiere';
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
async function planForUser(db, userId) {
  const result = await db.query(
    `SELECT subscription_plan,subscription_status FROM public.users WHERE id=$1::uuid`,
    [userId],
  );
  const row = result.rows[0] || {};
  const stored = canonicalPlan(row.subscription_plan);
  const trial = ['trial', 'trialing'].includes(String(row.subscription_status || '').toLowerCase());
  const effective = trial ? 'Exclusive' : stored;
  return { storedPlan: stored, effectivePlan: effective, subscriptionStatus: row.subscription_status || 'inactive' };
}
async function categoryPreferenceForDate(db, userId, quotaDate) {
  const plan = await planForUser(db, userId);
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
  const plan = await planForUser(db, userId);
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
  const usage = await loveNoteUsageSummary(db, userId);
  return {
    ...usage,
    quotaDate,
    quotaMonth: monthStart(quotaDate),
  };
}

// This route records user-initiated external sharing (for example opening the
// phone's SMS composer). It does not represent One2OneLove-delivered Twilio SMS
// and therefore does not create a $0.29 One2OneLove delivery charge.
async function postSent(db, auth, body) {
  const title = cleanText(body.note_title, 250, true);
  const content = validateLoveNoteBody(body.note_content);
  const recipientType = cleanText(body.recipient_type, 50, true);
  const allowedTypes = new Set(['social_media', 'other']);
  if (!allowedTypes.has(recipientType)) {
    return fail('SMS Love Notes must use One2OneLove managed SMS delivery.', 400, 'managed_sms_required');
  }
  const recipient = cleanText(body.recipient_identifier, 500, false);
  const platform = cleanText(body.social_platform, 100, false);

  const result = await db.query(
    `INSERT INTO public.sent_love_notes
      (user_id,note_title,note_content,recipient_type,recipient_identifier,social_platform,created_by)
     VALUES($1::uuid,$2,$3,$4,$5,$6,$1::uuid)
     RETURNING id,note_title,note_content,recipient_type,recipient_identifier,social_platform,sent_date,created_at`,
    [auth.user.id, title, content, recipientType, recipient, platform],
  );
  return json({ ok: true, note: result.rows[0], one2OneLoveSmsChargeCents: 0 }, 201);
}

async function postImmediateSms(db, env, auth, body) {
  if (!scheduledSmsReady(env)) {
    return fail('One2OneLove SMS delivery is not available yet.', 503, 'sms_delivery_not_ready');
  }

  const title = cleanText(body.note_title, 250, true);
  const content = validateLoveNoteBody(body.note_content);
  if (/\p{Extended_Pictographic}/u.test(title)) {
    return fail('User-added emojis are not supported in Love Note SMS text. One2OneLove adds the ❤️ footer automatically.', 400, 'emoji_not_allowed');
  }
  const rawPhone = cleanText(body.recipient_phone || body.recipient_identifier, 100, true);
  const recipientPhone = String(rawPhone || '').replace(/[\s().-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(recipientPhone)) {
    return fail('Enter a valid phone number with country code.', 400, 'invalid_phone');
  }
  const quotaDate = dateForTimezone(cleanText(body.timezone || body.client_timezone || 'UTC', 100, false) || 'UTC');
  const sourceId = crypto.randomUUID();

  await db.query('BEGIN');
  try {
    await db.query(
      `INSERT INTO public.sent_love_notes
        (id,user_id,note_title,note_content,recipient_type,recipient_identifier,social_platform,created_by)
       VALUES($1::uuid,$2::uuid,$3,$4,'sms',$5,NULL,$2::uuid)`,
      [sourceId, auth.user.id, title, content, recipientPhone],
    );

    const reservation = await reserveLoveNoteSend(
      db,
      auth.user.id,
      'direct',
      sourceId,
      quotaDate,
      'reserved',
    );

    await sendTwilioLoveNoteSms(env, {
      recipient_phone: recipientPhone,
      note_title: title,
      note_content: content,
    });

    let billingPending = false;
    let invoiceItemId = null;
    if (!reservation.free) {
      try {
        const billed = await billReservedLoveNoteSend(env, db, auth.user.id, sourceId, 1);
        invoiceItemId = billed?.invoiceItemId || null;
      } catch (billingError) {
        // Delivery already succeeded. Never resend the SMS just because Stripe had a transient error.
        billingPending = true;
        console.error('Delivered immediate Love Note billing pending', {
          sourceId,
          userId: auth.user.id,
          message: billingError?.message,
        });
      }
    }

    await consumeLoveNoteReservation(db, auth.user.id, sourceId);
    await db.query('COMMIT');

    return json({
      ok: true,
      note: {
        id: sourceId,
        note_title: title,
        note_content: content,
        recipient_type: 'sms',
        recipient_identifier: recipientPhone,
      },
      billing: {
        free: reservation.free === true,
        amountCents: reservation.free ? 0 : LOVE_NOTE_SEND_PRICE_CENTS,
        invoiceItemId,
        billingPending,
      },
      usage: await usageForDate(db, auth.user.id, quotaDate),
    }, 201);
  } catch (error) {
    await db.query('ROLLBACK').catch(() => null);
    throw error;
  }
}

async function postScheduled(db, env, auth, body) {
  const title = cleanText(body.note_title, 250, true);
  const content = validateLoveNoteBody(body.note_content);
  const scheduledDate = cleanText(body.scheduled_date, 10, true);
  const scheduledTime = cleanText(body.scheduled_time, 8, true);
  const scheduledTimezone = cleanText(body.scheduled_timezone || 'UTC', 100, true);
  const rawPhone = cleanText(body.recipient_phone, 100, true);
  const recipientPhone = String(rawPhone || '').replace(/[\s().-]/g, '');
  const deliveryMethod = cleanText(body.delivery_method || 'sms', 20, true);
  const language = cleanText(body.note_language || 'en', 10, true);
  if (!validDateText(scheduledDate)) return fail('Invalid scheduled date.');
  if (deliveryMethod !== 'sms') return fail('Only scheduled SMS delivery is enabled for this launch.', 400, 'unsupported_delivery_method');
  if (!/^\+[1-9]\d{7,14}$/.test(recipientPhone)) return fail('Enter a valid phone number with country code.', 400, 'invalid_phone');
  if (!scheduledSmsReady(env)) return fail('One2OneLove SMS delivery is not available yet.', 503, 'scheduled_sms_not_ready');
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
    const access = await loveNoteSendAccess(db, auth.user.id);
    if (!access.allowed) {
      throw Object.assign(new Error(access.message || 'Love Note SMS delivery is unavailable.'), {
        status: access.code === 'trial_sms_locked' ? 403 : 402,
        code: access.code || 'love_note_sms_unavailable',
        usage: access,
      });
    }
    await db.query('COMMIT');
    return json({
      ok: true,
      note: result.rows[0],
      billing: {
        free: access.firstFreeAvailable,
        amountCents: access.firstFreeAvailable ? 0 : LOVE_NOTE_SEND_PRICE_CENTS,
        firstPaidSendFree: true,
        additionalSendPriceCents: LOVE_NOTE_SEND_PRICE_CENTS,
      },
    }, 201);
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

    await db.query(
      `UPDATE public.love_note_send_entitlements
          SET status='released',updated_at=now()
        WHERE user_id=$1::uuid AND source_type='scheduled' AND source_id=$2::uuid AND status='reserved'`,
      [auth.user.id, noteId],
    );
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
    url.pathname === '/api/love-notes/categories' ||
    (url.pathname === '/api/love-notes/delivery-readiness' && request.method === 'GET') ||
    (url.pathname === '/api/love-notes/sent' && request.method === 'POST') ||
    (url.pathname === '/api/love-notes/send-sms' && request.method === 'POST') ||
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
        return json({
          ok: true,
          delivery: {
            ...scheduledSmsReadiness(env),
            firstPaidSendFree: true,
            additionalSendPriceCents: LOVE_NOTE_SEND_PRICE_CENTS,
            customNoteMaxCharacters: CUSTOM_LOVE_NOTE_MAX_CHARACTERS,
            trialSendsAllowed: false,
          },
        });
      }
      if (url.pathname === '/api/love-notes/sent' && request.method === 'POST') {
        return postSent(db, auth, await readJson(request));
      }
      if (url.pathname === '/api/love-notes/send-sms' && request.method === 'POST') {
        return postImmediateSms(db, env, auth, await readJson(request));
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
    return fail(error?.message || 'Unable to manage Love Note sending.', error?.status || 500, error?.code || 'love_note_entitlement_error', {
      usage: error?.usage,
    });
  }
}
