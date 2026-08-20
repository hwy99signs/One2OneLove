import fs from 'node:fs';

const failures = [];
const file = 'supabase/migrations/20260817_member_subscriptions.sql';
const source = fs.readFileSync(file, 'utf8');

for (const required of [
  'alter table public.member_subscriptions enable row level security;',
  'revoke all on table public.member_subscriptions from public, anon, authenticated;',
  'grant select (',
  'member_subscriptions_select_own_safe',
  'using ((select auth.uid()) = user_id);',
  'with (security_barrier = true, security_invoker = true)',
  'where user_id = (select auth.uid());',
  'revoke all on public.my_membership from public, anon, authenticated;',
  'grant select on public.my_membership to authenticated;',
]) {
  if (!source.includes(required)) failures.push(`${file}: missing safe invoker membership projection safeguard ${required}.`);
}

const safeGrant = source.slice(source.indexOf('grant select ('), source.indexOf(') on table public.member_subscriptions to authenticated;'));
for (const forbidden of [
  'stripe_customer_id',
  'stripe_subscription_id',
  'stripe_schedule_id',
  'current_price_id',
  'pricing_transition_status',
  'checkout_started_at',
]) {
  if (safeGrant.includes(forbidden)) failures.push(`${file}: authenticated safe-column grant must not expose ${forbidden}.`);
}

const viewBlock = source.slice(source.indexOf('create view public.my_membership'), source.indexOf('revoke all on public.my_membership'));
for (const forbidden of [
  'stripe_customer_id',
  'stripe_subscription_id',
  'stripe_schedule_id',
  'current_price_id',
  'pricing_transition_status',
  'checkout_started_at',
]) {
  if (viewBlock.includes(forbidden)) failures.push(`${file}: my_membership view must not expose ${forbidden}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove membership projection security check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Membership status uses a security-invoker own-row view backed by safe column grants; Stripe IDs and reconciliation internals remain browser-inaccessible.');
