import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  loveNoteSend: 'supabase/functions/send-love-note-invitation/index.ts',
  loveNoteFlow: 'src/pages/LoveNoteSendFlow.jsx',
  chatStorage: 'supabase/migrations/20260818_chat_attachment_privacy.sql',
  messageInsert: 'supabase/migrations/20260817_message_insert_hardening.sql',
  chatService: 'src/lib/chatService.js',
  chatList: 'src/components/chat/ChatList.jsx',
  indexCss: 'src/index.css',
  membershipConfig: 'src/lib/membershipConfig.js',
  premiumAiMigration: 'supabase/migrations/20260818_premium_ai_tools.sql',
  coachFunction: 'supabase/functions/relationship-coach/index.ts',
  coachService: 'src/lib/relationshipCoachService.js',
  coachPage: 'src/pages/RelationshipCoach.jsx',
};

for (const file of Object.values(files)) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const loveNoteSend = exists(files.loveNoteSend) ? read(files.loveNoteSend) : '';
const loveNoteFlow = exists(files.loveNoteFlow) ? read(files.loveNoteFlow) : '';
const chatStorage = exists(files.chatStorage) ? read(files.chatStorage) : '';
const messageInsert = exists(files.messageInsert) ? read(files.messageInsert) : '';
const chatService = exists(files.chatService) ? read(files.chatService) : '';
const chatList = exists(files.chatList) ? read(files.chatList) : '';
const indexCss = exists(files.indexCss) ? read(files.indexCss) : '';
const membershipConfig = exists(files.membershipConfig) ? read(files.membershipConfig) : '';
const premiumAiMigration = exists(files.premiumAiMigration) ? read(files.premiumAiMigration) : '';
const coachFunction = exists(files.coachFunction) ? read(files.coachFunction) : '';
const coachService = exists(files.coachService) ? read(files.coachService) : '';
const coachPage = exists(files.coachPage) ? read(files.coachPage) : '';

check(
  'Love Note scheduling is mapped to membership',
  membershipConfig.includes("love_note_scheduling: 'membership'"),
  'Mixed-access Love Notes must keep instant send free while scheduling is premium.'
);
check(
  'Love Note scheduling has a server membership gate',
  loveNoteSend.includes("Deno.env.get('MEMBERSHIP_GATING_ENABLED')")
    && loveNoteSend.includes(".from('member_subscriptions')")
    && loveNoteSend.includes("code: 'MEMBERSHIP_REQUIRED'")
    && loveNoteSend.includes("feature: 'love_note_scheduling'"),
  'Browser UI must not be able to bypass the scheduling entitlement.'
);
check(
  'Instant Love Note delivery is not globally membership-gated',
  !/MEMBERSHIP_REQUIRED[\s\S]{0,300}scheduledRaw\s*=/.test(loveNoteSend)
    && loveNoteSend.includes('if (scheduledRaw)'),
  'The membership check must live inside the scheduled-delivery branch.'
);
check(
  'Love Note scheduling UI uses the approved feature entitlement',
  loveNoteFlow.includes('useFeatureAccess("love_note_scheduling")')
    && loveNoteFlow.includes('scheduleAccess.hasAccess')
    && loveNoteFlow.includes('scheduleAccess.needsSignIn'),
  'The mixed-access screen should guide signed-out visitors through auth and free members to Membership.'
);
check(
  'Love Note scheduling UX preserves the free draft',
  loveNoteFlow.includes('stashCurrent(2)')
    && loveNoteFlow.includes('navigate("/Subscription")')
    && loveNoteFlow.includes('setDeliveryTime("now")'),
  'An upgrade/sign-in redirect must not erase the Love Note and stale locked schedules must reset safely.'
);
check(
  'Love Note send-now option stays directly available',
  loveNoteFlow.includes('onClick={() => setDeliveryTime("now")}')
    && !/FeatureGate[^\n]*love_note_send/.test(loveNoteFlow),
  'Do not gate the entire Love Notes send page merely because scheduling is premium.'
);

