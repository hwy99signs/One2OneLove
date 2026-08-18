export const MEMBERSHIP_PRICING = Object.freeze({
  planKey: 'membership',
  pricingVersion: 'launch_2026',
  currency: 'USD',
  introMonthly: 1.99,
  introMonths: 6,
  standardMonthly: 5.99,
});

export const paymentsEnabled = () => import.meta.env.VITE_PAYMENTS_ENABLED === 'true';
export const membershipGatingEnabled = () => import.meta.env.VITE_MEMBERSHIP_GATING_ENABLED === 'true';

export const ACTIVE_MEMBERSHIP_STATUSES = new Set(['trialing', 'active']);

export const formatMembershipPrice = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: MEMBERSHIP_PRICING.currency,
    minimumFractionDigits: 2,
  }).format(amount);
