import fs from 'node:fs';

const failures = [];
const blocksMigration = fs.readFileSync('supabase/migrations/20260819_member_blocks.sql', 'utf8');
const pairwiseMigration = fs.readFileSync('supabase/migrations/20260819_member_block_pairwise_visibility.sql', 'utf8');
const roomMigration = fs.readFileSync('supabase/migrations/20260819_member_block_live_room_visibility.sql', 'utf8');
const chatMigration = fs.readFileSync('supabase/migrations/20260819_member_block_chat_enforcement.sql', 'utf8');
const actionFunction = fs.readFileSync('supabase/functions/member-block/index.ts', 'utf8');
const listFunction = fs.readFileSync('supabase/functions/list-blocked-members/index.ts', 'utf8');
const service = fs.readFileSync('src/lib/memberBlockService.js', 'utf8');
const button = fs.readFileSync('src/components/safety/MemberBlockButton.jsx', 'utf8');
const page = fs.readFileSync('src/pages/BlockedMembers.jsx', 'utf8');

for (const required of [
  'primary key (blocker_id, blocked_id)',
  'check (blocker_id <> blocked_id)',
  'alter table public.member_blocks enable row level security;',
  'grant select on table public.member_blocks to authenticated;',
  'using ((select auth.uid()) = blocker_id);',
]) {
  if (!blocksMigration.includes(required)) failures.push(`member_blocks migration missing ${required}.`);
}

for (const required of [
  'create schema if not exists private;',
  'create or replace function private.is_member_pair_blocked(other_user_id uuid)',
  'security definer',
  'grant execute on function private.is_member_pair_blocked(uuid) to authenticated;',
  'as restrictive',
  'using (not private.is_member_pair_blocked(user_id));',
]) {
  if (!pairwiseMigration.includes(required)) failures.push(`pairwise block migration missing ${required}.`);
}
if (!roomMigration.includes('as restrictive')) failures.push('initial Live Room block policy must remain restrictive for migration-order safety.');

for (const required of [
  'alter table public.conversations enable row level security;',
  'alter table public.messages enable row level security;',
  'conversations_hide_blocked_pairs',
  'conversations_prevent_blocked_pair_insert',
  'conversations_prevent_blocked_pair_update',
  'messages_hide_blocked_pairs',
  'messages_prevent_blocked_pair_insert',
  'messages_prevent_blocked_pair_update',
  "raise exception 'EXPECTED_MESSAGES_CONVERSATION_ID_MISSING';",
]) {
  if (!chatMigration.includes(required)) failures.push(`pairwise chat block enforcement missing ${required}.`);
}

for (const required of [
  "Deno.env.get('MEMBER_BLOCKING_ENABLED') !== 'true'",
  ".eq('blocker_id', caller.id)",
  'if (blockedId === caller.id)',
  "if (action === 'unblock')",
  "if (action !== 'block')",
  "upsert({ blocker_id: caller.id, blocked_id: blockedId }",
]) {
  if (!actionFunction.includes(required)) failures.push(`member-block endpoint missing ${required}.`);
}
for (const required of [
  ".select('id,name')",
  "return json(request, { success: true, enabled: true, members })",
]) {
  if (!listFunction.includes(required)) failures.push(`blocked-member listing missing privacy-safe behavior ${required}.`);
}
for (const forbidden of ['email', 'partner_email', 'subscription', 'verification']) {
  const selection = listFunction.match(/\.select\('([^']+)'\)/g)?.join(' ') || '';
  if (selection.includes(forbidden)) failures.push(`blocked-member listing must not select ${forbidden}.`);
}

for (const required of [
  "VITE_MEMBER_BLOCKING_ENABLED === 'true'",
  "supabase.functions.invoke('member-block'",
  "supabase.functions.invoke('list-blocked-members'",
]) {
  if (!service.includes(required)) failures.push(`memberBlockService missing ${required}.`);
}
for (const language of ['en','es','fr','it','de']) {
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(button)) failures.push(`MemberBlockButton missing ${language} copy.`);
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(page)) failures.push(`BlockedMembers page missing ${language} copy.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove member blocking foundation check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Member blocking foundation is private, mutual in Live Rooms, enforced in pairwise chat, and still held from activation pending discovery/request enforcement.');
