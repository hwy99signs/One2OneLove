import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const migration = read('supabase/migrations/20260818_privacy_requests.sql');
const privacyReconciliation = read('supabase/migrations/20260821211500_privacy_request_workflow_reconciliation.sql');
const auditFinalizer = read('supabase/migrations/20260821224500_privacy_request_submission_audit.sql');
const directoryMigration = read('supabase/migrations/20260818_member_directory_minimization.sql');
const fn = read('supabase/functions/privacy-request/index.ts');
const manageFn = read('supabase/functions/manage-privacy-requests/index.ts');
const service = read('src/lib/privacyRequestService.js');
const reviewService = read('src/lib/privacyReviewService.js');
const buddyService = read('src/lib/buddyService.js');
const page = read('src/pages/PrivacyCenter.jsx');
const reviewPage = read('src/pages/PrivacyAdmin.jsx');
const findMembers = read('src/pages/FindFriendsRelaunch.jsx');
const router = read('src/pages/index.jsx');

requireText(migration, 'create table if not exists public.privacy_requests', 'Privacy request queue migration must exist.');
requireText(migration, 'revoke all on table public.privacy_requests from authenticated', 'Browser clients must not directly mutate/read the initial privacy queue.');
requireText(migration, "where status in ('submitted', 'in_review')", 'Initial duplicate active requests of the same type must be prevented.');

for (const required of [
  'DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.',
  'revoke all on table public.privacy_requests from public, anon, authenticated',
  'revoke all on table public.privacy_request_audit from public, anon, authenticated',
  'drop policy if exists "privacy_requests_select_own"',
  "check (status in ('submitted','in_review','awaiting_fulfillment','declined','canceled'))",
  "where status in ('submitted','in_review','awaiting_fulfillment')",
  'new.member_note is distinct from old.member_note',
  'PRIVACY_REQUEST_INVALID_INITIAL_STATE',
  'PRIVACY_REQUEST_INVALID_STATUS_TRANSITION',
  'PRIVACY_REQUEST_REVIEW_METADATA_REQUIRED',
  'PRIVACY_REQUEST_DECISION_METADATA_REQUIRED',
  'create or replace function o2ol_private.audit_privacy_request_state()',
  'create trigger privacy_requests_audit_state',
  "audit_action := 'staff_accepted_for_fulfillment'",
]) requireText(privacyReconciliation, required, `Privacy reconciliation missing safeguard: ${required}`);

for (const forbidden of [
  'delete from auth.users',
  'auth.admin',
  "status='completed' and new.completed_at",
]) forbidText(privacyReconciliation, forbidden, `Privacy reconciliation must remain non-destructive/non-misleading: ${forbidden}`);

requireText(auditFinalizer, 'drop trigger if exists privacy_requests_audit_submission', 'Later audit migration must remove the obsolete duplicate submission trigger.');
requireText(auditFinalizer, 'O2OL_PRIVACY_ATOMIC_AUDIT_TRIGGER_MISSING', 'Later audit migration must fail closed if the atomic lifecycle audit trigger is missing.');

requireText(fn, 'serviceClient.auth.getUser(token)', 'Privacy request function must validate the authenticated member server-side.');
requireText(fn, 'EMAIL_CONFIRMATION_REQUIRED', 'Privacy request function must require confirmed email.');
requireText(fn, "Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'", 'Request intake must default closed behind a server activation flag.');
requireText(fn, "new Set(['data_export', 'account_deletion'])", 'Member intake must expose only the reviewed export/deletion request types.');
requireText(fn, "const ACTIVE_STATUSES = ['submitted', 'in_review', 'awaiting_fulfillment']", 'Accepted-but-unfulfilled requests must still block duplicate intake.');
requireText(fn, 'decision_at', 'Member history must use neutral review-decision timing rather than completed-at semantics.');
forbidText(fn, 'completed_at', 'Member history must not imply review equals fulfillment.');
forbidText(fn, 'admin.deleteUser', 'Privacy request intake must not directly delete an auth account.');
forbidText(fn, 'auth.admin', 'Privacy request intake must not call destructive auth-admin operations.');

