// @ts-nocheck
//
// Love Note "Credit" engine: regional SMS pricing enforcement, the total-body
// character cap, the first-free-send promo pot, weekly free-note eligibility,
// recipient opt-outs, send rate limits and the Twilio Lookup anti-farming
// check. Everything here is computed and enforced SERVER-SIDE on every send;
// the client can never state a price, a balance, or an eligibility result.
//
// Config lives in ./credit-config.ts (the one config table). Money unit is
// USD cents everywhere (wallet integer unit = 1 cent of Credit).

import { CREDIT_CONFIG, resolveSmsRegion, accountTierBaseCents, smsBodyFor } from './credit-config';
import { countCharacters } from './o2ol-cost-ledger';

function httpError(message, status, code, extra = {}) {
  return Object.assign(new Error(message), { status, code, ...extra });
}

// ---------------------------------------------------------------------------
// Schema (lazy, idempotent — same DDL as
// neon-migrations/2026-10-07-o2ol-credit-love-notes.sql)
// ---------------------------------------------------------------------------
let schemaEnsured = false;
// Lazy-ensure DDL tolerance (2026-10-08): on the preview database the
// connecting role does not own the pre-existing tables, so an ensure DDL
// statement against an object that is already in shape can fail with 42501
// (must be owner). The full DDL set is pre-applied by the table owner via
// preview-schema-preapply.sql; here, skip ONLY the benign already-in-shape
// codes (42501 insufficient_privilege, 42701 duplicate_column, 42P07
// duplicate_table) per statement and continue. Any other error still throws,
// and the DML that follows surfaces a genuinely missing object loudly.
const TOLERATED_DDL_CODES = new Set(['42501', '42701', '42P07']);
async function ensureDdl(db, sql) {
  try { await db.query(sql); }
  catch (err) { if (!TOLERATED_DDL_CODES.has(err?.code)) throw err; }
}

export async function ensureCreditSchema(db) {
  // Legacy function name retained for compatibility with the SMS safety helpers.
  // IMPORTANT: this function is SAFETY-SCHEMA ONLY. It must never create Credit
  // packages, change Token prices, or reinterpret the O2OL Token wallet.
  if (schemaEnsured) return;
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.o2ol_sms_optouts (
      phone_number text PRIMARY KEY,
      opted_out boolean NOT NULL DEFAULT true,
      source text NOT NULL DEFAULT 'twilio_inbound',
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  schemaEnsured = true;
}

// ---------------------------------------------------------------------------
// Character cap — total SMS body (title + content + footer, plus the
// signature line "— {name}" when the note is signed) <= 201 chars. The
// sender's name is included in the limit (owner ruling, 2026-10-08):
// signing shrinks the room left for title + content by the composed
// signature line's length; Send Anonymous leaves the full cap to the note.
// ---------------------------------------------------------------------------
export function assertSmsBodyWithinCap(title, content, senderName = null) {
  const total = countCharacters(smsBodyFor(title, content, senderName));
  if (total > CREDIT_CONFIG.maxSmsBodyCharacters) {
    throw httpError(
      `This Love Note is ${total} characters as an SMS (limit ${CREDIT_CONFIG.maxSmsBodyCharacters}). Shorten the title or note so it fits in 3 text segments.`,
      400,
      'sms_body_too_long',
      { totalCharacters: total, maxCharacters: CREDIT_CONFIG.maxSmsBodyCharacters },
    );
  }
  return total;
}

// ---------------------------------------------------------------------------
// Recipient opt-outs (STOP). Checked before EVERY send — immediate, scheduled
// at booking time, and again by the scheduled dispatcher at delivery time.
// ---------------------------------------------------------------------------
export async function isRecipientOptedOut(db, phone) {
  await ensureCreditSchema(db);
  const row = (await db.query(
    'SELECT opted_out FROM public.o2ol_sms_optouts WHERE phone_number=$1 LIMIT 1',
    [phone],
  )).rows[0];
  return row?.opted_out === true;
}

export async function setRecipientOptOut(db, phone, optedOut, source = 'twilio_inbound') {
  await ensureCreditSchema(db);
  await db.query(
    `INSERT INTO public.o2ol_sms_optouts(phone_number,opted_out,source,updated_at)
     VALUES($1,$2,$3,now())
     ON CONFLICT(phone_number) DO UPDATE SET opted_out=$2,source=$3,updated_at=now()`,
    [phone, Boolean(optedOut), source],
  );
}

export function assertNotOptedOut(optedOut) {
  if (optedOut) {
    throw httpError(
      'This recipient has opted out of text messages (STOP) and cannot be sent SMS Love Notes.',
      422,
      'recipient_opted_out',
    );
  }
}

// ---------------------------------------------------------------------------
// Send rate limits (per account, from the sent-notes ledger of record).
// ---------------------------------------------------------------------------
export async function assertSendRateLimit(db, userId) {
  const { sendsPerHour, sendsPerDay } = CREDIT_CONFIG.rateLimits;
  const row = (await db.query(
    `SELECT
       count(*) FILTER (WHERE created_at >= now() - interval '1 hour')::int AS last_hour,
       count(*) FILTER (WHERE created_at >= now() - interval '1 day')::int AS last_day
       FROM public.sent_love_notes
      WHERE user_id=$1::uuid AND recipient_type='sms'`,
    [userId],
  )).rows[0] || {};
  if (Number(row.last_hour || 0) >= sendsPerHour || Number(row.last_day || 0) >= sendsPerDay) {
    throw httpError('You are sending Love Notes too quickly. Please wait a little while and try again.', 429, 'send_rate_limited', {
      sendsPerHour,
      sendsPerDay,
    });
  }
}

// ---------------------------------------------------------------------------
// Twilio Lookup — anti-farming check run on FREE sends only. A free send is
// granted only when the account's verified number is confirmed to be a real
// mobile line. VoIP / non-fixed VoIP / landline / unknown all fail closed.
// ---------------------------------------------------------------------------
export async function lookupLineType(env, phone) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) return null;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const response = await fetch(
    `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone)}?Fields=line_type_intelligence`,
    { headers: { authorization: `Basic ${auth}`, accept: 'application/json' } },
  );
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  if (payload?.valid === false) return 'invalid';
  return payload?.line_type_intelligence?.type || null;
}

