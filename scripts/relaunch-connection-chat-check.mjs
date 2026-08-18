import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const findAlias = read('src/pages/FindFriends.jsx');
const findPage = read('src/pages/FindFriendsRelaunch.jsx');
const requestAlias = read('src/pages/FriendRequests.jsx');
const requestPage = read('src/pages/FriendRequestsRelaunch.jsx');
const profile = read('src/pages/ProfileRelaunchSafe.jsx');
const buddyService = read('src/lib/buddyService.js');
const directoryMigration = read('supabase/migrations/20260817_member_directory_privacy.sql');
const chatGate = read('supabase/migrations/20260818_chat_connection_gate.sql');
const composer = read('src/components/chat/ChatComposerRelaunch.jsx');

const directorySelect = directoryMigration.match(/as\s+select([\s\S]*?)from\s+public\.users/i)?.[1] || '';

check('member discovery uses relaunch page', findAlias.includes("./FindFriendsRelaunch"), 'Legacy discovery UI must not reintroduce direct pre-accept Chat.');
check('connection requests use relaunch page', requestAlias.includes("./FriendRequestsRelaunch"), 'Legacy request UI must not expose account email.');
check('member discovery never renders account email', !findPage.includes('member.email') && !findPage.includes('userData.email'), 'Directory surface must stay on privacy-safe profile fields.');
check('request page never renders account email', !requestPage.includes('.email') && requestPage.includes('Account email is never shown here.'), 'Connection-request identity is name/avatar/bio only.');
check('private Chat button requires accepted connection in UI', findPage.includes('const connected = connectedIds.has(member.id)') && findPage.includes("connected ? <Button") && findPage.includes('/Chat?userId='), 'Pending/unconnected members should not get a direct Chat control.');

check(
  'member directory exposes only the disclosed regular-member projection',
  directorySelect.includes('id,')
    && directorySelect.includes('name,')
    && directorySelect.includes('avatar_url,')
    && directorySelect.includes('bio,')
    && directorySelect.includes('relationship_status,')
    && directorySelect.includes('location,')
    && directorySelect.includes('created_at')
    && !directorySelect.includes('email')
    && !directorySelect.includes('partner_')
    && !directorySelect.includes('interests')
    && !directorySelect.includes('user_type')
    && directoryMigration.includes("coalesce(user_type, 'regular') = 'regular'"),
  'The database projection itself should exclude email, partner data, interests and role/account type rather than relying only on UI restraint.'
);
check(
  'profile disclosure matches the member directory fields',
  profile.includes('name, profile image, short bio, general location, relationship status and member-since date')
    && profile.includes('account email, anniversary, partner name and Love Language are not included in the member directory'),
  'Members should be told what discovery actually exposes and what remains account-private.'
);
check(
  'buddy service requests only the minimized directory contract',
  buddyService.includes("'relationship_status',\n  'location',\n  'created_at'")
    && !buddyService.includes("'user_type',")
    && !buddyService.includes("'interests',")
    && !buddyService.includes(".eq('user_type'")
    && !buddyService.includes(".from('users')"),
  'Browser discovery must not request fields the staged member directory deliberately removed.'
);
check(
  'buddy request reads avoid broad select-star projections',
  !buddyService.includes(".from('buddy_requests')\n      .select('*')"),
  'Connection request operations should request only the fields needed by the relaunch UI.'
);

check('database conversation RPC requires accepted connection', chatGate.includes('are_accepted_buddies(v_self, v_other)') && chatGate.includes('Private Chat is available only after a connection request is accepted'), 'Guessed deep links/direct RPC calls must not create unsolicited chats.');
check('database message insert also requires accepted connection', chatGate.includes('enforce_message_connection_gate') && chatGate.includes('Private messages require an accepted connection'), 'A legacy conversation row must not bypass the connection rule.');
check('Chat attachments are default-off behind explicit flag', composer.includes("VITE_CHAT_ATTACHMENTS_ENABLED === 'true'") && composer.includes('Private text chat is active. Attachments and location sharing remain staged'), 'Text Chat should be the safe baseline until private attachment activation.');
check('Chat location sharing is independently default-off', composer.includes("VITE_CHAT_LOCATION_ENABLED === 'true'") && composer.includes('if (!CHAT_LOCATION_ENABLED'), 'Location is sensitive and should require its own explicit activation.');

console.log('\nOne2OneLove member-connection/private-chat check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name} — ${item.detail}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
