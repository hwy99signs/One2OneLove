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
const privacyControl = fs.readFileSync('src/components/privacy/BlockedMembersControl.jsx', 'utf8');
const page = fs.readFileSync('src/pages/BlockedMembers.jsx', 'utf8');
const privacyCenter = fs.readFileSync('src/pages/PrivacyCenter.jsx', 'utf8');
const routes = fs.readFileSync('src/pages/index.jsx', 'utf8');

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
  'create schema if not exists o2ol_private;',
  'revoke all on schema o2ol_private from public, anon;',
  'create or replace function o2ol_private.is_member_pair_blocked(other_user_id uuid)',
  'security definer',
  "set search_path = ''",
  'revoke all on function o2ol_private.is_member_pair_blocked(uuid) from public, anon;',
  'grant execute on function o2ol_private.is_member_pair_blocked(uuid) to authenticated;',
  "raise exception 'O2OL_BLOCK_MEMBER_DIRECTORY_SOURCE_MISSING';",
  "raise exception 'O2OL_BLOCK_PRESENCE_SOURCE_MISSING';",
  'user_directory_profiles_hide_blocked_pairs',
  'user_presence_hide_blocked_pairs',
  'room_messages_hide_blocked_pairs',
  'room_reactions_hide_blocked_pairs',
  'room_reactions_prevent_blocked_pair_insert',
  'alter table public.user_directory_profiles enable row level security;',
  'alter table public.user_presence enable row level security;',
  'using (not o2ol_private.is_member_pair_blocked(id));',
  'using (not o2ol_private.is_member_pair_blocked(user_id));',
  'visible_message.id = room_message_reactions.message_id',
]) {
  if (!pairwiseMigration.includes(required)) failures.push(`pairwise block migration missing ${required}.`);
}
if (/\bprivate\.is_member_pair_blocked/.test(pairwiseMigration + chatMigration)) {
  failures.push('member blocking must use the established o2ol_private helper schema, not a second generic private schema.');
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
  'o2ol_private.is_member_pair_blocked',
  "raise exception 'EXPECTED_MESSAGES_CONVERSATION_ID_MISSING';",
]) {
  if (!chatMigration.includes(required)) failures.push(`pairwise chat block enforcement missing ${required}.`);
}

for (const required of [
  "Deno.env.get('MEMBER_BLOCKING_ENABLED') !== 'true'",
  'const UUID_PATTERN =',
  "return json(request, { error: 'BLOCKED_USER_INVALID' }, 400)",
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
  'O2OL_MEMBER_BLOCK_UPDATE_FAILED',
  'O2OL_MEMBER_BLOCK_LIST_FAILED',
]) {
  if (!service.includes(required)) failures.push(`memberBlockService missing ${required}.`);
}
if (/Member blocking is not enabled yet|Unable to update member block|Unable to load blocked members/.test(service)) {
  failures.push('memberBlockService must use stable language-neutral internal error codes rather than English service errors.');
}

for (const language of ['en','es','fr','it','de']) {
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(button)) failures.push(`MemberBlockButton missing ${language} copy.`);
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(page)) failures.push(`BlockedMembers page missing ${language} copy.`);
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(privacyControl)) failures.push(`BlockedMembersControl missing ${language} copy.`);
}

for (const required of [
  "const navigate = useNavigate();",
  "navigate('/SignIn?returnTo=%2FBlockedMembers')",
  "navigate('/PrivacyCenter')",
  'member.name || t.memberFallback',
]) {
  if (!page.includes(required)) failures.push(`BlockedMembers page missing safe navigation/localization behavior ${required}.`);
}
if (page.includes("member.name || 'Member'")) failures.push('BlockedMembers page must not retain an English-only fallback member label.');

for (const required of [
  "if (!MEMBER_BLOCKING_ENABLED) return null;",
  "navigate('/BlockedMembers')",
]) {
  if (!privacyControl.includes(required)) failures.push(`Privacy Center blocking control missing feature gate/navigation ${required}.`);
}

for (const required of [
  "import BlockedMembersControl from '@/components/privacy/BlockedMembersControl';",
  '<BlockedMembersControl className="mt-8" />',
]) {
  if (!privacyCenter.includes(required)) failures.push(`PrivacyCenter missing blocked-member management integration ${required}.`);
}

for (const required of [
  'import BlockedMembers from "./BlockedMembers";',
  'BlockedMembers,',
  '["/BlockedMembers", BlockedMembers]',
]) {
  if (!routes.includes(required)) failures.push(`Relaunch routes missing BlockedMembers binding ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove member blocking foundation check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Member blocking is private, mutually enforced at directory/presence/chat/room sources, multilingual, input-validated, routed, manageable from Privacy Center, and feature-gated for relaunch activation.');