export async function assertFreeSendLineEligible(env, phone) {
  const type = await lookupLineType(env, phone);
  if (type !== 'mobile') {
    throw httpError(
      'Free Love Note sends require a verified mobile number (VoIP and landline numbers are not eligible).',
      422,
      'free_send_line_ineligible',
      { lineType: type },
    );
  }
  return type;
}

// ---------------------------------------------------------------------------
// First-free-send promo — monthly pot, hard caps, atomic redemption.
// ---------------------------------------------------------------------------
export function promoMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7); // YYYY-MM, UTC
}

async function ensurePromoMonth(db, monthKey) {
  const existing = (await db.query(
    'SELECT * FROM public.o2ol_credit_promo_months WHERE month_key=$1 LIMIT 1',
    [monthKey],
  )).rows[0];
  if (existing) return existing;
  // Unspent pot balance rolls over; slots do NOT (redemptions start at 0).
  const prior = (await db.query(
    `SELECT pot_balance_cents FROM public.o2ol_credit_promo_months
      WHERE month_key<$1 ORDER BY month_key DESC LIMIT 1`,
    [monthKey],
  )).rows[0];
  const opening = CREDIT_CONFIG.promo.monthlyPotCents + Number(prior?.pot_balance_cents || 0);
  const created = (await db.query(
    `INSERT INTO public.o2ol_credit_promo_months(month_key,pot_balance_cents,redemptions)
     VALUES($1,$2,0) ON CONFLICT(month_key) DO NOTHING RETURNING *`,
    [monthKey, opening],
  )).rows[0];
  if (created) return created;
  return (await db.query(
    'SELECT * FROM public.o2ol_credit_promo_months WHERE month_key=$1 LIMIT 1',
    [monthKey],
  )).rows[0];
}

export async function promoStatus(db) {
  await ensureCreditSchema(db);
  const monthKey = promoMonthKey();
  const month = await ensurePromoMonth(db, monthKey);
  const slotsLeft = Math.max(0, CREDIT_CONFIG.promo.monthlySlots - Number(month.redemptions || 0));
  return {
    monthKey,
    open: slotsLeft > 0 && Number(month.pot_balance_cents || 0) > 0,
    slotsLeft,
    potBalanceCents: Number(month.pot_balance_cents || 0),
    redemptions: Number(month.redemptions || 0),
  };
}

// Attempts to redeem the account's one free promo send. Returns
// { redemptionId, grantId, estimatedCostCents } or null when the promo is
// closed/exhausted or this account/phone already redeemed. Throws only for
// the Lookup line-eligibility failure (checked BEFORE any state changes).
// The caller must call rollbackFirstFreeSend if the SMS delivery then fails.
export async function grantByRequestKey(db, requestKey) {
  if (!requestKey) return null;
  return (await db.query(
    'SELECT * FROM public.o2ol_credit_free_note_grants WHERE request_key=$1 LIMIT 1',
    [requestKey],
  )).rows[0] || null;
}

