// @ts-nocheck
//
// Founding Member Giveaway (owner directives, 2026-10-10):
//   - 1st 100 qualifying signups: $10.00 GAME Credit + 2 FREE Love Note
//     sends, plus future perks for Founding Members.
//   - 2nd 100 qualifying signups: $5.00 GAME Credit + 1 FREE Love Note send.
//   - Qualifying = account holds username + email + password credential;
//     cohort position is creation order among qualifying accounts.
//   - CLAIM requires ALL of: credential account, email on the profile,
//     PHONE VERIFIED (either-source: profile row or Neon Auth record),
//     and >= $5.00 in the regular Credit wallet.
//   - Claimed FIRST-100 members also receive +$10.00 Game Credit monthly
//     for 6 months from claim (lazy-granted, idempotent per month;
//     stops permanently if the account is cancelled/closed/deleted).
//   - NO EXPIRY on any founding grant (owner's settled decision —
//     FOUNDING_PERK_EXPIRY_DAYS in worker/founding-giveaway-rules.js).
//
// Pure rules/config live in ./founding-giveaway-rules.js. Game Credit
// grants land in the existing ledger (public.o2ol_game_credit_ledger):
// the one-time grant uses kind 'promo_grant' with idempotency key
// `founding_giveaway:{userId}` (the adminGrantGameCredit helper requires
// an expiry, so the ledger row is inserted directly, following the
// grantSignupGameCreditInTx pattern); monthly grants use their own kind
// 'founding_monthly' so admin can see them as their own entry type.

import { Client } from 'pg';
import { ensureGameEconomySchema } from './game-economy';
import {
  FOUNDING_GIVEAWAY_TIERS,
  FOUNDING_MIN_CREDIT_BALANCE_CENTS,
  FOUNDING_MONTHLY_GAME_CREDIT_CENTS,
  FOUNDING_MONTHLY_GRANTS_TOTAL,
  tierForCohortNumber,
  tierByKey,
  heroStateForEligibleCount,
  foundingPerkExpiresAt,
  foundingPerkLapsed,
  claimRequirementsState,
  monthlyDueCount,
  addMonthsUtc,
  foundingMonthlyGrantKey,
  tierReceivesMonthlyPerk,
} from './founding-giveaway-rules.js';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request', extra = {}) {
  return json({ ok: false, error: { code, message, ...extra } }, status);
}
function httpError(message, status, code, extra = {}) {
  return Object.assign(new Error(message), { status, code, ...extra });
}
async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}
// Verified-member session, mirroring worker/love-note-entitlements.ts.
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

// ---------------------------------------------------------------------------
// Schema (lazy, idempotent — the codebase's ensure-schema convention; the
// same DDL is recorded in neon-migrations/2026-10-10-founding-giveaway.sql).
// ---------------------------------------------------------------------------
const TOLERATED_DDL_CODES = new Set(['42501', '42701', '42P07', '42710']);
async function ddl(db, sql) {
  try { await db.query(sql); }
  catch (e) { if (!TOLERATED_DDL_CODES.has(e?.code)) throw e; }
}

