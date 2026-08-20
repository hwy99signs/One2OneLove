import fs from 'node:fs';

const failures = [];
const file = 'supabase/functions/list-blocked-members/index.ts';
const source = fs.readFileSync(file, 'utf8');

for (const required of [
  ".from('member_blocks')",
  ".eq('blocker_id', caller.id)",
  ".from('user_directory_profiles')",
  ".select('id,name')",
  "name: names.get(block.blocked_id) || ''",
  "return json(request, { success: true, enabled: true, members })",
]) {
  if (!source.includes(required)) failures.push(`${file}: missing blocked-list privacy/localization safeguard ${required}.`);
}

for (const forbidden of [
  ".from('users')",
  "|| 'Member'",
  'email',
  'partner_email',
  'stripe_customer_id',
  'subscription_status',
  'verification_status',
]) {
  if (source.includes(forbidden)) failures.push(`${file}: blocked-member list must not use private profile source, English fallback, or sensitive field ${forbidden}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove blocked-member list privacy check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Blocked-member management resolves only safe directory names and leaves missing-name fallback to the localized client.');
