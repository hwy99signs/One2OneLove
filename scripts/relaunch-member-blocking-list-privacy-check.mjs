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

const queryLeaksPrivateProfiles = /\.from\(['"]users['"]\)/.test(source)
  || /\.select\([^)]*(email|partner_email|stripe_customer_id|subscription_status|verification_status)/i.test(source);
if (queryLeaksPrivateProfiles) {
  failures.push(`${file}: blocked-member list query must not read private profile/contact/billing fields.`);
}
if (/\|\|\s*['"]Member['"]/.test(source)) {
  failures.push(`${file}: blocked-member list must leave missing-name fallback to localized client copy.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove blocked-member list privacy check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Blocked-member management resolves only safe directory names and leaves missing-name fallback to the localized client.');
