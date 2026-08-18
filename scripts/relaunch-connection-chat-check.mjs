import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const findAlias = read('src/pages/FindFriends.jsx');
const findPage = read('src/pages/FindFriendsRelaunch.jsx');
const requestAlias = read('src/pages/FriendRequests.jsx');
const requestPage = read('src/pages/FriendRequestsRelaunch.jsx');
const buddyService = read('src/lib/buddyService.js');
const chatGate = read('supabase/migrations/20260818_chat_connection_gate.sql');
const composer = read('src/components/chat/ChatComposerRelaunch.jsx');

check('member discovery uses relaunch page', findAlias.includes("./FindFriendsRelaunch"), 'Legacy discovery UI must not reintroduce direct pre-accept Chat.');
check('connection requests use relaunch page', requestAlias.includes("./FriendRequestsRelaunch"), 'Legacy request UI must not expose account email.');
check('member discovery never renders account email', !findPage.includes('member.email') && !findPage.includes('userData.email'), 'Directory surface must stay on privacy-safe profile fields.');
check('request page never renders account email', !requestPage.includes('.email') && requestPage.includes('Account email is never shown here.'), 'Connection-request identity is name/avatar/bio only.');
check('private Chat button requires accepted connection in UI', findPage.includes('const connected = connectedIds.has(member.id)') && findPage.includes("connected ? <Button") && findPage.includes('/Chat?userId='), 'Pending/unconnected members should not get a direct Chat control.');
check('buddy service member lookups stay on privacy directory', buddyService.includes(".from('member_directory')") && !buddyService.includes(".from('users')"), 'Social discovery must not query private users rows.');
check('database conversation RPC requires accepted connection', chatGate.includes('are_accepted_buddies(v_self, v_other)') && chatGate.includes('Private Chat is available only after a connection request is accepted'), 'Guessed deep links/direct RPC calls must not create unsolicited chats.');
check('database message insert also requires accepted connection', chatGate.includes('enforce_message_connection_gate') && chatGate.includes('Private messages require an accepted connection'), 'A legacy conversation row must not bypass the connection rule.');
check('Chat attachments are default-off behind explicit flag', composer.includes("VITE_CHAT_ATTACHMENTS_ENABLED === 'true'") && composer.includes('Private text chat is active. Attachments and location sharing remain staged'), 'Text Chat should be the safe baseline until private attachment activation.');
check('Chat location sharing is independently default-off', composer.includes("VITE_CHAT_LOCATION_ENABLED === 'true'") && composer.includes('if (!CHAT_LOCATION_ENABLED'), 'Location is sensitive and should require its own explicit activation.');

console.log('\nOne2OneLove member-connection/private-chat check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name} — ${item.detail}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
