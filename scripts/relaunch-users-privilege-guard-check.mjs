import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');

const migration = read('supabase/migrations/20260821230000_users_privileged_field_guard.sql');
const profile = read('src/lib/profileService.js');
const creatorBooking = read('supabase/functions/book-creator-programming-slot/index.ts');

for (const required of [
  'DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval',
  'create or replace function public.protect_users_privileged_fields()',
  'security invoker',
  "set search_path = ''",
  "if current_user in ('anon', 'authenticated') then",
  "'user_type'",
  "'is_verified'",
  "'is_active'",
  "'stripe_customer_id'",
  "'stripe_subscription_id'",
  "'subscription_status'",
  "'membership_status'",
  "message = 'O2OL_ACCOUNT_PRIVILEGED_FIELD_IMMUTABLE'",
  'revoke all on function public.protect_users_privileged_fields() from public, anon, authenticated;',
  'create trigger users_protect_privileged_fields',
  'before update on public.users',
]) {
  if (!migration.includes(required)) failures.push(`Users privileged-field guard missing safeguard: ${required}`);
}

for (const forbidden of ['security definer', 'delete from auth.users']) {
  if (migration.toLowerCase().includes(forbidden)) failures.push(`Users privileged-field guard must not contain ${forbidden}.`);
}

if (!profile.includes('const SAFE_PROFILE_UPDATE_FIELDS = new Set([')) {
  failures.push('Profile service must retain an explicit browser-editable field allowlist.');
}
for (const field of ['user_type', 'email', 'stripe_customer_id', 'subscription_status', 'is_verified', 'is_active']) {
  const safeBlock = profile.match(/const SAFE_PROFILE_UPDATE_FIELDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
  if (safeBlock.includes(`'${field}'`) || safeBlock.includes(`"${field}"`)) {
    failures.push(`Profile browser allowlist must not include server-owned field ${field}.`);
  }
}

for (const required of [
  "Deno.env.get('CREATOR_PROGRAMMING_ENABLED') !== 'true'",
  'EMAIL_CONFIRMATION_REQUIRED',
  ".select('id,user_type')",
  "creator?.user_type !== 'influencer'",
  "error: 'CREATOR_NOT_APPROVED'",
]) {
  if (!creatorBooking.includes(required)) failures.push(`Creator booking must retain server-side creator access enforcement: ${required}`);
}

const creatorGateIndex = creatorBooking.indexOf("Deno.env.get('CREATOR_PROGRAMMING_ENABLED') !== 'true'");
const creatorRoleIndex = creatorBooking.indexOf("creator?.user_type !== 'influencer'");
if (creatorGateIndex < 0 || creatorRoleIndex < 0 || creatorGateIndex > creatorRoleIndex) {
  failures.push('Creator programming feature gate must run before creator-role/data handling.');
}

if (failures.length) {
  console.error('\nUsers privilege-ownership blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Users privilege-ownership preflight passed: browser profile writes cannot assign creator/admin/verification/billing state, and creator booking remains feature-gated, confirmed-account-only and tied to the server-owned influencer role.');
