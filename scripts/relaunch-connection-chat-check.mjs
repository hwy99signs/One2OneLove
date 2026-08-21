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
const memberMedia = read('src/lib/memberMedia.js');
const chatPage = read('src/pages/Chat.jsx');
const chatList = read('src/components/chat/ChatList.jsx');
const chatWindow = read('src/components/chat/ChatWindow.jsx');
const chatMessage = read('src/components/chat/ChatMessageRelaunch.jsx');
const chatCopy = read('src/lib/chatCopy.js');
const relaunchChatService = read('src/lib/relaunchChatService.js');
const directoryMigration = read('supabase/migrations/20260818_member_directory_minimization.sql');
const chatGate = read('supabase/migrations/20260818_chat_connection_gate.sql');
const composer = read('src/components/chat/ChatComposerRelaunch.jsx');

const directorySelect = directoryMigration.match(/as\s+select([\s\S]*?)from\s+public\.users/i)?.[1] || '';

check('member discovery uses relaunch page', findAlias.includes('./FindFriendsRelaunch'), 'Legacy discovery UI must not reintroduce direct pre-accept Chat.');
check('connection requests use relaunch page', requestAlias.includes('./FriendRequestsRelaunch'), 'Legacy request UI must not expose account email.');
check('member discovery never renders account email', !findPage.includes('member.email') && !findPage.includes('userData.email'), 'Directory surface must stay on privacy-safe profile fields.');
check('request page never renders account email', !requestPage.includes('.email') && requestPage.includes('Account email is never shown here.'), 'Connection-request identity is name/avatar/bio only.');
check('private Chat button requires accepted connection in UI', findPage.includes('const connected = connectedIds.has(member.id)') && findPage.includes('connected ? <Button') && findPage.includes('/Chat?userId='), 'Pending/unconnected members should not get a direct Chat control.');

check(
  'member directory exposes only the minimized regular-member projection',
  directorySelect.includes('id,')
    && directorySelect.includes('name,')
    && directorySelect.includes('avatar_url,')
    && directorySelect.includes('bio,')
    && directorySelect.includes('created_at')
    && !directorySelect.includes('email')
    && !directorySelect.includes('relationship_status')
    && !directorySelect.includes('location')
    && !directorySelect.includes('partner_')
    && !directorySelect.includes('interests')
    && !directorySelect.includes('user_type')
    && directoryMigration.includes("coalesce(user_type, 'regular') = 'regular'"),
  'The database projection itself must expose only id/name/avatar/bio/member-since and exclude relationship/account data.'
);
check(
  'profile disclosure matches the minimized member directory',
  profile.includes('only your display name, optional profile image, short bio and member-since date')
    && profile.includes('location, relationship status, anniversary, partner information and Love Language remain account-private'),
  'Members should be told the same privacy boundary enforced by the directory.'
);
check(
  'buddy service requests only the minimized directory contract',
  buddyService.includes("const PUBLIC_MEMBER_FIELDS = 'id,name,avatar_url,bio,created_at'")
    && !buddyService.includes('location.ilike')
    && !buddyService.includes('relationship_status.ilike')
    && !buddyService.includes(".from('users')"),
  'Browser discovery must not request hidden relationship/location/account fields.'
);
check(
  'buddy request reads avoid broad select-star projections',
  !buddyService.includes(".from('buddy_requests')\n      .select('*')"),
  'Connection request operations should request only the fields needed by the relaunch UI.'
);

check(
  'member avatars are restricted to first-party profile-picture URLs',
  memberMedia.includes('candidate.origin !== expectedOrigin')
    && memberMedia.includes('candidate.pathname.startsWith(profilePicturePrefix)')
    && memberMedia.includes('profile-pictures/'),
  'Legacy external/generated avatar URLs must fall back locally rather than create third-party browser requests.'
);
check('buddy discovery sanitizes member avatar data', buddyService.includes("from './memberMedia'") && buddyService.includes('sanitizeMemberSummary'), 'Member cards and friend requests must receive sanitized avatar URLs.');
check(
  'Chat reads sanitize conversation and message avatars',
  chatPage.includes("from '@/lib/relaunchChatService'")
    && relaunchChatService.includes('safeMemberAvatarUrl(conversation.avatar)')
    && relaunchChatService.includes('safeMemberAvatarUrl(message.senderAvatar)'),
  'Conversation and message-level legacy generated avatar URLs must be stripped before rendering.'
);
check(
  'active relaunch Chat surfaces route service calls through the privacy wrapper',
  !chatPage.includes("from '@/lib/chatService'")
    && !chatWindow.includes("from '@/lib/chatService'")
    && chatWindow.includes("from '@/lib/relaunchChatService'"),
  'The large legacy service may remain internally, but relaunch Chat components must use the privacy wrapper.'
);
check(
  'private chat never displays raw attachment backend errors',
  chatPage.includes('toast.error(t.unableAttachment)') && !chatPage.includes('toast.error(error?.message'),
  'Attachment failures must use translated UI copy rather than connector/provider prose.'
);
check(
  'chat member fallback is localized in all five active languages',
  ['en:', 'es:', 'fr:', 'it:', 'de:'].every((key) => chatCopy.includes(key))
    && (chatCopy.match(/memberFallback:/g) || []).length === 5
    && !chatCopy.includes('nl:'),
  'Missing private-chat names must be supplied by the current five-language copy and inactive Dutch must stay absent.'
);
check(
  'chat list uses localized member, date and status copy',
  chatList.includes('chat.name || chatCopy.memberFallback')
    && chatList.includes('chatCopy.yesterday')
    && chatList.includes('chatCopy.mutedLabel')
    && chatList.includes('chatCopy.chatTitle')
    && chatList.includes('Intl.DateTimeFormat')
    && !chatList.includes("return 'Yesterday'")
    && !chatList.includes('nl:'),
  'Chat list headings, relative date labels, muted state and member fallbacks must follow the active language.'
);
check(
  'chat window uses localized member fallback and back label',
  chatWindow.includes('const displayName = chat.name || t.memberFallback')
    && chatWindow.includes('aria-label={t.back}')
    && !chatWindow.includes("chat.name || 'One2OneLove member'")
    && !chatWindow.includes("alt={chat.name || 'Member'}"),
  'Missing member names and navigation accessibility text must not fall back to hard-coded English.'
);
check(
  'message timestamps follow the selected O2OL language',
  chatMessage.includes('const LOCALES =')
    && chatMessage.includes("es: 'es-ES'")
    && chatMessage.includes("fr: 'fr-FR'")
    && chatMessage.includes("it: 'it-IT'")
    && chatMessage.includes("de: 'de-DE'")
    && chatMessage.includes('formatTime(message.timestamp || message.createdAt || message.sentAt, language)')
    && !chatMessage.includes('Intl.DateTimeFormat(undefined'),
  'Message timestamps must use the selected five-language locale rather than the browser/system locale.'
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
