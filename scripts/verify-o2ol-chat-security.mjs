import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const read = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
};

const requireText = (content, text, label) => {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

const rejectText = (content, text, label) => {
  if (content.includes(text)) failures.push(`Unsafe ${label}: ${text}`);
};

const sql = read('supabase-chat-table-security.sql');
requireText(sql, 'message participants can read messages', 'message participant SELECT RLS');
requireText(sql, 'senders can create conversation messages', 'sender-only message INSERT RLS');
requireText(sql, 'protect_message_participant_fields', 'message field protection trigger');
requireText(sql, 'new.sender_id := v_actor', 'server-enforced message sender');
requireText(sql, 'conversation recipient mismatch', 'conversation recipient validation');
requireText(sql, 'revoke delete on table public.messages from authenticated', 'soft-delete-only browser message rule');
requireText(sql, 'conversation participants can read conversations', 'conversation participant SELECT RLS');
requireText(sql, 'protect_conversation_participant_fields', 'conversation field protection trigger');
requireText(sql, 'revoke insert, delete on table public.conversations from authenticated', 'RPC-only conversation creation');

const chat = read('src/lib/chatService.js');
requireText(chat, 'assertConversationParticipant', 'client participant check');
requireText(chat, 'expectedReceiver', 'client recipient validation');
rejectText(chat, ".from('users')", 'private account identity reads');

const rpcSql = read('supabase-legacy-api-security.sql');
requireText(rpcSql, 'get_or_create_conversation', 'trusted conversation RPC');
requireText(rpcSql, 'v_actor not in (p_user1_id, p_user2_id)', 'conversation RPC actor check');
requireText(rpcSql, 'receiver_id = auth.uid()', 'message receipt RPC receiver check');

if (failures.length) {
  console.error('\nO2OL chat security verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL chat security verification passed.');
