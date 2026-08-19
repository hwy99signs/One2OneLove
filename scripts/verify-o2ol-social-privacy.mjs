import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const languages = ['en', 'es', 'fr', 'it', 'de'];

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

const buddy = read('src/lib/buddyService.js');
requireText(buddy, "from('user_directory_profiles')", 'safe buddy directory reads');
rejectText(buddy, ".from('users')", 'buddy private-account reads');
rejectText(buddy, 'console.log', 'buddy personal-data debug logging');

const chat = read('src/lib/chatService.js');
requireText(chat, "from('user_directory_profiles')", 'safe chat directory identities');
rejectText(chat, ".from('users')", 'chat private-account reads');
rejectText(chat, '.getPublicUrl(', 'public chat attachment URL creation');
rejectText(chat, 'console.log', 'chat personal-data debug logging');

for (const file of ['src/pages/FindFriends.jsx', 'src/pages/FriendRequests.jsx']) {
  const content = read(file);
  for (const language of languages) requireText(content, `${language}:`, `${language} translation in ${file}`);
  rejectText(content, '.email', `member email rendering in ${file}`);
  rejectText(content, 'console.log', `personal-data debug logging in ${file}`);
}

const directorySql = read('supabase-user-directory-security.sql');
requireText(directorySql, 'user_directory_profiles', 'safe directory table');
requireText(directorySql, 'revoke all on table public.user_directory_profiles from anon, authenticated', 'directory grant reset');
requireText(directorySql, 'grant select on table public.user_directory_profiles to authenticated', 'authenticated safe-directory read');

const accountLockSql = read('supabase-user-account-read-lock.sql');
requireText(accountLockSql, 'users can read own account row', 'own-account read policy');
requireText(accountLockSql, '(select auth.uid()) = id', 'own-account identity check');

const chatStorageSql = read('supabase-chat-file-security.sql');
requireText(chatStorageSql, "values ('chat-files', 'chat-files', false)", 'private chat-files bucket');
requireText(chatStorageSql, 'chat participants can read referenced attachments', 'participant-only attachment reads');
requireText(chatStorageSql, 'users can upload own chat attachments', 'self-owned attachment upload');

if (failures.length) {
  console.error('\nO2OL social privacy verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL social privacy verification passed.');