export async function tryRedeemFirstFreeSend(db, env, { userId, accountPhone, recipientRegion, requestKey = null }) {
  await ensureCreditSchema(db);
  if (!accountPhone || !recipientRegion || recipientRegion.excluded) return null;

  const already = (await db.query(
    'SELECT id FROM public.o2ol_credit_promo_redemptions WHERE user_id=$1::uuid OR phone_number=$2 LIMIT 1',
    [userId, accountPhone],
  )).rows[0];
  if (already) return null;

  // Anti-farming: VoIP/recycled-number guard before the pot is touched.
  await assertFreeSendLineEligible(env, accountPhone);

  const monthKey = promoMonthKey();
  const estCost = Number(recipientRegion.estCostCents || 0);
  await db.query('BEGIN');
  try {
    await ensurePromoMonth(db, monthKey);
    const month = (await db.query(
      'SELECT * FROM public.o2ol_credit_promo_months WHERE month_key=$1 FOR UPDATE',
      [monthKey],
    )).rows[0];
    if (
      Number(month.redemptions || 0) >= CREDIT_CONFIG.promo.monthlySlots ||
      Number(month.pot_balance_cents || 0) < estCost
    ) {
      await db.query('COMMIT');
      return null;
    }
    let redemption;
    try {
      redemption = (await db.query(
        `INSERT INTO public.o2ol_credit_promo_redemptions(user_id,phone_number,month_key,region,estimated_cost_cents)
         VALUES($1::uuid,$2,$3,$4,$5) RETURNING *`,
        [userId, accountPhone, monthKey, recipientRegion.region, estCost],
      )).rows[0];
    } catch (error) {
      if (error?.code === '23505') { // raced duplicate: already redeemed
        await db.query('ROLLBACK');
        return null;
      }
      throw error;
    }
    await db.query(
      `UPDATE public.o2ol_credit_promo_months
          SET pot_balance_cents=pot_balance_cents-$1,redemptions=redemptions+1,updated_at=now()
        WHERE month_key=$2`,
      [estCost, monthKey],
    );
    const grant = (await db.query(
      `INSERT INTO public.o2ol_credit_free_note_grants(user_id,kind,phone_number,region,request_key)
       VALUES($1::uuid,'promo',$2,$3,$4) RETURNING *`,
      [userId, accountPhone, recipientRegion.region, requestKey],
    )).rows[0];
    await db.query('COMMIT');
    return { redemptionId: redemption.id, grantId: grant.id, estimatedCostCents: estCost, monthKey };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  }
}

