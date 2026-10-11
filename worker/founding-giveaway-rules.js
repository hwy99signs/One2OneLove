// Founding Member Giveaway — pure rules + config (no I/O).
//
// Owner directive (2026-10-10 ~22:23 CT): "I am going to GIVE AWAY $10 GAME
// credit and 2 FREE SEND LOVE NOTES to the 1st 100 signups with username,
// email and PW." Owner extension (2026-10-10 ~22:26 CT): "Second 100 gets
// $5 GAME CREDITS AND 1 FREE LOVE NOTE SEND."
//
// Qualification: an account that holds a username + email + password
// credential (a Neon Auth email/password account with a non-empty
// public.users.username and public.users.email). Cohort position is the
// account's rank in creation order among qualifying accounts.
//
// This module is deliberately separate from worker/founding-rules.js: that
// file carries the RETIRED subscription-era founding offer (Exclusive /
// Premiere free-30-days). The giveaway is a Credit-era perk and never
// touches plan state.

export const FOUNDING_GIVEAWAY_COHORT_SIZE = 100;

// One row per tier. Amounts are USD cents for Game Credit (games-only
// currency in public.o2ol_game_credit_ledger) and a plain count of free
// Love Note sends. "Future perks" wording belongs to the FIRST 100 only
// (owner directive); tier 2 copy states only its grant.
export const FOUNDING_GIVEAWAY_TIERS = Object.freeze([
  Object.freeze({
    key: 'first100',
    ordinal: 1,
    start: 1,
    end: 100,
    gameCreditCents: 1000,
    freeLoveNoteSends: 2,
    futurePerks: true,
  }),
  Object.freeze({
    key: 'second100',
    ordinal: 2,
    start: 101,
    end: 200,
    gameCreditCents: 500,
    freeLoveNoteSends: 1,
    futurePerks: false,
  }),
]);

export const FOUNDING_GIVEAWAY_LAST_POSITION =
  FOUNDING_GIVEAWAY_TIERS[FOUNDING_GIVEAWAY_TIERS.length - 1].end;

// ---------------------------------------------------------------------------
// FOUNDING_PERK_EXPIRY_DAYS — THE expiry switch for BOTH giveaway grants
// (the Game Credit grant and the free Love Note sends, both tiers).
//
// OWNER DECISION (2026-10-10 ~22:24 CT, settled — not a placeholder
// default): NO EXPIRY. "It's a founding perk." The value null means the
// grants never expire. If the owner ever reverses this, set a positive
// number of days here and every grant/consume path in
// worker/founding-perks.ts follows it from this one constant.
// ---------------------------------------------------------------------------
export const FOUNDING_PERK_EXPIRY_DAYS = null;

// Returns the tier a 1-based cohort position qualifies for, or null when
// the position is outside every cohort (position 201+ gets nothing).
export function tierForCohortNumber(position) {
  const n = Number(position);
  if (!Number.isInteger(n) || n < 1) return null;
  return FOUNDING_GIVEAWAY_TIERS.find(tier => n >= tier.start && n <= tier.end) || null;
}

export function tierByKey(key) {
  return FOUNDING_GIVEAWAY_TIERS.find(tier => tier.key === String(key || '')) || null;
}

// Hero-strip state for guests: which tier is currently open for a NEW
// signup, given how many qualifying accounts already exist. A new signup's
// cohort position would be eligibleCount + 1, so tier 1 is open while
// fewer than 100 qualifying accounts exist, tier 2 while fewer than 200,
// and the strip hides entirely once both cohorts are full.
export function heroStateForEligibleCount(eligibleCount) {
  const count = Math.max(0, Math.floor(Number(eligibleCount) || 0));
  for (const tier of FOUNDING_GIVEAWAY_TIERS) {
    if (count < tier.end) {
      return {
        open: true,
        tier,
        spotsLeft: tier.end - count,
        eligibleCount: count,
      };
    }
  }
  return { open: false, tier: null, spotsLeft: 0, eligibleCount: count };
}

