import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260820_live_room_write_identity_hardening.sql';
const serviceFile = 'src/lib/liveRoomMessageService.js';
const migration = fs.readFileSync(migrationFile, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');

for (const required of [
  'create or replace function o2ol_private.set_room_member_identity()',
  'create or replace function o2ol_private.set_room_reaction_identity()',
  'create or replace function o2ol_private.set_room_report_identity()',
  'security invoker',
  "set search_path = ''",
  'new.user_id := caller_id;',
  "new.message_type := 'member';",
  'new.user_id := (select auth.uid());',
  'new.reporter_id := (select auth.uid());',
  "new.status := 'pending';",
  'grant insert (room_slug, content) on table public.room_messages to authenticated;',
  'grant insert (message_id, emoji) on table public.room_message_reactions to authenticated;',
  'grant insert (message_id, reason, details) on table public.room_message_reports to authenticated;',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing Auth-derived write safeguard ${required}.`);
}

for (const forbidden of [
  'grant insert (message_id, reporter_id, reason, details)',
  'grant select, insert, delete on table public.room_messages to authenticated;',
  'create or replace function public.set_room_member_identity()',
]) {
  if (migration.includes(forbidden)) failures.push(`${migrationFile}: broad/caller-owned Live Room write contract remains (${forbidden}).`);
}

for (const required of [
  'const codedError = (code) =>',
  'const requireCurrentUser = async () =>',
  'const requireRoomSlug = (roomSlug) =>',
  'const requireMessageId = (messageId) =>',
  'export async function sendRoomMessage(roomSlug, _user, content)',
  'await requireCurrentUser();',
  '.insert({ room_slug: slug, content: trimmed })',
  'export async function deleteOwnRoomMessage(messageId, _userId)',
  'export async function reportRoomMessage(messageId, _reporterId, reason, details = "")',
  'if (error?.code === "23502")',
  'reporter_id: user.id',
  'export async function toggleRoomReaction(message, _userId, emoji)',
  'Math.max(1, Math.min(Number(limit) || 80, 100))',
  'window.setTimeout(() =>',
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing caller-independent/compatibility safeguard ${required}.`);
}

for (const forbidden of [
  'throw new Error("Sign in to continue.")',
  'throw new Error("Sign in to send a message.")',
  'throw new Error("Write a message first.")',
  'throw new Error("Unable to delete this message.")',
  'sender_name: user.name',
  'message_type: "member"',
]) {
  if (service.includes(forbidden)) failures.push(`${serviceFile}: browser identity or English operational error regression remains (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Live Room write identity check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Live Room messages, reactions and reports derive ownership from Auth, narrow future INSERT grants, retain old-schema compatibility and bound realtime refreshes.');
