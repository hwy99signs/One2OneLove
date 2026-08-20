import fs from 'node:fs';

const failures = [];
const stripeServiceFile = 'src/lib/stripeService.js';
const membershipConfigFile = 'src/lib/membershipConfig.js';
const subscriptionFile = 'src/pages/Subscription.jsx';
const paymentSuccessFile = 'src/pages/PaymentSuccess.jsx';
const checkoutFile = 'supabase/functions/create-checkout-session/index.ts';
const portalFile = 'supabase/functions/create-billing-portal-session/index.ts';
const webhookFile = 'supabase/functions/stripe-webhook/index.ts';
const approvalFile = 'docs/RELAUNCH_APPROVAL_QUEUE.md';
const reconciliationFile = 'docs/MEMBERSHIP_BILLING_RECONCILIATION.md';
const driftFile = 'docs/LIVE_DRIFT_AUDIT_20260820.md';

const read = (file) => fs.readFileSync(file, 'utf8');
const stripeService = read(stripeServiceFile);
const membershipConfig = read(membershipConfigFile);
const subscription = read(subscriptionFile);
const paymentSuccess = read(paymentSuccessFile);
const checkout = read(checkoutFile);
const portal = read(portalFile);
const webhook = read(webhookFile);
const approval = read(approvalFile);
const reconciliation = read(reconciliationFile);
const drift = read(driftFile);

for (const required of [
  "const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';",
  "const MEMBERSHIP_PLAN_KEY = 'membership';",
  "const codedError = (code = 'BILLING_REQUEST_FAILED')",
  "throw codedError('AUTH_REQUIRED')",
  "throw codedError('EMAIL_CONFIRMATION_REQUIRED')",
  "throw codedError('PAYMENTS_DISABLED')",
  "export const createCheckoutSession = async () =>",
  "body: { planKey: MEMBERSHIP_PLAN_KEY }",
  "supabase.functions.invoke('create-billing-portal-session'",
  ".from('my_membership')",
  "return { success: false, error: '', errorCode: internalCode(error, 'CHECKOUT_FAILED') };",
  "return { success: false, error: '', errorCode: internalCode(error, 'PORTAL_FAILED') };",
  'export const featureAccess = Object.freeze({});',
  'export const hasFeatureAccess = () => false;',
]) {
  if (!stripeService.includes(required)) failures.push(`${stripeServiceFile}: missing relaunch billing boundary ${required}.`);
}

for (const forbidden of [
  "body: { priceId:",
  "body: { planName:",
  'userId:',
  'userEmail:',
  "supabase.functions.invoke('create-billing-portal',",
]) {
  const checkoutCall = stripeService.slice(
    stripeService.indexOf("supabase.functions.invoke('create-checkout-session'"),
    stripeService.indexOf('/** Read only the authenticated user')
  );
  if (checkoutCall.includes(forbidden)) failures.push(`${stripeServiceFile}: browser checkout/portal path must not revive legacy caller-controlled billing field ${forbidden}.`);
}

for (const displayLeak of [
  'You must be signed in to manage membership.',
  'Please confirm your email before managing membership.',
  'Membership payments are not enabled yet.',
  'No secure checkout URL was returned.',
  'Failed to create a checkout session.',
  'Membership billing is not enabled yet.',
  'No secure billing portal URL was returned.',
  'Unable to open billing management.',
]) {
  if (stripeService.includes(displayLeak)) failures.push(`${stripeServiceFile}: English member-display service prose must not bypass localized membership UI (${displayLeak}).`);
}

for (const required of [
  "planKey: 'membership'",
  "pricingVersion: 'launch_2026'",
  'introMonthly: 1.99',
  'introMonths: 6',
  'standardMonthly: 5.99',
  "paymentsEnabled = () => import.meta.env.VITE_PAYMENTS_ENABLED === 'true'",
]) {
  if (!membershipConfig.includes(required)) failures.push(`${membershipConfigFile}: missing approved membership pricing/gate ${required}.`);
}

for (const required of [
  'const paymentsEnabled = isPaymentsEnabled();',
  'disabled={actionLoading || !paymentsEnabled}',
  'setMessage(result.error || t.checkoutUnavailable)',
  'setMessage(result.error || t.billingUnavailable)',
  '!paymentsEnabled ? t.checkoutStaged',
]) {
  if (!subscription.includes(required)) failures.push(`${subscriptionFile}: missing gated/localized membership runtime behavior ${required}.`);
}