// The expiry instant for a grant made at `from` (Date or ISO string), or
// null when grants never expire (the owner's settled decision above).
export function foundingPerkExpiresAt(from = new Date()) {
  if (FOUNDING_PERK_EXPIRY_DAYS == null) return null;
  const days = Number(FOUNDING_PERK_EXPIRY_DAYS);
  if (!Number.isFinite(days) || days <= 0) return null;
  const base = from instanceof Date ? from : new Date(from);
  if (Number.isNaN(base.getTime())) return null;
  return new Date(base.getTime() + days * 86400000).toISOString();
}

// Whether a stored expiry instant is already past at `at`. A null expiry
// never lapses (no-expiry grants stay valid forever).
export function foundingPerkLapsed(expiresAt, at = new Date()) {
  if (!expiresAt) return false;
  const atMs = at instanceof Date ? at.getTime() : new Date(at).getTime();
  return new Date(expiresAt).getTime() <= atMs;
}

// ---------------------------------------------------------------------------
// Claim requirements (owner, 2026-10-10 ~22:29 CT): a qualifying member may
// CLAIM only when ALL of these are true — username+password credential
// account, email on the profile/account, PHONE VERIFIED, and at least
// $5.00 in the regular Credit wallet (NOT Game Credit).
// ---------------------------------------------------------------------------
export const FOUNDING_MIN_CREDIT_BALANCE_CENTS = 500;

export function claimRequirementsState({ credentialAccount, hasEmail, phoneVerified, creditBalanceCents } = {}) {
  const balance = Math.max(0, Math.floor(Number(creditBalanceCents) || 0));
  const requirements = {
    credential: { met: Boolean(credentialAccount) },
    email: { met: Boolean(hasEmail) },
    phoneVerified: { met: Boolean(phoneVerified) },
    minBalance: {
      met: balance >= FOUNDING_MIN_CREDIT_BALANCE_CENTS,
      requiredCents: FOUNDING_MIN_CREDIT_BALANCE_CENTS,
      balanceCents: balance,
    },
  };
  return {
    requirements,
    allMet: Object.values(requirements).every(row => row.met),
  };
}

// ---------------------------------------------------------------------------
// Monthly perk (owner, 2026-10-10 ~22:29 CT): claimed Founding Members
// automatically receive +$10.00 GAME credits monthly for 6 months from
// their claim date (6 grants total). "Cancel and the perk goes away" —
// grants stop permanently when the account is cancelled/closed/deleted;
// grants already made are never clawed back.
//
// TIER SCOPE — OWNER DECISION (2026-10-10 ~22:30 CT, settled): FIRST 100
// ONLY. Tier 2 receives only its one-time $5 Game Credit + 1 free send.
// To extend the monthly perk later, add 'second100' to this one list.
// ---------------------------------------------------------------------------
export const FOUNDING_MONTHLY_GAME_CREDIT_CENTS = 1000;
export const FOUNDING_MONTHLY_GRANTS_TOTAL = 6;
export const FOUNDING_MONTHLY_PERK_TIER_KEYS = Object.freeze(['first100']);

export function tierReceivesMonthlyPerk(tier) {
  return Boolean(tier) && FOUNDING_MONTHLY_PERK_TIER_KEYS.includes(tier.key);
}

export function addMonthsUtc(from, months) {
  const base = from instanceof Date ? new Date(from.getTime()) : new Date(from);
  const day = base.getUTCDate();
  base.setUTCDate(1);
  base.setUTCMonth(base.getUTCMonth() + Number(months || 0));
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(day, lastDay));
  return base;
}

// How many of the 6 monthly grants are due at `at` for a claim made at
// `claimedAt` — one per full calendar month elapsed, capped at the total.
export function monthlyDueCount(claimedAt, at = new Date()) {
  if (!claimedAt) return 0;
  const start = claimedAt instanceof Date ? claimedAt : new Date(claimedAt);
  const now = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(now.getTime())) return 0;
  let due = 0;
  for (let k = 1; k <= FOUNDING_MONTHLY_GRANTS_TOTAL; k++) {
    if (addMonthsUtc(start, k).getTime() <= now.getTime()) due = k;
    else break;
  }
  return due;
}

export function foundingMonthlyGrantKey(userId, monthIndex) {
  return `founding_monthly:${userId}:${monthIndex}`;
}
