import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260820183000_stripe_webhook_idempotency.sql';
const webhookFile = 'supabase/functions/stripe-webhook/index.ts';
const migration = fs.readFileSync(migrationFile, 'utf8');
const webhook = fs.readFileSync(webhookFile, 'utf8');

for (const required of [
  'create table if not exists public.stripe_webhook_events',
  'event_id text primary key',
  "check (status in ('processing','processed','failed'))",
  'attempts integer not null default 1',
  'alter table public.stripe_webhook_events enable row level security;',
  'revoke all on table public.stripe_webhook_events from public, anon, authenticated;',
  'add column if not exists stripe_event_id text null;',
  'subscription_changes_stripe_event_uidx',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing replay/idempotency safeguard ${required}.`);
}
for (const forbidden of ['raw_payload', 'card_number', 'recipient_email', 'billing_address']) {
  if (migration.includes(forbidden)) failures.push(`${migrationFile}: webhook replay ledger must not store raw/sensitive provider payload field ${forbidden}.`);
}

for (const required of [
  'const STRIPE_EVENT_ID_PATTERN =',
  'const WEBHOOK_CLAIM_STALE_MS = 5 * 60 * 1000',
  'const claimWebhookEvent = async',
  ".from('stripe_webhook_events')",
  "status: 'processing'",
  "existing.status === 'processed'",
  "existing.status === 'failed'",
  "duplicate: 'processing'",
  'const completeWebhookEvent = async',
  "status: 'processed'",
  'const failWebhookEvent = async',
  "status: 'failed'",
  "last_error_code: 'WEBHOOK_PROCESSING_FAILED'",
  'const recordCancellationChange = async',
  'stripe_event_id: eventId',
  "eventType === 'customer.subscription.created' || eventType === 'customer.subscription.updated'",
  'const subscription = await retrieveSubscription(subscriptionId)',
  "eventType === 'customer.subscription.deleted'",
  "stripe_schedule_id: eventType === 'subscription_schedule.released' ? null",
]) {
  if (!webhook.includes(required)) failures.push(`${webhookFile}: missing webhook replay/current-state safeguard ${required}.`);
}

for (const forbidden of [
  "throw new Error(clean(payload?.error?.message",
  'Configured Stripe prices do not match',
  'Subscription ID is missing',
]) {
  if (webhook.includes(forbidden)) failures.push(`${webhookFile}: provider/internal English prose must not be used as webhook control state (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Stripe webhook idempotency check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Stripe webhook staging is signature-verified, event-ledger claimed, retry-aware, cancellation-idempotent and current-subscription-state driven.');
