import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const migration = read('supabase/migrations/20260818_privacy_requests.sql');
const directoryMigration = read('supabase/migrations/20260818_member_directory_minimization.sql');
const fn = read('supabase/functions/privacy-request/index.ts');
const service = read('src/lib/privacyRequestService.js');
const buddyService = read('src/lib/buddyService.js');
const page = read('src/pages/PrivacyCenter.jsx');
const findMembers = read('src/pages/FindFriendsRelaunch.jsx');
const router = read('src/pages/index.jsx');

requireText(migration, 'create table if not exists public.privacy_requests', 'Privacy request queue migration must exist.');
requireText(migration, 'revoke all on table public.privacy_requests from authenticated', 'Browser clients must not directly mutate/read the privacy queue.');
requireText(migration, "where status in ('submitted', 'in_review')", 'Duplicate active requests of the same type must be prevented.');
requireText(fn, 'serviceClient.auth.getUser(token)', 'Privacy request function must validate the authenticated member server-side.');
requireText(fn, 'EMAIL_CONFIRMATION_REQUIRED', 'Privacy request function must require confirmed email.');
requireText(fn, "Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'", 'Request intake must default closed behind a server activation flag.');
forbidText(fn, 'admin.deleteUser', 'Privacy request intake must not directly delete an auth account.');
forbidText(fn, 'auth.admin', 'Privacy request intake must not call destructive auth-admin operations.');
requireText(page, 'It does not immediately delete your account', 'Deletion UI must state that submitting a request is not immediate deletion.');
requireText(page, "deleteConfirm.trim().toUpperCase() !== 'DELETE'", 'Account deletion requests require an explicit confirmation phrase.');
requireText(service, "VITE_PRIVACY_REQUESTS_ENABLED === 'true'", 'Browser request controls must remain default-off until backend activation.');
requireText(router, '["/PrivacyCenter", PrivacyCenter]', 'Privacy Center must have an explicit relaunch route.');

requireText(directoryMigration, 'id,\n  name,\n  avatar_url,\n  bio,\n  created_at', 'Minimized member directory must expose only the reviewed discovery fields.');
forbidText(directoryMigration, 'relationship_status,', 'Relationship status must not be included in the default relaunch member directory.');
forbidText(directoryMigration, 'location,', 'Location must not be included in the default relaunch member directory.');
forbidText(directoryMigration, 'email,', 'Account email must never be part of the member directory projection.');
requireText(buddyService, "const PUBLIC_MEMBER_FIELDS = 'id,name,avatar_url,bio,created_at'", 'Buddy discovery client must request only minimized member fields.');
forbidText(buddyService, 'relationship_status,location', 'Buddy discovery must not request private relationship/location fields.');
forbidText(buddyService, 'location.ilike', 'Member search must not search private location.');
forbidText(buddyService, 'relationship_status.ilike', 'Member search must not search private relationship status.');
requireText(page, 'location, relationship status', 'Privacy Center must explicitly tell members those fields remain account-private.');
forbidText(findMembers, 'member.location', 'Find Members must not display location in the minimized relaunch directory.');
forbidText(findMembers, 'member.relationship_status', 'Find Members must not display relationship status in the minimized relaunch directory.');

if (failures.length) {
  console.error('\nPrivacy-controls preflight blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('Privacy-controls preflight passed: request intake is authenticated/private/default-off, deletion remains non-destructive, and member discovery is minimized to display name, optional avatar, short bio and join date.');