for (const required of [
  "const hasCheckoutMarker = Boolean(searchParams.get('session_id'));",
  'const current = await getUserSubscription();',
  'ACTIVE_MEMBERSHIP_STATUSES.has(current?.status)',
  "setState('active')",
  "if (!hasCheckoutMarker)",
  "setState('unverified')",
  "setState('processing')",
]) {
  if (!paymentSuccess.includes(required)) failures.push(`${paymentSuccessFile}: payment return page must verify server-synchronized membership state (${required}).`);
}
if (paymentSuccess.includes("if (hasCheckoutMarker) setState('active')") || paymentSuccess.includes("session_id') && setState('active')")) {
  failures.push(`${paymentSuccessFile}: checkout URL/session marker must never be treated as proof of active payment.`);
}

for (const required of [
  "const PLAN_KEY = 'membership'",
  "const PRICING_VERSION = 'launch_2026'",
  'const INTRO_CENTS = 199',
  'const STANDARD_CENTS = 599',
  "Deno.env.get('PAYMENTS_ENABLED') !== 'true'",
  "Deno.env.get('STRIPE_PRICE_INTRO')",
  "Deno.env.get('STRIPE_PRICE_STANDARD')",
  'await validateLaunchPrices(introPriceId, standardPriceId)',
  "if (body?.planKey && body.planKey !== PLAN_KEY)",
  "sessionBody.set('metadata[o2ol_plan_key]', PLAN_KEY)",
  "sessionBody.set('metadata[o2ol_pricing_version]', PRICING_VERSION)",
  ".from('member_subscriptions')",
]) {
  if (!checkout.includes(required)) failures.push(`${checkoutFile}: missing server-owned relaunch checkout safeguard ${required}.`);
}
for (const forbidden of [
  "body?.priceId",
  "body?.amount",
  "body?.userId",
  "body?.userEmail",
  "body?.planName",
]) {
  if (checkout.includes(forbidden)) failures.push(`${checkoutFile}: relaunch checkout must not trust legacy browser billing field ${forbidden}.`);
}

for (const required of [
  "Deno.env.get('PAYMENTS_ENABLED') !== 'true'",
  ".from('member_subscriptions')",
  ".select('stripe_customer_id')",
  "fetch('https://api.stripe.com/v1/billing_portal/sessions'",
]) {
  if (!portal.includes(required)) failures.push(`${portalFile}: missing hardened billing portal safeguard ${required}.`);
}

for (const required of [
  'Do not replace the production webhook until existing Stripe usage',
  "const PLAN_KEY = 'membership'",
  "const PRICING_VERSION = 'launch_2026'",
  "metadata?.o2ol_plan_key",
  "metadata?.o2ol_pricing_version",
  'verifyStripeSignature',
  "Deno.env.get('STRIPE_WEBHOOK_SECRET')",
  ".from('member_subscriptions')",
]) {
  if (!webhook.includes(required)) failures.push(`${webhookFile}: missing controlled relaunch webhook safeguard ${required}.`);
}

for (const required of [
  '22. Legacy-to-relaunch membership billing reconciliation and production cutover.',
  'Keep `VITE_PAYMENTS_ENABLED=false` and server `PAYMENTS_ENABLED=false`',
  'Do not disable, overwrite, rename, delete, or repoint those live functions/webhooks',
  '`docs/MEMBERSHIP_BILLING_RECONCILIATION.md`',
  '`docs/LIVE_DRIFT_AUDIT_20260820.md`',
]) {
  if (!approval.includes(required)) failures.push(`${approvalFile}: missing production billing reconciliation boundary ${required}.`);
}

for (const required of [
  'Live legacy production billing',
  'Relaunch membership billing',
  'Do not disable or delete the live legacy Stripe functions.',
  'Do not enable `VITE_PAYMENTS_ENABLED` or server `PAYMENTS_ENABLED` in production.',
  'preserve any real existing paid customer/subscription state',
]) {
  if (!reconciliation.includes(required)) failures.push(`${reconciliationFile}: missing controlled billing reconciliation requirement ${required}.`);
}

for (const required of [
  '`create-checkout-session`',
  '`stripe-webhook`',
  '`create-billing-portal`',
  '`Basic` / `active`: **11 accounts**',
  'total rows: **0**',
  'must not be disabled, overwritten, renamed, or replaced automatically',
]) {
  if (!drift.includes(required)) failures.push(`${driftFile}: missing dated live billing drift fact ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove billing reconciliation check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Relaunch membership billing stays single-SKU, localized on failure, server-verified on return, browser/server-gated, server-priced, legacy-drift documented, and production-cutover locked.');
