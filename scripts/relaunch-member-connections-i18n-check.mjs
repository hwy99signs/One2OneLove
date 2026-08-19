import fs from 'node:fs';

const invite = fs.readFileSync('src/pages/InviteRelaunch.jsx', 'utf8');
const findMembers = fs.readFileSync('src/pages/FindFriendsRelaunch.jsx', 'utf8');
const requests = fs.readFileSync('src/pages/FriendRequestsRelaunch.jsx', 'utf8');
const failures = [];

for (const binding of [
  'toast.error(t.copyError)',
  'toast.error(t.shareError)',
  'localizeFeatureTerms(baseCopy.message, extras.featureTerms || [])',
  "['Love Notes', 'Liebesnotizen']",
]) {
  if (!invite.includes(binding)) failures.push(`InviteRelaunch.jsx: missing localized invite binding ${binding}.`);
}

for (const locale of ['en-US', 'es-ES', 'fr-FR', 'it-IT', 'de-DE']) {
  if (!findMembers.includes(locale)) failures.push(`FindFriendsRelaunch.jsx: missing active member-date locale ${locale}.`);
}
for (const binding of [
  '>{t.signInButton}</Button>',
  'toast.error(error?.message || t.loadError)',
  'toast.error(error?.message || t.sendError)',
  'toast.error(error?.message || t.cancelError)',
  'toLocaleDateString(t.locale)',
]) {
  if (!findMembers.includes(binding)) failures.push(`FindFriendsRelaunch.jsx: missing localized member-discovery binding ${binding}.`);
}
if (findMembers.includes('toLocaleDateString()')) {
  failures.push('FindFriendsRelaunch.jsx: member-since dates must not use the browser default locale.');
}
if (findMembers.includes(">Sign In</Button>")) {
  failures.push('FindFriendsRelaunch.jsx: sign-in CTA must not be hard-coded in English.');
}

for (const binding of [
  '{t.signInPrompt}',
  '>{t.signInButton}</Button>',
  'toast.error(t.loadError)',
  'toast.error(t.updateError)',
]) {
  if (!requests.includes(binding)) failures.push(`FriendRequestsRelaunch.jsx: missing localized connection-request binding ${binding}.`);
}
if (requests.includes('Sign in to manage connection requests.</p>') || requests.includes('>Sign In</Button>')) {
  failures.push('FriendRequestsRelaunch.jsx: signed-out request state must not be hard-coded in English.');
}

if (failures.length) {
  console.error('\n⛔ One2OneLove member-connections multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Invite, member discovery and connection-request runtime copy follows EN/ES/FR/IT/DE, including member dates and failure states.');
