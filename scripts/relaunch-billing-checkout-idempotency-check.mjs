import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260820184500_checkout_attempt_guard.sql';
const checkoutFile = 'supabase/functions/create-checkout-session/index.ts';
const migration = fs.readFileSync(migrationFile, 'utf8');
const checkout = fs.readFileSync(checkoutFile, 'utf8');

for (const required of [
  'create table if not exists public.stripe_checkout_attempts',
  'user_id uuid primary key references auth.users(id) on delete cascade',
  'attempt_token uuid not null default gen_random_uuid()',
  "check (status in ('processing','open','completed','expired','failed'))",
  'stripe_checkout_session_id text null unique',
  'alter table public.stripe_checkout_attempts enable row level security;',
  'revoke all on table public.stripe_checkout_attempts from public, anon, authenticated;',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing checkout-attempt safeguard ${required}.`);
}

for (const required of [
  'const CHECKOUT_CLAIM_STALE_MS = 2 * 60 * 1000',
  'const claimCheckoutAttempt = async',
  ".from('stripe_checkout_attempts')",
  "return { state: 'busy', attempt: existing }",
  'Preserve attempt_token so a lost Stripe response reuses the same Idempotency-Key.',
  "'Idempotency-Key': idempotencyKey.slice(0, 255)",
  '`o2ol-customer-${user.id}`',
  '`o2ol-checkout-${activeAttemptToken}`',
  "if (status === 'open')",
  "if (!checkoutUrl) return json(request, { error: 'CHECKOUT_RECONCILIATION_REQUIRED', sessionId }, 503)",
  "if (status === 'complete')",
  "if (status !== 'expired')",
  'const reset = await resetExplicitlyExpiredOpenAttempt',
  "return json(request, { sessionId, url: checkoutUrl, reused: true })",
  "status: 'open'",
  "last_error_code: 'CHECKOUT_UNAVAILABLE'",
]) {
  if (!checkout.includes(required)) failures.push(`${checkoutFile}: missing single-active-checkout safeguard ${required}.`);
}

for (const forbidden of [
  'body?.priceId',
  'body?.amount',
  'body?.userId',
  'body?.userEmail',
  'Stripe returned ${response.status}',
  'Configured Stripe prices do not match',
]) {
  if (checkout.includes(forbidden)) failures.push(`${checkoutFile}: checkout must not trust browser billing fields or expose provider prose (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Stripe checkout idempotency check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Stripe checkout staging permits one active member attempt, reuses idempotency/session state, and creates a fresh session only after explicit Stripe expiry.');
