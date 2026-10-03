export const FOUNDING_LIMIT = 200;
export const FOUNDING_FIRST_COHORT_END = 100;
export const FOUNDING_FREE_DAYS = 30;
export const FOUNDING_EXCLUSIVE_RATE_CENTS = 1599;
export const REGULAR_PREMIERE_RATE_CENTS = 999;
export const REGULAR_EXCLUSIVE_RATE_CENTS = 1999;

export function canonicalMembershipPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'exclusive') return 'Exclusive';
  if (raw === 'premier' || raw === 'premiere' || raw === 'basic') return 'Premiere';
  return null;
}

export function foundingOfferForNumber(number) {
  const n = Number(number);
  if (!Number.isInteger(n) || n < 1 || n > FOUNDING_LIMIT) return null;
  if (n <= FOUNDING_FIRST_COHORT_END) {
    return {
      foundingNumber: n,
      cohort: 'first100',
      plan: 'Exclusive',
      freeDays: FOUNDING_FREE_DAYS,
      recurringPriceCents: FOUNDING_EXCLUSIVE_RATE_CENTS,
      regularPriceCents: REGULAR_EXCLUSIVE_RATE_CENTS,
    };
  }
  return {
    foundingNumber: n,
    cohort: 'second100',
    plan: 'Premiere',
    freeDays: FOUNDING_FREE_DAYS,
    recurringPriceCents: REGULAR_PREMIERE_RATE_CENTS,
    regularPriceCents: REGULAR_PREMIERE_RATE_CENTS,
  };
}

export function regularPriceCents(plan) {
  return canonicalMembershipPlan(plan) === 'Exclusive'
    ? REGULAR_EXCLUSIVE_RATE_CENTS
    : REGULAR_PREMIERE_RATE_CENTS;
}
