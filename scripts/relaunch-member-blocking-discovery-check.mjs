import fs from 'node:fs';

const failures = [];
const endpointFile = 'supabase/functions/discover-members/index.ts';
const serviceFile = 'src/lib/memberDiscoveryService.js';
const connectionMigrationFile = 'supabase/migrations/20260819_member_block_connection_enforcement.sql';
const pairwiseMigrationFile = 'supabase/migrations/20260819_member_block_pairwise_visibility.sql';

const endpoint = fs.readFileSync(endpointFile, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
const connectionMigration = fs.readFileSync(connectionMigrationFile, 'utf8');
const pairwiseMigration = fs.readFileSync(pairwiseMigrationFile, 'utf8');

for (const required of [
  "Deno.env.get('MEMBER_BLOCKING_ENABLED') !== 'true'",
  "serviceClient.from('member_blocks').select('blocked_id').eq('blocker_id', caller.id)",
  "serviceClient.from('member_blocks').select('blocker_id').eq('blocked_id', caller.id)",
  "const excluded = new Set<string>([caller.id])",
  ".from('member_directory')",
  ".select('id,name,avatar_url,bio,created_at')",
  'const safeMembers = (members || []).map',
  'id: member.id',
  'name: clean(member.name, 80) || null',
  'avatar_url: clean(member.avatar_url, 1000) || null',
  'bio: clean(member.bio, 500) || null',
  'created_at: member.created_at || null',
]) {
  if (!endpoint.includes(required)) failures.push(`${endpointFile}: missing block-aware discovery safeguard ${required}.`);
}
if (/\|\|\s*['"]Member['"]/.test(endpoint)) {
  failures.push(`${endpointFile}: server discovery must not synthesize an English-only member-name fallback.`);
}
for (const forbidden of ['email', 'partner_email', 'subscription', 'verification', 'relationship_status', 'location', 'interests', "select('*')"]) {
  const publicSelection = endpoint.match(/\.select\('([^']+)'\)/g)?.join(' ') || '';
  if (publicSelection.includes(forbidden)) failures.push(`${endpointFile}: discovery must not select private/non-required field ${forbidden}.`);
}

for (const required of [
  'MEMBER_BLOCKING_ENABLED',
  "supabase.functions.invoke('discover-members'",
  'Math.max(1, Math.min(Number(limit) || 25, 50))',
  'O2OL_MEMBER_DISCOVERY_FAILED',
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing block-aware discovery client behavior ${required}.`);
}
if (/Unable to discover members/.test(service)) failures.push(`${serviceFile}: internal service error must remain language-neutral.`);

for (const required of [
  'user_directory_profiles_hide_blocked_pairs',
  'user_presence_hide_blocked_pairs',
  'as restrictive',
  'using (not o2ol_private.is_member_pair_blocked(id));',
]) {
  if (!pairwiseMigration.includes(required)) failures.push(`${pairwiseMigrationFile}: missing source-level blocked member discovery/privacy safeguard ${required}.`);
}

for (const required of [
  "('friend_requests',      'sender_id',    'receiver_id')",
  "('connection_requests',  'requester_id', 'recipient_id')",
  "('connections',          'user1_id',     'user2_id')",
  "('friendships',          'user_id',      'friend_id')",
  'as restrictive for select to authenticated',
  'as restrictive for insert to authenticated',
  'as restrictive for update to authenticated',
  'o2ol_private.is_member_pair_blocked',
  "raise exception 'NO_REVIEWED_MEMBER_CONNECTION_PAIR_TABLE_FOUND';",
]) {
  if (!connectionMigration.includes(required)) failures.push(`${connectionMigrationFile}: missing connection/request block enforcement ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove blocked-member discovery check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Blocked-member privacy is enforced at the directory source and defense-in-depth discovery endpoint, with pairwise connection/request restrictions staged.');
