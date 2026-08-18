import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  loveNoteSend: 'supabase/functions/send-love-note-invitation/index.ts',
  chatStorage: 'supabase/migrations/20260818_chat_attachment_privacy.sql',
  messageInsert: 'supabase/migrations/20260817_message_insert_hardening.sql',
  chatService: 'src/lib/chatService.js',
  membershipConfig: 'src/lib/membershipConfig.js',
};

for (const file of Object.values(files)) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const loveNoteSend = exists(files.loveNoteSend) ? read(files.loveNoteSend) : '';
const chatStorage = exists(files.chatStorage) ? read(files.chatStorage) : '';
const messageInsert = exists(files.messageInsert) ? read(files.messageInsert) : '';
const chatService = exists(files.chatService) ? read(files.chatService) : '';
const membershipConfig = exists(files.membershipConfig) ? read(files.membershipConfig) : '';

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
  'chat-files bucket is private',
  chatStorage.includes("values ('chat-files', 'chat-files', false")
    && chatStorage.includes('set public = false'),
  'Private chat attachments must not rely on public bucket URLs.'
);
check(
  'chat attachment read policy is participant-scoped',
  chatStorage.includes('O2OL chat participants can read attachments')
    && chatStorage.includes('auth.uid() in (c.user1_id, c.user2_id)'),
  'Only the two conversation participants may sign/read a new attachment.'
);
check(
  'chat attachment write path is sender-scoped',
  chatStorage.includes('(storage.foldername(name))[2] = auth.uid()::text')
    && chatStorage.includes('O2OL chat senders can upload attachments'),
  'A member may upload only to their own sender segment inside a conversation path.'
);
check(
  'legacy chat object compatibility remains participant-only',
  chatStorage.includes("m.file_url like ('%/object/public/chat-files/' || storage.objects.name)")
    && chatStorage.includes('auth.uid() in (m.sender_id, m.receiver_id)'),
  'Making the bucket private must not expose legacy objects or unnecessarily orphan participant history.'
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
  'Browser UX should reject oversized/unsupported files before upload; the database/storage rules remain authoritative.'
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

console.log('\nOne2OneLove private-feature relaunch check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
