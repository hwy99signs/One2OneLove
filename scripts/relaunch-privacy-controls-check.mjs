import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const migration = read('supabase/migrations/20260818_privacy_requests.sql');
const privacyReconciliation = read('supabase/migrations/20260821211500_privacy_request_workflow_reconciliation.sql');
const directoryMigration = read('supabase/migrations/20260818_member_directory_minimization.sql');
const fn = read('supabase/functions/privacy-request/index.ts');
const manageFn = read('supabase/functions/manage-privacy-requests/index.ts');
const service = read('src/lib/privacyRequestService.js');
const buddyService = read('src/lib/buddyService.js');
const page = read('src/pages/PrivacyCenter.jsx');
const findMembers = read('src/pages/FindFriendsRelaunch.jsx');
const router = read('src/pages/index.jsx');

requireText(migration, 'create table if not exists public.privacy_requests', 'Privacy request queue migration must exist.');
requireText(migration, 'revoke all on table public.privacy_requests from authenticated', 'Browser clients must not directly mutate/read the initial privacy queue.');
requireText(migration, "where status in ('submitted', 'in_review')", 'Duplicate active requests of the same type must be prevented.');

requireText(privacyReconciliation, 'DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.', 'Privacy reconciliation must remain explicitly production-gated.');
requireText(privacyReconciliation, 'revoke all on table public.privacy_requests from public, anon, authenticated', 'Final privacy queue must revoke all direct browser access.');
requireText(privacyReconciliation, 'revoke all on table public.privacy_request_audit from public, anon, authenticated', 'Privacy audit must remain service-only.');
requireText(privacyReconciliation, 'drop policy if exists "privacy_requests_select_own"', 'Older direct member-read policy must be removed by reconciliation.');
requireText(privacyReconciliation, "check (status in ('submitted', 'in_review', 'completed', 'declined', 'canceled'))", 'Final request statuses must use the routed Privacy Center contract.');
requireText(privacyReconciliation, 'new.member_note is distinct from old.member_note', 'Member-authored privacy request content must be immutable after intake.');
requireText(privacyReconciliation, 'PRIVACY_REQUEST_INVALID_INITIAL_STATE', 'Database must reject pre-reviewed or pre-completed request inserts.');
requireText(privacyReconciliation, 'PRIVACY_REQUEST_INVALID_STATUS_TRANSITION', 'Database must reject invalid request lifecycle transitions.');
requireText(privacyReconciliation, 'security invoker\nset search_path = \'\'', 'Privacy integrity helpers must use invoker rights and an empty search path.');
forbidText(privacyReconciliation, 'delete from auth.users', 'Privacy queue migration must never delete auth users.');
forbidText(privacyReconciliation, 'auth.admin', 'Privacy queue migration must never perform auth-admin actions.');

requireText(fn, 'serviceClient.auth.getUser(token)', 'Privacy request function must validate the authenticated member server-side.');
requireText(fn, 'EMAIL_CONFIRMATION_REQUIRED', 'Privacy request function must require confirmed email.');
requireText(fn, "Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'", 'Request intake must default closed behind a server activation flag.');
requireText(fn, "new Set(['data_export', 'account_deletion'])", 'Member intake must expose only the reviewed export/deletion request types.');
forbidText(fn, 'admin.deleteUser', 'Privacy request intake must not directly delete an auth account.');
forbidText(fn, 'auth.admin', 'Privacy request intake must not call destructive auth-admin operations.');

requireText(manageFn, "Deno.env.get('O2OL_PRIVACY_ADMIN_USER_IDS')", 'Privacy review access must use the server-side admin UUID allowlist.');
requireText(manageFn, 'EMAIL_CONFIRMATION_REQUIRED', 'Privacy review access must require a confirmed staff account.');
requireText(manageFn, "const fields = 'id,request_type,member_note,status,staff_response,reviewed_at,completed_at,canceled_at,created_at,updated_at'", 'Privacy review responses must use the minimized reviewed field set.');
forbidText(manageFn, "const fields = 'id,user_id", 'Privacy review responses must never include member user_id.');
requireText(manageFn, "status: completed ? 'completed' : 'declined'", 'Privacy review decisions must use the member-facing declined status contract.');
requireText(manageFn, ".in('status', ['completed', 'declined'])", 'Privacy reopen path must use canonical completed/declined states.');
forbidText(manageFn, 'admin.deleteUser', 'Privacy review must not directly delete an auth account.');
forbidText(manageFn, 'auth.admin', 'Privacy review must not call destructive auth-admin operations.');

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
console.log('Privacy-controls preflight passed: request intake is authenticated/private/default-off, review is server-allowlisted and non-destructive, lifecycle state is reconciled, and member discovery remains minimized.');
