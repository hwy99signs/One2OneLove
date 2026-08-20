import fs from 'node:fs';

const failures = [];
const quotaFile = 'supabase/migrations/20260819_support_request_quota_guard.sql';
const stateFile = 'supabase/migrations/20260819_support_request_state_guard.sql';
const quota = fs.readFileSync(quotaFile, 'utf8');
const state = fs.readFileSync(stateFile, 'utf8');

for (const required of [
  'pg_advisory_xact_lock(lock_key)',
  "status in ('open','in_progress')",
  'open_count >= 5',
  'SUPPORT_OPEN_REQUEST_LIMIT_REACHED',
]) {
  if (!quota.includes(required)) failures.push(`${quotaFile}: missing serialized support quota safeguard ${required}.`);
}

for (const required of [
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
]) {
  if (!state.includes(required)) failures.push(`${stateFile}: missing support state/content safeguard ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove support state check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Support requests have a serialized five-open ceiling, immutable member-authored content and database-enforced lifecycle integrity.');
