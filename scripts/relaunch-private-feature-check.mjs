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
  chatPage: 'src/pages/Chat.jsx',
  chatList: 'src/components/chat/ChatList.jsx',
  chatWindow: 'src/components/chat/ChatWindow.jsx',
  chatMessage: 'src/components/chat/ChatMessageRelaunch.jsx',
  chatComposer: 'src/components/chat/ChatComposerRelaunch.jsx',
  buildChecks: 'scripts/relaunch-build-checks.mjs',
  packageJson: 'package.json',
  membershipConfig: 'src/lib/membershipConfig.js',
  premiumAiMigration: 'supabase/migrations/20260818_premium_ai_tools.sql',
  coachFunction: 'supabase/functions/relationship-coach/index.ts',
  coachService: 'src/lib/relationshipCoachService.js',
  coachPage: 'src/pages/RelationshipCoach.jsx',
};

for (const file of Object.values(files)) check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, exists(file) ? read(file) : '']));

check('Love Note scheduling is membership-only while send-now stays available',
  source.membershipConfig.includes("love_note_scheduling: 'membership'")
  && source.loveNoteSend.includes("Deno.env.get('MEMBERSHIP_GATING_ENABLED')")
  && source.loveNoteSend.includes("feature: 'love_note_scheduling'")
  && source.loveNoteSend.includes('if (scheduledRaw)')
  && source.loveNoteFlow.includes('useFeatureAccess("love_note_scheduling")')
  && source.loveNoteFlow.includes('onClick={() => setDeliveryTime("now")}'),
  'Instant Love Notes remain free; scheduled delivery stays server-gated by membership.');

check('Love Note upgrade/auth redirects preserve the draft',
  source.loveNoteFlow.includes('stashCurrent(2)')
  && source.loveNoteFlow.includes('navigate("/Subscription")')
  && source.loveNoteFlow.includes('setDeliveryTime("now")'),
  'A sign-in/upgrade path must not erase the Love Note or leave a stale locked schedule.');

check('chat-files storage is private, bounded and participant-scoped',
  source.chatStorage.includes("'chat-files',\n  'chat-files',\n  false")
  && source.chatStorage.includes('10485760')
  && source.chatStorage.includes('allowed_mime_types')
  && source.chatStorage.includes('as restrictive')
  && source.chatStorage.includes('coalesce(m.is_deleted, false) = false')
  && source.chatStorage.includes('(storage.foldername(name))[2] = auth.uid()::text'),
  'Private attachments require storage-level privacy, size/type limits and participant/sender boundaries.');

check('chat messages store private object keys rather than permanent URLs',
  source.messageInsert.includes("position('://' in new.file_url) > 0")
  && source.chatService.includes('.createSignedUrls(')
  && source.chatService.includes('CHAT_SIGNED_URL_TTL_SECONDS = 15 * 60')
  && source.chatService.includes('file_url: filePath')
  && !source.chatService.includes('.getPublicUrl('),
  'Private attachments must use short-lived signed reads and stored object keys.');

check('chat client cleans failed uploads and limits attachment types/sizes',
  source.chatService.includes('.remove([uploadedPath])')
  && source.chatService.includes('CHAT_FILE_MAX_BYTES = 10 * 1024 * 1024')
  && source.chatService.includes('SAFE_IMAGE_MIME_TYPES')
  && source.chatService.includes('SAFE_FILE_MIME_TYPES'),
  'Failed message inserts must not leave orphaned private files.');

check('conversation deletion remains member-local archive and recipient unread is database-owned',
  source.chatService.includes("return updateConversationSettings(conversationId, { isArchived: true })")
  && !/sendMessage[\s\S]{0,2500}p_user_id:\s*receiverId/.test(source.chatService),
  'One member cannot delete shared history or recalculate another member unread state.');

check('relaunch Chat exposes only real, persisted actions',
  !source.chatPage.includes('CallWindow')
  && !source.chatPage.includes('currentCall')
  && !source.chatPage.includes('onVideoCall=')
  && !source.chatPage.includes('onMarkAsUnread=')
  && source.chatPage.includes('onArchive={handleArchive}')
  && source.chatPage.includes('onPin={handlePin}')
  && source.chatPage.includes('onUnpin={handleUnpin}'),
  'Prototype calling/fake state must stay out of the relaunch Chat surface.');