check(
  'chat-files bucket is private with server MIME/size bounds',
  chatStorage.includes("'chat-files',\n  'chat-files',\n  false")
    && chatStorage.includes('10485760')
    && chatStorage.includes('allowed_mime_types'),
  'Private chat attachments need bucket-level privacy, size, and MIME enforcement.'
);
check(
  'chat storage uses restrictive bucket-only boundaries',
  chatStorage.includes('as restrictive')
    && chatStorage.includes("bucket_id <> 'chat-files'")
    && chatStorage.includes('O2OL chat-files read boundary')
    && chatStorage.includes('O2OL chat-files insert boundary'),
  'A broad legacy Storage policy must not bypass Chat privacy or be deleted if another bucket needs it.'
);
check(
  'new attachment reads require a visible message reference',
  chatStorage.includes('m.file_url = storage.objects.name')
    && chatStorage.includes('coalesce(m.is_deleted, false) = false')
    && chatStorage.includes('join public.conversations c on c.id = m.conversation_id'),
  'An orphan upload or soft-deleted message must not be enough to mint a fresh signed URL.'
);
check(
  'chat attachment write path is sender-scoped',
  chatStorage.includes('(storage.foldername(name))[2] = auth.uid()::text')
    && chatStorage.includes('O2OL chat senders can upload attachments'),
  'A member may upload only to their own sender segment inside a conversation path.'
);
check(
  'legacy chat object compatibility remains visible-message participant-only',
  chatStorage.includes("m.file_url like ('%/object/public/chat-files/' || storage.objects.name)")
    && chatStorage.includes('auth.uid() in (m.sender_id, m.receiver_id)')
    && chatStorage.includes('coalesce(m.is_deleted, false) = false'),
  'Making the bucket private must not expose legacy objects or unnecessarily orphan visible participant history.'
);
check(
  'duplicate chat attachment migration is absent',
  !exists('supabase/migrations/20260818_private_chat_attachments.sql'),
  'Keep one canonical storage migration so production cannot apply conflicting policies twice.'
);

check(
  'message insert rejects permanent/public attachment URLs',
  messageInsert.includes("position('://' in new.file_url) > 0")
    && messageInsert.includes('Attachment must use the private conversation storage path'),
  'Messages must persist object keys, not permanent URLs.'
);
check(
  'message insert binds attachment to conversation and sender',
  messageInsert.includes("new.conversation_id::text || '/' || new.sender_id::text || '/'")
    && messageInsert.includes('10485760'),
  'Attachment metadata must match the authenticated conversation/sender and 10 MiB limit.'
);
check(
  'chat client never calls getPublicUrl',
  !chatService.includes('.getPublicUrl('),
  'Permanent public attachment URLs must not return to the relaunch client.'
);
check(
  'chat client generates short-lived signed attachment URLs',
  chatService.includes('.createSignedUrls(')
    && chatService.includes('CHAT_SIGNED_URL_TTL_SECONDS = 15 * 60'),
  'Conversation reads should hydrate private paths with short-lived URLs.'
);
check(
  'chat client stores conversation/sender private object paths',
  chatService.includes('`${conversationId}/${user.id}/${objectId}.${extension}`')
    && chatService.includes('file_url: filePath'),
  'New attachment rows must persist the private object key only.'
);
check(
  'chat client cleans failed uploads',
  chatService.includes('.remove([uploadedPath])'),
  'A failed message insert must not leave an orphaned private file.'
);
check(
  'chat client enforces conservative attachment limits',
  chatService.includes('CHAT_FILE_MAX_BYTES = 10 * 1024 * 1024')
    && chatService.includes('SAFE_IMAGE_MIME_TYPES')
    && chatService.includes('SAFE_FILE_MIME_TYPES'),
  'Browser UX should reject oversized/unsupported files before upload; database/storage rules remain authoritative.'
);
check(
  'sender does not recalculate receiver unread count',
  !/sendMessage[\s\S]{0,2500}p_user_id:\s*receiverId/.test(chatService),
  'The database owns recipient unread increments; sender cannot mutate the other member state.'
);
check(
  'conversation delete is member-local archive',
  chatService.includes("return updateConversationSettings(conversationId, { isArchived: true })"),
  'One participant must not physically delete a shared conversation.'
);
check(
  'unfinished chat list actions are opt-in and hidden by default',
  chatList.includes('callsEnabled = false')
    && chatList.includes('markUnreadEnabled = false')
    && chatList.includes('destructiveDeleteEnabled = false')
    && chatList.includes('callsEnabled && onCall')
    && chatList.includes('markUnreadEnabled && onMarkAsUnread')
    && chatList.includes('destructiveDeleteEnabled && onDelete'),
  'Prototype voice/video, fake mark-unread, and misleading destructive delete must not appear in relaunch Chat by default.'
);
check(
  'chat search actually filters visible conversations',
  chatList.includes('const filteredConversations = React.useMemo')
    && chatList.includes('name.includes(query) || lastMessage.includes(query)')
    && chatList.includes('filteredConversations.map'),
  'A visible search field must perform a real local filter instead of acting like an inert prototype.'
);
check(
  'legacy chat header call buttons are hidden until real calling exists',
  indexCss.includes('button[title="Voice Call"]')
    && indexCss.includes('button[title="Video Call"]')
    && indexCss.includes('display: none !important'),
  'Do not present WebRTC-looking controls before signaling/media infrastructure is actually built and tested.'
);

