import fs from 'node:fs';

const failures = [];
const quotaFile = 'supabase/migrations/20260819_support_request_quota_guard.sql';
const stateFile = 'supabase/migrations/20260819_support_request_state_guard.sql';
const auditFile = 'supabase/migrations/20260831012000_support_request_audit_integrity.sql';
const memberFunctionFile = 'supabase/functions/support-request/index.ts';
const adminFunctionFile = 'supabase/functions/manage-support-requests/index.ts';

const quota = fs.readFileSync(quotaFile, 'utf8');
const state = fs.readFileSync(stateFile, 'utf8');
const audit = fs.readFileSync(auditFile, 'utf8');
const memberFunction = fs.readFileSync(memberFunctionFile, 'utf8');
const adminFunction = fs.readFileSync(adminFunctionFile, 'utf8');

for (const required of [
  'create or replace function o2ol_private.enforce_member_support_open_request_limit()',
  'security invoker',
  "set search_path = ''",
  'pg_advisory_xact_lock(lock_key)',
  "status in ('open','in_progress')",
  'open_count >= 5',
  'SUPPORT_OPEN_REQUEST_LIMIT_REACHED',
]) {
  if (!quota.includes(required)) failures.push(`${quotaFile}: missing serialized support quota safeguard ${required}.`);
}

for (const required of [
  'create or replace function o2ol_private.enforce_support_request_state_integrity()',
  'security invoker',
  "set search_path = ''",
  'SUPPORT_REQUEST_MEMBER_CONTENT_IMMUTABLE',
  'SUPPORT_REQUEST_INVALID_STATUS_TRANSITION',
  "old.status = 'open' and new.status in ('in_progress','resolved','closed')",
  "old.status = 'in_progress' and new.status in ('resolved','closed')",
  "old.status = 'resolved' and new.status in ('in_progress','closed')",
  "old.status = 'closed' and new.status = 'in_progress'",
  'SUPPORT_REQUEST_CLOSED_AT_REQUIRED',
  'SUPPORT_REQUEST_CLOSED_AT_NOT_ALLOWED',
  'SUPPORT_REQUEST_RESPONDED_AT_REQUIRED',
  'SUPPORT_REQUEST_RESPONSE_REQUIRED',
  'before insert or update on public.support_requests',
  'execute function o2ol_private.enforce_support_request_state_integrity();',
]) {
  if (!state.includes(required)) failures.push(`${stateFile}: missing support state/content safeguard ${required}.`);
}

for (const required of [
  'DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.',
  'add column if not exists last_actor_user_id uuid null',
  'add column if not exists last_actor_kind text null',
  'foreign key (last_actor_user_id) references auth.users(id) on delete set null',
  'alter table public.support_request_audit alter column actor_user_id drop not null',
  'foreign key (actor_user_id) references auth.users(id) on delete set null',
  'revoke select on table public.support_requests from authenticated',
  'grant select (',
  'member_response_read_at',
  'create or replace function o2ol_private.enforce_support_request_audit_actor()',
  'SUPPORT_REQUEST_AUDIT_ACTOR_REQUIRED',
  'SUPPORT_REQUEST_MEMBER_ACTOR_MISMATCH',
  'SUPPORT_REQUEST_MEMBER_WORKFLOW_FORBIDDEN',
  'create or replace function o2ol_private.audit_support_request_lifecycle()',
  "values (new.id, new.last_actor_user_id, 'created')",
  "audit_action := 'staff_resolved'",
  "'member_closed' else 'staff_closed'",
  'create trigger support_requests_audit_lifecycle',
  'after insert or update of status, staff_response, responded_at, closed_at',
]) {
  if (!audit.includes(required)) failures.push(`${auditFile}: missing atomic support audit safeguard ${required}.`);
}

for (const forbidden of ['grant select (\n  last_actor_user_id', 'grant select (\n  last_actor_kind']) {
  if (audit.includes(forbidden)) failures.push(`${auditFile}: server-only support actor metadata must not be browser-readable.`);
}

for (const [file, source] of [[quotaFile, quota], [stateFile, state], [auditFile, audit]]) {
  if (/create or replace function o2ol_private\.[^(]+\([^)]*\)[\s\S]{0,120}security definer/i.test(source)) {
    failures.push(`${file}: support integrity/audit trigger helpers must not use SECURITY DEFINER.`);
  }
}

for (const [file, source] of [[memberFunctionFile, memberFunction], [adminFunctionFile, adminFunction]]) {
  if (source.includes(".from('support_request_audit')")) {
    failures.push(`${file}: support audit writes must be database-atomic, never a second Edge Function call.`);
  }
  if (!source.includes('last_actor_user_id: caller.id') || !source.includes('last_actor_kind:')) {
    failures.push(`${file}: lifecycle mutations must carry server-validated actor metadata in the same row write.`);
  }
}
if (!memberFunction.includes("last_actor_kind: 'member'")) failures.push(`${memberFunctionFile}: member lifecycle actor must be classified as member.`);
if (!adminFunction.includes("last_actor_kind: 'staff'")) failures.push(`${adminFunctionFile}: staff lifecycle actor must be classified as staff.`);

if (failures.length) {
  console.error('\n⛔ One2OneLove support state check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Support requests have a serialized five-open ceiling, immutable member-authored content, database-enforced lifecycle integrity, hidden actor metadata and database-atomic lifecycle auditing.');