requireText(manageFn, "Deno.env.get('O2OL_PRIVACY_ADMIN_USER_IDS')", 'Privacy review access must use the server-side admin UUID allowlist.');
requireText(manageFn, 'EMAIL_CONFIRMATION_REQUIRED', 'Privacy review access must require a confirmed staff account.');
requireText(manageFn, "const REVIEW_FIELDS = 'id,request_type,member_note,status,staff_response,reviewed_at,decision_at,canceled_at,created_at,updated_at'", 'Privacy review responses must use the minimized reviewed field set.');
forbidText(manageFn, "const REVIEW_FIELDS = 'id,user_id", 'Privacy review responses must never include member user_id.');
forbidText(manageFn, 'reviewer_user_id,created_at', 'Privacy review response projection must not expose reviewer identity.');
requireText(manageFn, "status: accepted ? 'awaiting_fulfillment' : 'declined'", 'Staff acceptance must mean awaiting fulfillment, never completed.');
requireText(manageFn, 'PRIVACY_FULFILLMENT_NOT_AVAILABLE', 'Staff endpoint must explicitly reject complete/fulfill actions.');
requireText(manageFn, ".in('status', ['awaiting_fulfillment','declined'])", 'Privacy reopen path must use the non-fulfillment terminal review states.');
forbidText(manageFn, ".from('privacy_request_audit')", 'Staff endpoint must not perform second-step audit writes.');
forbidText(manageFn, 'admin.deleteUser', 'Privacy review must not directly delete an auth account.');
forbidText(manageFn, 'auth.admin', 'Privacy review must not call destructive auth-admin operations.');

requireText(page, 'It does not immediately delete your account', 'Deletion UI must state that submitting a request is not immediate deletion.');
requireText(page, "deleteConfirm.trim().toUpperCase() !== 'DELETE'", 'Account deletion requests require an explicit confirmation phrase.');
requireText(page, "['submitted', 'in_review', 'awaiting_fulfillment'].includes(item.status)", 'Privacy Center duplicate UI must treat awaiting fulfillment as active.');
requireText(page, "awaiting_fulfillment: 'Awaiting fulfillment'", 'Privacy Center must label the review-only accepted state truthfully.');
forbidText(page, "completed: 'Completed'", 'Privacy Center must not retain a completed label for review-only requests.');
requireText(service, "VITE_PRIVACY_REQUESTS_ENABLED === 'true'", 'Browser request controls must remain default-off until backend activation.');
requireText(router, '["/PrivacyCenter", PrivacyCenter]', 'Privacy Center must have an explicit relaunch route.');

for (const required of [
  "export const PRIVACY_REVIEW_ENABLED = import.meta.env.VITE_PRIVACY_REQUESTS_ENABLED === 'true'",
  "supabase.functions.invoke('manage-privacy-requests'",
  "action: 'access'",
  "action: 'accept'",
  "action: 'decline'",
  "action: 'reopen'",
]) requireText(reviewService, required, `Privacy review client missing controlled behavior: ${required}`);
for (const forbidden of ['auth.admin', 'deleteUser', 'signUp(', ".from('privacy_requests')", ".from('privacy_request_audit')"]) {
  forbidText(reviewService, forbidden, `Privacy review browser service must use only the reviewed Edge Function boundary: ${forbidden}`);
}

requireText(router, '["/PrivacyAdmin", PrivacyAdmin]', 'Private privacy-review console must have an explicit unlinked relaunch route.');
for (const language of ['en:', 'es:', 'fr:', 'it:', 'de:']) requireText(reviewPage, language, `Privacy review console missing active-language copy: ${language}`);
requireText(reviewPage, 'Accepting a request moves it to Awaiting fulfillment', 'Privacy review console must visibly distinguish review from fulfillment.');
requireText(reviewPage, 'It does not export data, delete an account, change billing, or send a message.', 'Privacy review console must visibly state its non-destructive boundary.');
requireText(reviewPage, "acceptPrivacyRequestForFulfillment", 'Privacy review console must use accept-for-fulfillment semantics.');
for (const forbidden of ['Complete request', 'Delete account now', 'Export now', 'auth.admin', 'deleteUser']) {
  forbidText(reviewPage, forbidden, `Privacy review UI must not contain a destructive/false-fulfillment path: ${forbidden}`);
}

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
console.log('Privacy-controls preflight passed: intake is authenticated/private/default-off, review is allowlisted/database-atomic, review never claims fulfillment, its staff console is non-destructive/unlinked, and discovery remains minimized.');