check('relaunch message menu omits fake state and private-link sharing',
  !source.chatMessage.includes('Forward')
  && !source.chatMessage.includes('Star')
  && !source.chatMessage.includes('Share2')
  && !source.chatMessage.includes('onReact')
  && !source.chatMessage.includes('navigator.share')
  && source.chatMessage.includes('onDelete')
  && source.chatMessage.includes('t.deleteMessage'),
  'Only real Copy/Edit/Delete behavior may appear; signed attachment links must not be shared.');

check('chat attachments and location remain explicit default-off features',
  source.chatComposer.includes("VITE_CHAT_ATTACHMENTS_ENABLED === 'true'")
  && source.chatComposer.includes("VITE_CHAT_LOCATION_ENABLED === 'true'")
  && source.chatComposer.includes("sendSelectedFile(event, 'file')")
  && source.chatComposer.includes("onSendFile(voiceFileFromBlob(blob), 'voice', duration)"),
  'Text Chat remains the safe baseline until separate media/location activation.');

check('preview policy checks still reach Vite while explicit preflight remains strict',
  source.buildChecks.includes("vercelEnvironment === 'production'")
  && source.buildChecks.includes("process.argv.includes('--strict')")
  && source.buildChecks.includes('PREVIEW/ADVISORY')
  && source.packageJson.includes('node scripts/relaunch-build-checks.mjs && vite build')
  && source.packageJson.includes('node scripts/relaunch-build-checks.mjs --strict'),
  'Preview may compile with policy holds; production must keep deterministic strict gating.');

check('Relationship Coach is paid and raw AI history remains browser-private',
  source.membershipConfig.includes("relationship_coach: 'membership'")
  && source.premiumAiMigration.includes('revoke all on table public.ai_coach_conversations from anon, authenticated')
  && source.premiumAiMigration.includes('revoke all on table public.ai_coach_messages from anon, authenticated')
  && source.premiumAiMigration.includes('revoke all on table public.premium_ai_usage from anon, authenticated'),
  'Coach history/usage stay server managed behind the approved paid entitlement.');

check('Relationship Coach has independent spend, membership and confirmed-auth gates',
  source.coachFunction.includes("Deno.env.get('PREMIUM_AI_ENABLED') !== 'true'")
  && source.coachFunction.includes("Deno.env.get('MEMBERSHIP_GATING_ENABLED') !== 'true'")
  && source.coachFunction.includes('userClient.auth.getUser()')
  && source.coachFunction.includes('EMAIL_NOT_CONFIRMED')
  && source.coachFunction.includes(".from('member_subscriptions')"),
  'Deploying code must not automatically enable premium AI spend or access.');

check('Relationship Coach context is own limited coach history and OpenAI storage is off',
  source.coachFunction.includes(".from('ai_coach_messages')")
  && source.coachFunction.includes(".eq('user_id', user.id)")
  && source.coachFunction.includes('.limit(20)')
  && !source.coachFunction.includes(".from('love_note_invitations')")
  && source.coachFunction.includes('store: false'),
  'Do not feed unrelated private history or enable provider application-state storage.');

check('Relationship Coach retries are explicitly request-identifiable end to end',
  source.coachFunction.includes("existing?.status === 'succeeded'")
  && source.coachFunction.includes('idempotent: true')
  && source.coachService.includes('request_id: requestId || createRequestId()')
  && source.coachPage.includes('const requestId = newCoachRequestId()')
  && /sendCoachMessage\(\{[^}]*requestId[^}]*\}\)/s.test(source.coachPage),
  'One deliberate submission must keep a stable request ID so ambiguous retries do not duplicate model spend.');

check('Relationship Coach page is real gated service UI rather than a TODO simulation',
  !source.coachPage.includes('AI Coach feature requires implementation')
  && !source.coachPage.includes('TODO: Implement conversation')
  && source.coachPage.includes("useFeatureAccess('relationship_coach')"),
  'The relaunch page must connect to the staged secure service rather than simulate success.');

console.log('\nOne2OneLove private-feature relaunch check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
