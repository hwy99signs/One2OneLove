import fs from 'node:fs';

const failures = [];
const file = 'supabase/migrations/20260819_member_block_pending_request_cleanup.sql';
const source = fs.readFileSync(file, 'utf8');

for (const required of [
  "('friend_requests',     'sender_id',    'receiver_id')",
  "('connection_requests', 'requester_id', 'recipient_id')",
  "in ('pending','requested','open')",
  'after insert on public.member_blocks',
  'new.blocker_id, new.blocked_id',
  'revoke all on function public.cleanup_pending_member_requests_on_block() from public, anon, authenticated;',
  'without deleting accepted connection records',
]) {
  if (!source.includes(required)) failures.push(`${file}: missing pending-request cleanup safeguard ${required}.`);
}

for (const forbidden of [
  "delete from public.connections",
  "delete from public.friendships",
]) {
  if (source.includes(forbidden)) failures.push(`${file}: accepted connection data must not be deleted before the explicit product decision (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove blocked-pair pending-request cleanup check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ New member blocks remove pending pair requests without silently deleting accepted connections.');
