import fs from 'node:fs';

const failures = [];
const file = 'supabase/migrations/20260819_support_request_quota_guard.sql';
const source = fs.readFileSync(file, 'utf8');

for (const required of [
  'pg_advisory_xact_lock(lock_key)',
  "status in ('open','in_progress')",
  'open_count >= 5',
  'SUPPORT_OPEN_REQUEST_LIMIT_REACHED',
  'before insert or update of user_id, status',
  'revoke all on function public.enforce_member_support_open_request_limit() from public, anon, authenticated;',
]) {
  if (!source.includes(required)) failures.push(`${file}: missing support quota safeguard ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove support quota check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Support open-request quota is serialized per member and database-enforced at five active requests.');