check(
  'Relationship Coach is mapped to paid membership',
  membershipConfig.includes("relationship_coach: 'membership'"),
  'Relationship Coach must use the approved paid entitlement map.'
);
check(
  'premium AI raw tables are browser-private',
  premiumAiMigration.includes('revoke all on table public.ai_coach_conversations from anon, authenticated')
    && premiumAiMigration.includes('revoke all on table public.ai_coach_messages from anon, authenticated')
    && premiumAiMigration.includes('revoke all on table public.premium_ai_usage from anon, authenticated'),
  'Coach history and usage ledger must remain Edge-Function/server managed.'
);
check(
  'Relationship Coach has independent spend and membership kill switches',
  coachFunction.includes("Deno.env.get('PREMIUM_AI_ENABLED') !== 'true'")
    && coachFunction.includes("Deno.env.get('MEMBERSHIP_GATING_ENABLED') !== 'true'"),
  'Deploying code must not automatically create AI spend or premium access.'
);
check(
  'Relationship Coach verifies confirmed auth and server membership',
  coachFunction.includes('userClient.auth.getUser()')
    && coachFunction.includes('EMAIL_NOT_CONFIRMED')
    && coachFunction.includes(".from('member_subscriptions')")
    && coachFunction.includes("feature: 'relationship_coach'"),
  'Client routing alone must never grant premium AI access.'
);
check(
  'Relationship Coach limits model context to own recent coach messages',
  coachFunction.includes(".from('ai_coach_messages')")
    && coachFunction.includes(".eq('user_id', user.id)")
    && coachFunction.includes('.limit(20)')
    && !coachFunction.includes(".from('love_note_invitations')")
    && !coachFunction.includes(".from('messages')"),
  'Do not silently feed Love Notes, pairwise Chat, or unrelated account history to the model.'
);
check(
  'Relationship Coach disables OpenAI response storage',
  coachFunction.includes('store: false'),
  'Prepared premium AI requests should not use Responses API application-state storage.'
);
check(
  'Relationship Coach replays completed duplicate requests',
  coachFunction.includes("existing?.status === 'succeeded'")
    && coachFunction.includes('existing.result_text')
    && coachFunction.includes('idempotent: true')
    && coachFunction.includes('result_text: reply'),
  'Lost HTTP responses must not cause duplicate model spend.'
);
check(
  'Relationship Coach client carries explicit request IDs',
  coachService.includes('request_id: requestId || createRequestId()')
    && coachPage.includes('const requestId = newCoachRequestId()')
    && coachPage.includes('requestId }),'),
  'One deliberate submission must be retry-identifiable end to end.'
);
check(
  'Relationship Coach page no longer contains TODO fake AI handlers',
  !coachPage.includes('AI Coach feature requires implementation')
    && !coachPage.includes('TODO: Implement conversation')
    && coachPage.includes("useFeatureAccess('relationship_coach')"),
  'The relaunch page must connect to the staged secure service rather than simulate AI success.'
);

console.log('\nOne2OneLove private-feature relaunch check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
