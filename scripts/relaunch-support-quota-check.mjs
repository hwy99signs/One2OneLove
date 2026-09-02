import fs from 'node:fs';

const failures = [];
const file = 'supabase/migrations/20260819_support_request_quota_guard.sql';
const source = fs.readFileSync(file, 'utf8');

for (const required of [
  'create or replace function o2ol_private.enforce_member_support_open_request_limit()',
  'security invoker',
  "set search_path = ''",
  'pg_advisory_xact_lock(lock_key)',
  "status in ('open','in_progress')",
  'open_count >= 5',
  'SUPPORT_OPEN_REQUEST_LIMIT_REACHED',
  'before insert or update of user_id, status',
  'revoke all on function o2ol_private.enforce_member_support_open_request_limit() from public, anon, authenticated;',
  'execute function o2ol_private.enforce_member_support_open_request_limit();',
]) {
  if (!source.includes(required)) failures.push(`${file}: missing support quota safeguard ${required}.`);
}
for (const forbidden of ['function public.enforce_member_support_open_request_limit', 'security definer', 'set search_path = public']) {
  if (source.includes(forbidden)) failures.push(`${file}: support quota guard contains disallowed privileged/public behavior (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove support quota check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Support open-request quota is serialized per member, database-enforced at five active requests, and implemented through a non-public SECURITY INVOKER trigger helper.');