export async function rollbackFirstFreeSend(db, redemptionId) {
  if (!redemptionId) return;
  await db.query('BEGIN');
  try {
    const redemption = (await db.query(
      'SELECT * FROM public.o2ol_credit_promo_redemptions WHERE id=$1::uuid FOR UPDATE',
      [redemptionId],
    )).rows[0];
    if (redemption) {
      await db.query(
        `UPDATE public.o2ol_credit_promo_months
            SET pot_balance_cents=pot_balance_cents+$1,
                redemptions=GREATEST(0,redemptions-1),updated_at=now()
          WHERE month_key=$2`,
        [redemption.estimated_cost_cents, redemption.month_key],
      );
      await db.query('DELETE FROM public.o2ol_credit_free_note_grants WHERE user_id=$1::uuid AND kind=\'promo\' AND created_at>=$2', [redemption.user_id, redemption.created_at]);
      await db.query('DELETE FROM public.o2ol_credit_promo_redemptions WHERE id=$1::uuid', [redemptionId]);
    }
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Weekly free note — running (time-weighted) average balance + burn test.
// Eligibility is derived ONLY from the server-side ledger and reservation
// records; nothing the client sends can influence it.
// ---------------------------------------------------------------------------
async function timeWeightedAverageBalanceCents(db, userId, windowDays) {
  const windowStart = new Date(Date.now() - windowDays * 86400000);
  const prior = (await db.query(
    `SELECT balance_after FROM public.o2ol_token_transactions
      WHERE user_id=$1::uuid AND created_at<$2 ORDER BY created_at DESC LIMIT 1`,
    [userId, windowStart.toISOString()],
  )).rows[0];
  const wallet = (await db.query(
    'SELECT balance,created_at FROM public.o2ol_token_wallets WHERE user_id=$1::uuid',
    [userId],
  )).rows[0];
  let balance = prior ? Number(prior.balance_after || 0) : 0;
  // If the wallet itself was created inside the window with no earlier
  // transaction, the balance before creation was zero — handled by starting
  // at 0/prior at windowStart and integrating changes.
  const events = (await db.query(
    `SELECT created_at,balance_after FROM public.o2ol_token_transactions
      WHERE user_id=$1::uuid AND created_at>=$2 ORDER BY created_at ASC`,
    [userId, windowStart.toISOString()],
  )).rows;
  const now = Date.now();
  let cursor = windowStart.getTime();
  let integral = 0;
  for (const event of events) {
    const at = new Date(event.created_at).getTime();
    if (at > cursor) integral += balance * (at - cursor);
    balance = Number(event.balance_after || 0);
    cursor = at;
  }
  integral += balance * (now - cursor);
  const span = now - windowStart.getTime();
  return span > 0 ? integral / span : Number(wallet?.balance || 0);
}

async function paidBurnLastWindowCents(db, userId, windowDays) {
  // Burn = Credit actually consumed by metered features. A reservation that
  // was released (failed send etc.) never reaches 'consumed', so refunds and
  // releases never count as burn; deposits/replenishments are ledger credits,
  // not reservations, so they never count either.
  const row = (await db.query(
    `SELECT COALESCE(sum(tokens),0)::bigint AS burn
       FROM public.o2ol_token_reservations
      WHERE user_id=$1::uuid AND status='consumed'
        AND consumed_at >= now() - ($2 || ' days')::interval`,
    [userId, String(windowDays)],
  )).rows[0];
  return Number(row?.burn || 0);
}

async function weeklyGrantsUsed(db, userId, windowDays) {
  const row = (await db.query(
    `SELECT count(*)::int AS used FROM public.o2ol_credit_free_note_grants
      WHERE user_id=$1::uuid AND kind='weekly'
        AND created_at >= now() - ($2 || ' days')::interval`,
    [userId, String(windowDays)],
  )).rows[0];
  return Number(row?.used || 0);
}

export async function computeWeeklyStatus(db, userId, accountPhone) {
  await ensureCreditSchema(db);
  const cfg = CREDIT_CONFIG.weekly;
  const tierBase = accountTierBaseCents(accountPhone);
  const [avgBalance, burn, used] = await Promise.all([
    timeWeightedAverageBalanceCents(db, userId, cfg.windowDays),
    paidBurnLastWindowCents(db, userId, cfg.windowDays),
    weeklyGrantsUsed(db, userId, cfg.windowDays),
  ]);
  const tier = Math.max(0, Math.min(cfg.maxFreePerWeek, Math.floor(avgBalance / tierBase.ladderUnitCents)));
  const burnMet = burn >= cfg.burnThresholdCents;
  const eligible = tier >= 1 && burnMet;
  const freePerWeek = eligible ? tier : 0;
  return {
    eligible,
    freePerWeek,
    usedThisWeek: used,
    remaining: Math.max(0, freePerWeek - used),
    averageBalanceCents: Math.round(avgBalance),
    burnCents: burn,
    burnThresholdCents: cfg.burnThresholdCents,
    baseBalanceCents: tierBase.baseBalanceCents,
    ladderUnitCents: tierBase.ladderUnitCents,
    accountRegion: tierBase.region,
    windowDays: cfg.windowDays,
  };
}

// Atomically claims one weekly free note (advisory lock per user makes the
// recount race-safe). Returns the grant row or null when none remain.
// Caller must call releaseWeeklyFreeNoteClaim if delivery then fails.
export async function claimWeeklyFreeNote(db, userId, accountPhone, recipientPhone, region, requestKey = null) {
  await db.query('BEGIN');
  try {
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`weekly-free:${userId}`]);
    const status = await computeWeeklyStatus(db, userId, accountPhone);
    if (!status.eligible || status.remaining <= 0) {
      await db.query('COMMIT');
      return null;
    }
    const grant = (await db.query(
      `INSERT INTO public.o2ol_credit_free_note_grants(user_id,kind,phone_number,region,request_key)
       VALUES($1::uuid,'weekly',$2,$3,$4) RETURNING *`,
      [userId, recipientPhone, region || null, requestKey],
    )).rows[0];
    await db.query('COMMIT');
    return { grant, status };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  }
}

export async function releaseWeeklyFreeNoteClaim(db, grantId) {
  if (!grantId) return;
  await db.query('DELETE FROM public.o2ol_credit_free_note_grants WHERE id=$1::uuid AND kind=\'weekly\'', [grantId]);
}

export async function attachSentNoteToGrant(db, grantId, sentLoveNoteId) {
  if (!grantId || !sentLoveNoteId) return;
  await db.query(
    'UPDATE public.o2ol_credit_free_note_grants SET sent_love_note_id=$2::uuid WHERE id=$1::uuid',
    [grantId, sentLoveNoteId],
  );
}
