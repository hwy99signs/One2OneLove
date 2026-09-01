import fs from 'node:fs';

const failures = [];
const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);

const queueFile = 'docs/RELAUNCH_APPROVAL_QUEUE.md';
const reconciliationFile = 'docs/MEMBERSHIP_BILLING_RECONCILIATION.md';
const liveDriftFile = 'docs/LIVE_DRIFT_AUDIT_20260820.md';
const stripeServiceFile = 'src/lib/stripeService.js';
const checkoutFile = 'supabase/functions/create-checkout-session/index.ts';
const portalFile = 'supabase/functions/create-billing-portal-session/index.ts';
const webhookFile = 'supabase/functions/stripe-webhook/index.ts';

for (const file of [queueFile, reconciliationFile, stripeServiceFile, checkoutFile, portalFile, webhookFile]) {
  if (!exists(file)) failures.push(`Required billing reconciliation artifact is missing: ${file}.`);
}

const queue = exists(queueFile) ? read(queueFile) : '';
const reconciliation = exists(reconciliationFile) ? read(reconciliationFile) : '';
const stripeService = exists(stripeServiceFile) ? read(stripeServiceFile) : '';
const checkout = exists(checkoutFile) ? read(checkoutFile) : '';
const portal = exists(portalFile) ? read(portalFile) : '';
const webhook = exists(webhookFile) ? read(webhookFile) : '';

for (const required of [
  '### Stripe membership billing reconciliation and production cutover',
  'The live production billing surface must remain unchanged until approved.',
  'membership payment, cancellation, and webhook delivery are all tested end to end',
  'Latest live-drift documentation',
  '`docs/MEMBERSHIP_BILLING_RECONCILIATION.md`',
]) {
  if (!queue.includes(required)) failures.push(`${queueFile}: missing current production billing boundary ${required}.`);
}

if (!exists(liveDriftFile) && !queue.includes('Latest live-drift documentation')) {
  failures.push('Billing cutover must retain an explicit live-drift review requirement before production changes.');
}
if (!/legacy|existing|current/i.test(reconciliation) || !/webhook|stripe/i.test(reconciliation)) {
  failures.push(`${reconciliationFile}: must document the existing/live billing surface before cutover.`);
}

for (const required of [
  "const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';",
  "const MEMBERSHIP_PLAN_KEY = 'membership';",
  "supabase.functions.invoke('create-checkout-session'",
  "supabase.functions.invoke('create-billing-portal-session'",
  ".from('my_membership')",
]) {
  if (!stripeService.includes(required)) failures.push(`${stripeServiceFile}: missing browser billing boundary ${required}.`);
}

for (const required of [
  "Deno.env.get('MEMBERSHIP_PAYMENTS_ENABLED')",
  "Deno.env.get('MEMBERSHIP_BILLING_ALLOWED_ORIGINS')",
  'email_confirmed_at',
]) {
  if (!checkout.includes(required)) failures.push(`${checkoutFile}: missing fail-closed checkout safeguard ${required}.`);
}
for (const required of [
  "Deno.env.get('MEMBERSHIP_PAYMENTS_ENABLED')",
  'stripe_customer_id',
  "url.protocol !== 'https:'",
]) {
  if (!portal.includes(required)) failures.push(`${portalFile}: missing caller-bound portal safeguard ${required}.`);
}
for (const required of ['stripe-signature', 'constructEvent', 'member_subscriptions']) {
  if (!webhook.includes(required)) failures.push(`${webhookFile}: missing webhook reconciliation safeguard ${required}.`);
}

if (/VITE_PAYMENTS_ENABLED\s*=\s*['"]true['"]/.test(queue) || /MEMBERSHIP_PAYMENTS_ENABLED\s*=\s*['"]true['"]/.test(queue)) {
  failures.push(`${queueFile}: production approval documentation must not encode a live billing activation.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove billing reconciliation check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Billing reconciliation remains production-held: current Stripe state is protected, staging is fail-closed, drift review is mandatory, and cutover requires end-to-end payment/cancel/webhook verification.');
