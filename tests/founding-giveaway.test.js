import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOUNDING_PERK_EXPIRY_DAYS,
  FOUNDING_MIN_CREDIT_BALANCE_CENTS,
  FOUNDING_MONTHLY_GAME_CREDIT_CENTS,
  FOUNDING_MONTHLY_GRANTS_TOTAL,
  tierForCohortNumber,
  tierByKey,
  heroStateForEligibleCount,
  foundingPerkExpiresAt,
  foundingPerkLapsed,
  claimRequirementsState,
  tierReceivesMonthlyPerk,
  monthlyDueCount,
  foundingMonthlyGrantKey,
} from '../worker/founding-giveaway-rules.js';

// --- Cohort boundaries: #100 tier 1, #101 tier 2, #200 tier 2, #201 none.
test('account #100 gets tier 1 amounts', () => {
  const tier = tierForCohortNumber(100);
  assert.equal(tier.key, 'first100');
  assert.equal(tier.gameCreditCents, 1000);
  assert.equal(tier.freeLoveNoteSends, 2);
  assert.equal(tier.futurePerks, true);
});

test('account #101 gets tier 2 amounts', () => {
  const tier = tierForCohortNumber(101);
  assert.equal(tier.key, 'second100');
  assert.equal(tier.gameCreditCents, 500);
  assert.equal(tier.freeLoveNoteSends, 1);
  assert.equal(tier.futurePerks, false);
});

test('account #200 is still tier 2; #201 gets nothing', () => {
  assert.equal(tierForCohortNumber(200).key, 'second100');
  assert.equal(tierForCohortNumber(201), null);
  assert.equal(tierForCohortNumber(0), null);
  assert.equal(tierForCohortNumber(1).key, 'first100');
});

// --- Hero phases: tier 1 open -> tier 2 open -> both full -> hidden.
test('hero shows tier 1 while fewer than 100 qualify', () => {
  const at0 = heroStateForEligibleCount(0);
  assert.equal(at0.open, true);
  assert.equal(at0.tier.key, 'first100');
  assert.equal(at0.spotsLeft, 100);
  const at99 = heroStateForEligibleCount(99);
  assert.equal(at99.tier.key, 'first100');
  assert.equal(at99.spotsLeft, 1);
});

test('hero switches to tier 2 once tier 1 is full', () => {
  const at100 = heroStateForEligibleCount(100);
  assert.equal(at100.open, true);
  assert.equal(at100.tier.key, 'second100');
  assert.equal(at100.spotsLeft, 100);
  const at199 = heroStateForEligibleCount(199);
  assert.equal(at199.tier.key, 'second100');
  assert.equal(at199.spotsLeft, 1);
});

test('hero hides entirely once both cohorts are full', () => {
  assert.equal(heroStateForEligibleCount(200).open, false);
  assert.equal(heroStateForEligibleCount(500).open, false);
});

// --- Expiry: owner's settled decision is NO EXPIRY for both grants.
test('expiry constant is no-expiry (owner decision)', () => {
  assert.equal(FOUNDING_PERK_EXPIRY_DAYS, null);
  assert.equal(foundingPerkExpiresAt(new Date('2026-10-10T00:00:00Z')), null);
  assert.equal(foundingPerkLapsed(null, new Date('2036-01-01T00:00:00Z')), false);
});

// --- Claim requirements: ALL must hold at claim time.
const ALL_MET = { credentialAccount: true, hasEmail: true, phoneVerified: true, creditBalanceCents: 500 };

test('claim blocked when phone is unverified', () => {
  const state = claimRequirementsState({ ...ALL_MET, phoneVerified: false });
  assert.equal(state.requirements.phoneVerified.met, false);
  assert.equal(state.allMet, false);
});

test('claim blocked at $4.99 Credit balance', () => {
  const state = claimRequirementsState({ ...ALL_MET, creditBalanceCents: 499 });
  assert.equal(state.requirements.minBalance.met, false);
  assert.equal(state.requirements.minBalance.requiredCents, FOUNDING_MIN_CREDIT_BALANCE_CENTS);
  assert.equal(state.allMet, false);
});

test('claim allowed at exactly $5.00 with all requirements met', () => {
  const state = claimRequirementsState(ALL_MET);
  assert.equal(state.allMet, true);
});

test('claim blocked without email or credential account', () => {
  assert.equal(claimRequirementsState({ ...ALL_MET, hasEmail: false }).allMet, false);
  assert.equal(claimRequirementsState({ ...ALL_MET, credentialAccount: false }).allMet, false);
});

// --- Monthly perk: first 100 only (owner's settled tier scope).
test('monthly perk tier flag: tier 1 yes, tier 2 no', () => {
  assert.equal(tierReceivesMonthlyPerk(tierByKey('first100')), true);
  assert.equal(tierReceivesMonthlyPerk(tierByKey('second100')), false);
  assert.equal(FOUNDING_MONTHLY_GAME_CREDIT_CENTS, 1000);
  assert.equal(FOUNDING_MONTHLY_GRANTS_TOTAL, 6);
});

// --- Monthly due counting: months 1 and 6 land, month 7 adds nothing.
test('monthly grants due at months 1 and 6, none beyond month 6', () => {
  const claimed = new Date('2026-10-10T12:00:00Z');
  assert.equal(monthlyDueCount(claimed, new Date('2026-10-10T12:00:00Z')), 0);
  assert.equal(monthlyDueCount(claimed, new Date('2026-11-09T12:00:00Z')), 0);
  assert.equal(monthlyDueCount(claimed, new Date('2026-11-10T12:00:00Z')), 1);
  assert.equal(monthlyDueCount(claimed, new Date('2027-03-10T12:00:00Z')), 5);
  assert.equal(monthlyDueCount(claimed, new Date('2027-04-10T12:00:00Z')), 6);
  assert.equal(monthlyDueCount(claimed, new Date('2027-05-10T12:00:00Z')), 6);
  assert.equal(monthlyDueCount(claimed, new Date('2028-10-10T12:00:00Z')), 6);
});

test('monthly grant keys are unique per member and month index', () => {
  assert.equal(foundingMonthlyGrantKey('user-a', 1), 'founding_monthly:user-a:1');
  assert.notEqual(foundingMonthlyGrantKey('user-a', 1), foundingMonthlyGrantKey('user-a', 2));
  assert.notEqual(foundingMonthlyGrantKey('user-a', 1), foundingMonthlyGrantKey('user-b', 1));
});