export async function ensureFoundingSchema(db) {
  await ddl(db, `CREATE TABLE IF NOT EXISTS public.o2ol_founding_perks(
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    cohort_number integer NOT NULL UNIQUE CHECK(cohort_number BETWEEN 1 AND 200),
    tier text NOT NULL CHECK(tier IN ('first100','second100')),
    status text NOT NULL DEFAULT 'unclaimed' CHECK(status IN ('unclaimed','claimed')),
    game_credit_cents integer NOT NULL,
    free_sends_total integer NOT NULL DEFAULT 0,
    free_sends_used integer NOT NULL DEFAULT 0,
    free_sends_expire_at timestamptz,
    game_credit_ledger_id uuid,
    claimed_at timestamptz,
    monthly_stopped_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await ddl(db, `ALTER TABLE public.o2ol_founding_perks ADD COLUMN IF NOT EXISTS monthly_stopped_at timestamptz`);
  await ddl(db, `CREATE TABLE IF NOT EXISTS public.o2ol_founding_free_send_uses(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_key text NOT NULL UNIQUE,
    sent_love_note_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    restored_at timestamptz
  )`);
  await ddl(db, `CREATE INDEX IF NOT EXISTS idx_o2ol_founding_uses_user ON public.o2ol_founding_free_send_uses(user_id,created_at DESC)`);
  // The game-credit ledger CHECK predates the monthly perk: extend it (in
  // place, whatever its generated name is) so kind 'founding_monthly' is
  // accepted as its own entry type. Fresh installs already carry the new
  // kind via worker/game-economy.ts ensureGameEconomySchema.
  await ddl(db, `DO $$
    DECLARE c record;
    BEGIN
      FOR c IN
        SELECT con.conname FROM pg_constraint con
          JOIN pg_class rel ON rel.oid=con.conrelid
          JOIN pg_namespace nsp ON nsp.oid=rel.relnamespace
         WHERE nsp.nspname='public' AND rel.relname='o2ol_game_credit_ledger' AND con.contype='c'
           AND pg_get_constraintdef(con.oid) LIKE '%signup_bonus%'
           AND pg_get_constraintdef(con.oid) NOT LIKE '%founding_monthly%'
      LOOP
        EXECUTE 'ALTER TABLE public.o2ol_game_credit_ledger DROP CONSTRAINT ' || quote_ident(c.conname);
      END LOOP;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
          JOIN pg_class rel ON rel.oid=con.conrelid
          JOIN pg_namespace nsp ON nsp.oid=rel.relnamespace
         WHERE nsp.nspname='public' AND rel.relname='o2ol_game_credit_ledger' AND con.contype='c'
           AND pg_get_constraintdef(con.oid) LIKE '%founding_monthly%'
      ) THEN
        ALTER TABLE public.o2ol_game_credit_ledger
          ADD CONSTRAINT o2ol_game_credit_ledger_kind_check
          CHECK(kind IN ('signup_bonus','admin_grant','promo_grant','founding_monthly','spend','expire'));
      END IF;
    END $$`);
}

// ---------------------------------------------------------------------------
// Qualification + cohort position. A qualifying account is a Neon Auth
// email/password credential account whose profile row carries a non-empty
// username AND email. Position = 1 + (number of qualifying accounts
// created earlier), tie-broken by account id for determinism.
// ---------------------------------------------------------------------------
const QUALIFYING_WHERE = `NULLIF(trim(u.username),'') IS NOT NULL AND NULLIF(trim(u.email),'') IS NOT NULL`;

async function accountFacts(db, userId) {
  const row = (await db.query(
    `SELECT u.username, u.email,
            COALESCE((to_jsonb(u)->>'phone_number_verified')::boolean,false) AS profile_phone_verified,
            COALESCE((to_jsonb(a)->>'phoneNumberVerified')::boolean,false) AS auth_phone_verified,
            COALESCE(u.is_active,true) AS is_active,
            COALESCE(a.banned,false) AS banned,
            a."createdAt" AS auth_created_at
       FROM neon_auth."user" a
       LEFT JOIN public.users u ON u.id=a.id
      WHERE a.id=$1::uuid LIMIT 1`,
    [userId],
  )).rows[0] || null;
  if (!row) return null;
  const wallet = (await db.query(
    'SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid LIMIT 1',
    [userId],
  )).rows[0];
  return {
    username: row.username || null,
    email: row.email || null,
    // Either-source phone verification (the PR #49 rule): the profile row
    // OR the Neon Auth record saying verified counts, incl. the profile
    // row's phone_number_verified flag read defensively via to_jsonb.
    phoneVerified: row.profile_phone_verified === true || row.auth_phone_verified === true,
    creditBalanceCents: Number(wallet?.balance || 0),
    isActive: row.is_active !== false,
    banned: row.banned === true,
    authCreatedAt: row.auth_created_at || null,
  };
}

function requirementsFor(facts) {
  return claimRequirementsState({
    credentialAccount: Boolean(facts && facts.username),
    hasEmail: Boolean(facts && facts.email),
    phoneVerified: Boolean(facts?.phoneVerified),
    creditBalanceCents: facts?.creditBalanceCents || 0,
  });
}

// Resolves (and on first sight materializes) the member's perk row.
// Callers that mutate run it under the advisory lock in claimFoundingPerk.
async function resolveFoundingPerk(db, userId) {
  const existing = (await db.query(
    'SELECT * FROM public.o2ol_founding_perks WHERE user_id=$1::uuid LIMIT 1',
    [userId],
  )).rows[0];
  if (existing) return { eligible: true, perk: existing };

  const facts = await accountFacts(db, userId);
  if (!facts || !facts.username || !facts.email || !facts.authCreatedAt) {
    return { eligible: false, perk: null };
  }
  const ahead = (await db.query(
    `SELECT count(*)::int AS ahead
       FROM public.users u
       JOIN neon_auth."user" a ON a.id=u.id
      WHERE ${QUALIFYING_WHERE}
        AND (a."createdAt" < $2 OR (a."createdAt" = $2 AND u.id < $1::uuid))`,
    [userId, facts.authCreatedAt],
  )).rows[0];
  const position = Number(ahead?.ahead || 0) + 1;
  const tier = tierForCohortNumber(position);
  if (!tier) return { eligible: false, perk: null, position };
  const inserted = (await db.query(
    `INSERT INTO public.o2ol_founding_perks(user_id,cohort_number,tier,game_credit_cents,free_sends_total)
     VALUES($1::uuid,$2,$3,$4,$5)
     ON CONFLICT(user_id) DO NOTHING RETURNING *`,
    [userId, position, tier.key, tier.gameCreditCents, tier.freeLoveNoteSends],
  )).rows[0];
  if (inserted) return { eligible: true, perk: inserted };
  const raced = (await db.query(
    'SELECT * FROM public.o2ol_founding_perks WHERE user_id=$1::uuid LIMIT 1',
    [userId],
  )).rows[0];
  return raced ? { eligible: true, perk: raced } : { eligible: false, perk: null, position };
}

async function gameCreditBalanceCents(db, userId) {
  const row = (await db.query(
    `SELECT COALESCE(sum(remaining_cents),0)::int AS cents
       FROM public.o2ol_game_credit_ledger
      WHERE user_id=$1::uuid AND kind IN ('signup_bonus','admin_grant','promo_grant','founding_monthly')
        AND COALESCE(remaining_cents,0)>0 AND (expires_at IS NULL OR expires_at>now())`,
    [userId],
  )).rows[0];
  return Number(row?.cents || 0);
}

async function monthlyGrantsMade(db, userId) {
  const row = (await db.query(
    `SELECT count(*)::int AS n FROM public.o2ol_game_credit_ledger
      WHERE user_id=$1::uuid AND kind='founding_monthly'`,
    [userId],
  )).rows[0];
  return Number(row?.n || 0);
}

function statusPayload(perk, facts) {
  const tier = tierByKey(perk.tier);
  const claimed = perk.status === 'claimed';
  const sendsTotal = Number(perk.free_sends_total || 0);
  const sendsUsed = Number(perk.free_sends_used || 0);
  const sendsLapsed = claimed && foundingPerkLapsed(perk.free_sends_expire_at);
  const monthly = tierReceivesMonthlyPerk(tier)
    ? {
        receives: true,
        gameCreditCents: FOUNDING_MONTHLY_GAME_CREDIT_CENTS,
        grantsTotal: FOUNDING_MONTHLY_GRANTS_TOTAL,
        grantsMade: 0, // filled by callers that can query the ledger
        nextDueAt: null,
      }
    : { receives: false, gameCreditCents: 0, grantsTotal: 0, grantsMade: 0, nextDueAt: null };
  return {
    eligible: true,
    tier: perk.tier,
    cohortNumber: Number(perk.cohort_number),
    status: perk.status,
    claimed,
    claimedAt: perk.claimed_at || null,
    gameCreditCents: Number(perk.game_credit_cents || 0),
    freeLoveNoteSends: sendsTotal,
    freeSendsUsed: sendsUsed,
    freeSendsRemaining: claimed && !sendsLapsed ? Math.max(0, sendsTotal - sendsUsed) : 0,
    freeSendsExpireAt: perk.free_sends_expire_at || null,
    futurePerks: Boolean(tier?.futurePerks),
    monthly,
    requirements: requirementsFor(facts),
  };
}

async function fillMonthly(db, payload, perk) {
  if (!payload.monthly.receives) return payload;
  payload.monthly.grantsMade = await monthlyGrantsMade(db, perk.user_id);
  if (payload.claimed && payload.monthly.grantsMade < FOUNDING_MONTHLY_GRANTS_TOTAL && !perk.monthly_stopped_at) {
    payload.monthly.nextDueAt = addMonthsUtc(new Date(perk.claimed_at), payload.monthly.grantsMade + 1).toISOString();
  }
  payload.monthly.stopped = Boolean(perk.monthly_stopped_at);
  return payload;
}

// ---------------------------------------------------------------------------
// Monthly perk — lazy grants. No worker cron pattern exists in this
// codebase, so due grants land on the member's next authenticated
// founding activity (status read / Love Note usage read), idempotent per
// month index via the ledger idempotency key. Cancellation (profile
// deactivated or auth account banned; deletion cascades the perk row
// away entirely) stops future grants permanently — past grants stay.
// ---------------------------------------------------------------------------
export async function grantDueFoundingMonthlyCredits(db, userId) {
  await ensureFoundingSchema(db);
  await ensureGameEconomySchema(db);
  const perk = (await db.query(
    `SELECT * FROM public.o2ol_founding_perks WHERE user_id=$1::uuid AND status='claimed' LIMIT 1`,
    [userId],
  )).rows[0];
  if (!perk) return 0;
  const tier = tierByKey(perk.tier);
  if (!tierReceivesMonthlyPerk(tier)) return 0;
  if (perk.monthly_stopped_at) return 0;
  const facts = await accountFacts(db, userId);
  if (!facts || !facts.isActive || facts.banned) {
    await db.query(
      `UPDATE public.o2ol_founding_perks SET monthly_stopped_at=now(),updated_at=now()
        WHERE user_id=$1::uuid AND monthly_stopped_at IS NULL`,
      [userId],
    );
    return 0;
  }
  const due = monthlyDueCount(perk.claimed_at, new Date());
  const made = await monthlyGrantsMade(db, userId);
  let granted = 0;
  for (let index = made + 1; index <= due; index++) {
    const row = (await db.query(
      `INSERT INTO public.o2ol_game_credit_ledger
        (user_id,kind,amount_cents,remaining_cents,idempotency_key,expires_at,actor,note)
       VALUES($1::uuid,'founding_monthly',$2,$2,$3,$4,'system',$5)
       ON CONFLICT(idempotency_key) DO NOTHING RETURNING id`,
      [
        userId,
        FOUNDING_MONTHLY_GAME_CREDIT_CENTS,
        foundingMonthlyGrantKey(userId, index),
        foundingPerkExpiresAt(),
        `Founding Member monthly Game Credit ${index} of ${FOUNDING_MONTHLY_GRANTS_TOTAL}`,
      ],
    )).rows[0];
    if (row) granted += 1;
  }
  return granted;
}

// ---------------------------------------------------------------------------
// Status + claim.
// ---------------------------------------------------------------------------
export async function foundingStatusFor(db, userId) {
  await ensureFoundingSchema(db);
  await grantDueFoundingMonthlyCredits(db, userId).catch(() => 0);
  const facts = await accountFacts(db, userId);
  const resolved = await resolveFoundingPerk(db, userId);
  if (!resolved.eligible) return { eligible: false };
  const payload = statusPayload(resolved.perk, facts);
  payload.gameCreditBalanceCents = await gameCreditBalanceCents(db, userId);
  return fillMonthly(db, payload, resolved.perk);
}

export async function claimFoundingPerk(db, userId) {
  await ensureFoundingSchema(db);
  await ensureGameEconomySchema(db);
  await db.query('BEGIN');
  try {
    await db.query("SELECT pg_advisory_xact_lock(hashtext('one2onelove_founding_giveaway'))");
    const resolved = await resolveFoundingPerk(db, userId);
    if (!resolved.eligible) {
      await db.query('ROLLBACK');
      throw httpError('This account is not in a Founding Member giveaway cohort.', 404, 'founding_not_eligible');
    }
    const perk = resolved.perk;
    if (perk.status === 'claimed') {
      await db.query('COMMIT');
      const facts = await accountFacts(db, userId);
      const payload = statusPayload(perk, facts);
      payload.gameCreditBalanceCents = await gameCreditBalanceCents(db, userId);
      return fillMonthly(db, payload, perk);
    }
    const facts = await accountFacts(db, userId);
    const requirements = requirementsFor(facts);
    if (!requirements.allMet) {
      await db.query('ROLLBACK');
      throw httpError(
        'All Founding Member claim requirements must be met first.',
        422,
        'founding_requirements_unmet',
        { requirements },
      );
    }
    // One-time Game Credit grant — the existing ledger, no expiry (owner's
    // settled decision), idempotent on the per-account key.
    let grant = (await db.query(
      `INSERT INTO public.o2ol_game_credit_ledger
        (user_id,kind,amount_cents,remaining_cents,idempotency_key,expires_at,actor,note)
       VALUES($1::uuid,'promo_grant',$2,$2,$3,$4,'system',$5)
       ON CONFLICT(idempotency_key) DO NOTHING RETURNING id`,
      [
        userId,
        Number(perk.game_credit_cents),
        `founding_giveaway:${userId}`,
        foundingPerkExpiresAt(),
        perk.tier === 'first100'
          ? 'Founding Member giveaway — first 100 one-time Game Credit'
          : 'Founding Member giveaway — second 100 one-time Game Credit',
      ],
    )).rows[0];
    if (!grant) {
      grant = (await db.query(
        'SELECT id FROM public.o2ol_game_credit_ledger WHERE idempotency_key=$1 LIMIT 1',
        [`founding_giveaway:${userId}`],
      )).rows[0];
    }
    const expiresAt = foundingPerkExpiresAt();
    const updated = (await db.query(
      `UPDATE public.o2ol_founding_perks
          SET status='claimed',claimed_at=now(),game_credit_ledger_id=$2,
              free_sends_expire_at=$3,updated_at=now()
        WHERE user_id=$1::uuid RETURNING *`,
      [userId, grant?.id || null, expiresAt],
    )).rows[0];
    await db.query('COMMIT');
    const payload = statusPayload(updated, facts);
    payload.gameCreditBalanceCents = await gameCreditBalanceCents(db, userId);
    return fillMonthly(db, payload, updated);
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Free Love Note sends — consumption ahead of any Credit charge in the
// production send paths (worker/love-note-entitlements.ts). Consumption
// is recorded per request key (idempotent; a replayed key reports
// `reused` so the caller can answer 409 like the reservation flow), and
// restores mirror releaseTokenReservation on failure/cancel paths.
// ---------------------------------------------------------------------------
export async function tryConsumeFoundingFreeSend(db, userId, requestKey) {
  await ensureFoundingSchema(db);
  const key = String(requestKey || '').trim();
  if (!key) return null;
  await db.query('BEGIN');
  try {
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`founding-free-send:${userId}`]);
    const existing = (await db.query(
      'SELECT * FROM public.o2ol_founding_free_send_uses WHERE request_key=$1 LIMIT 1',
      [key],
    )).rows[0];
    if (existing) {
      await db.query('COMMIT');
      return existing.restored_at ? null : { reused: true, use: existing };
    }
    const perk = (await db.query(
      `SELECT * FROM public.o2ol_founding_perks WHERE user_id=$1::uuid AND status='claimed' FOR UPDATE`,
      [userId],
    )).rows[0];
    if (
      !perk ||
      Number(perk.free_sends_used || 0) >= Number(perk.free_sends_total || 0) ||
      foundingPerkLapsed(perk.free_sends_expire_at)
    ) {
      await db.query('COMMIT');
      return null;
    }
    const use = (await db.query(
      `INSERT INTO public.o2ol_founding_free_send_uses(user_id,request_key)
       VALUES($1::uuid,$2) RETURNING *`,
      [userId, key],
    )).rows[0];
    await db.query(
      'UPDATE public.o2ol_founding_perks SET free_sends_used=free_sends_used+1,updated_at=now() WHERE user_id=$1::uuid',
      [userId],
    );
    await db.query('COMMIT');
    return { use, remaining: Math.max(0, Number(perk.free_sends_total) - Number(perk.free_sends_used) - 1) };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    if (error?.code === '23505') return { reused: true, use: null };
    throw error;
  }
}

export async function restoreFoundingFreeSend(db, useId) {
  if (!useId) return;
  await ensureFoundingSchema(db);
  await db.query('BEGIN');
  try {
    const use = (await db.query(
      'SELECT * FROM public.o2ol_founding_free_send_uses WHERE id=$1::uuid FOR UPDATE',
      [useId],
    )).rows[0];
    if (use && !use.restored_at) {
      await db.query(
        'UPDATE public.o2ol_founding_free_send_uses SET restored_at=now() WHERE id=$1::uuid',
        [useId],
      );
      await db.query(
        'UPDATE public.o2ol_founding_perks SET free_sends_used=GREATEST(0,free_sends_used-1),updated_at=now() WHERE user_id=$1::uuid',
        [use.user_id],
      );
    }
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  }
}

// Restore hook for reservation-driven paths (scheduled dispatcher, cancel):
// the zero-token reservation created for a founding booking carries the
// use id in its metadata.
export async function restoreFoundingFreeSendForReservation(db, reservation) {
  let metadata = reservation?.metadata || null;
  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata); } catch (_) { metadata = null; }
  }
  const useId = metadata?.founding_use_id || null;
  if (useId) await restoreFoundingFreeSend(db, useId);
}

export async function attachFoundingFreeSendNote(db, useId, sentLoveNoteId) {
  if (!useId || !sentLoveNoteId) return;
  await db.query(
    'UPDATE public.o2ol_founding_free_send_uses SET sent_love_note_id=$2::uuid WHERE id=$1::uuid',
    [useId, sentLoveNoteId],
  );
}

// A founding booking still needs a reservation row: the scheduled
// dispatcher resolves (and consumes/releases) reservations by key. This
// zero-token reservation carries the booking without charging Credit.
export async function createFoundingFreeReservation(db, userId, featureCode, { idempotencyKey, metadata = {}, useId } = {}) {
  const reservation = (await db.query(
    `INSERT INTO public.o2ol_token_reservations
      (user_id,feature_code,tokens,idempotency_key,transaction_id,metadata)
     VALUES($1::uuid,$2,0,$3,NULL,$4::jsonb)
     RETURNING *`,
    [
      userId,
      featureCode,
      String(idempotencyKey || ''),
      JSON.stringify({ ...(metadata || {}), founding_free_send: true, founding_use_id: useId || null }),
    ],
  )).rows[0];
  const wallet = (await db.query(
    'SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid LIMIT 1',
    [userId],
  )).rows[0];
  return { ...reservation, tokens: 0, balance_after: Number(wallet?.balance || 0), free: true };
}

export async function foundingFreeSendsRemaining(db, userId) {
  await ensureFoundingSchema(db);
  await grantDueFoundingMonthlyCredits(db, userId).catch(() => 0);
  const perk = (await db.query(
    `SELECT free_sends_total,free_sends_used,free_sends_expire_at
       FROM public.o2ol_founding_perks WHERE user_id=$1::uuid AND status='claimed' LIMIT 1`,
    [userId],
  )).rows[0];
  if (!perk || foundingPerkLapsed(perk.free_sends_expire_at)) return 0;
  return Math.max(0, Number(perk.free_sends_total || 0) - Number(perk.free_sends_used || 0));
}

// ---------------------------------------------------------------------------
// Public hero state + admin summary.
// ---------------------------------------------------------------------------
export async function foundingHeroState(db) {
  await ensureFoundingSchema(db);
  const row = (await db.query(
    `SELECT count(*)::int AS n FROM public.users u
       JOIN neon_auth."user" a ON a.id=u.id
      WHERE ${QUALIFYING_WHERE}`,
  )).rows[0];
  const state = heroStateForEligibleCount(Number(row?.n || 0));
  if (!state.open) return { open: false };
  return {
    open: true,
    tier: state.tier.key,
    gameCreditCents: state.tier.gameCreditCents,
    freeLoveNoteSends: state.tier.freeLoveNoteSends,
    futurePerks: state.tier.futurePerks,
    monthlyPerk: tierReceivesMonthlyPerk(state.tier),
    monthlyGameCreditCents: FOUNDING_MONTHLY_GAME_CREDIT_CENTS,
    monthlyGrantsTotal: FOUNDING_MONTHLY_GRANTS_TOTAL,
    minCreditCents: FOUNDING_MIN_CREDIT_BALANCE_CENTS,
    spotsLeft: state.spotsLeft,
  };
}

export async function foundingGiveawayAdminSummary(db) {
  await ensureFoundingSchema(db);
  const counts = (await db.query(
    `WITH eligible AS (
       SELECT u.id,
              ROW_NUMBER() OVER (ORDER BY a."createdAt" ASC, u.id ASC) AS rn
         FROM public.users u
         JOIN neon_auth."user" a ON a.id=u.id
        WHERE ${QUALIFYING_WHERE}
     )
     SELECT count(*) FILTER (WHERE rn BETWEEN 1 AND 100)::int AS tier1,
            count(*) FILTER (WHERE rn BETWEEN 101 AND 200)::int AS tier2
       FROM eligible`,
  )).rows[0] || {};
  const claimants = (await db.query(
    `SELECT p.tier,p.cohort_number,p.status,p.claimed_at,p.free_sends_total,p.free_sends_used,
            u.username,u.email
       FROM public.o2ol_founding_perks p
       JOIN public.users u ON u.id=p.user_id
      ORDER BY p.cohort_number ASC`,
  )).rows;
  const monthly = (await db.query(
    `SELECT count(*)::int AS grants, COALESCE(sum(amount_cents),0)::int AS cents
       FROM public.o2ol_game_credit_ledger WHERE kind='founding_monthly'`,
  )).rows[0] || {};
  const tiers = FOUNDING_GIVEAWAY_TIERS.map(tier => {
    const rows = claimants.filter(row => row.tier === tier.key);
    return {
      tier: tier.key,
      cohortSize: tier.end - tier.start + 1,
      qualifying: tier.key === 'first100' ? Number(counts.tier1 || 0) : Number(counts.tier2 || 0),
      claimed: rows.filter(row => row.status === 'claimed').length,
      claimants: rows.map(row => ({
        cohortNumber: Number(row.cohort_number),
        username: row.username || null,
        email: row.email || null,
        status: row.status,
        claimedAt: row.claimed_at || null,
        freeSendsUsed: Number(row.free_sends_used || 0),
        freeSendsTotal: Number(row.free_sends_total || 0),
      })),
    };
  });
  return {
    tiers,
    monthlyGrants: { count: Number(monthly.grants || 0), cents: Number(monthly.cents || 0) },
  };
}

// ---------------------------------------------------------------------------
// HTTP handler: GET /api/founding-perks/hero (public),
// GET /api/founding-perks/status + POST /api/founding-perks/claim
// (verified member session).
// ---------------------------------------------------------------------------
export async function handleFoundingPerksRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/founding-perks')) return null;
  try {
    if (url.pathname === '/api/founding-perks/hero' && request.method === 'GET') {
      const hero = await withDb(env, db => foundingHeroState(db));
      return json({ ok: true, hero });
    }
    if (url.pathname === '/api/founding-perks/status' || url.pathname === '/api/founding-perks/claim') {
      const auth = await session(request, env);
      if (!auth) return fail('Authentication required.', 401, 'unauthorized');
      if (url.pathname === '/api/founding-perks/status' && request.method === 'GET') {
        const status = await withDb(env, db => foundingStatusFor(db, auth.user.id));
        return json({ ok: true, founding: status });
      }
      if (url.pathname === '/api/founding-perks/claim' && request.method === 'POST') {
        const status = await withDb(env, db => claimFoundingPerk(db, auth.user.id));
        return json({ ok: true, founding: status });
      }
      return fail('Method not allowed.', 405, 'method_not_allowed');
    }
    return null;
  } catch (error) {
    console.error('Founding perks error:', error?.message || error);
    return fail(
      error?.message || 'Founding Member perks are unavailable right now.',
      error?.status || 500,
      error?.code || 'founding_perks_error',
      { requirements: error?.requirements || undefined },
    );
  }
}
