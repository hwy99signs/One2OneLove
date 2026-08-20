import fs from 'node:fs';

const failures = [];
const file = 'supabase/migrations/20260819_member_block_pending_request_cleanup.sql';
const source = fs.readFileSync(file, 'utf8');

for (const required of [
  "('buddy_requests',      'from_user_id', 'to_user_id')",
  "('friend_requests',     'sender_id',    'receiver_id')",
  "('connection_requests', 'requester_id', 'recipient_id')",
  "in ('pending','requested','open')",
  'after insert on public.member_blocks',
  'new.blocker_id, new.blocked_id',
  'create or replace function o2ol_private.cleanup_pending_member_requests_on_block()',
  "set search_path = ''",
  'revoke all on function o2ol_private.cleanup_pending_member_requests_on_block() from public, anon, authenticated;',
  'execute function o2ol_private.cleanup_pending_member_requests_on_block();',
  'without deleting accepted connection records',
]) {
  if (!source.includes(required)) failures.push(`${file}: missing pending-request cleanup safeguard ${required}.`);
}

for (const forbidden of [
  "delete from public.connections",
  "delete from public.friendships",
  "status::text, '') in ('accepted'",
  'function public.cleanup_pending_member_requests_on_block',
  'set search_path = public',
]) {
  if (source.includes(forbidden)) failures.push(`${file}: blocked-pair cleanup contains disallowed behavior (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove blocked-pair pending-request cleanup check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ New member blocks remove current buddy and legacy pending requests through a non-public fixed-search-path helper without silently deleting accepted connections.');
