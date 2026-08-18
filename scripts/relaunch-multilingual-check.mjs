import fs from 'node:fs';

const ACTIVE_LANGUAGES = ['en', 'es', 'fr', 'it', 'de'];
const DISABLED_LANGUAGES = ['nl', 'pt'];

// These launch-facing surfaces must carry direct copy for every currently active
// One2OneLove language. Existing inactive draft blocks are harmless, but do not count as
// launch support and must not be switched on without an explicit rollout decision.
const requiredSurfaces = [
  'src/pages/LayoutRelaunch.jsx',
  'src/pages/Home.jsx',
  'src/pages/SignIn.jsx',
  'src/pages/SignUp.jsx',
  'src/components/signup/RegularUserRelaunchForm.jsx',
  'src/pages/AuthCallback.jsx',
  'src/pages/ForgotPassword.jsx',
  'src/pages/ResetPassword.jsx',
  'src/pages/LoveNotesHub.jsx',
  'src/pages/LoveNotesCollectionRelaunch.jsx',
  'src/pages/LoveNoteSendFlow.jsx',
  'src/pages/LoveNoteRevealFlow.jsx',
  'src/pages/SavedLoveNotes.jsx',
  'src/pages/DateIdeasRelaunchBrowse.jsx',
  'src/pages/LoveLanguageQuizRelaunch.jsx',
  'src/pages/ProfileRelaunchSafe.jsx',
  'src/pages/PrivacyCenter.jsx',
  'src/pages/FindFriendsRelaunch.jsx',
  'src/pages/FriendRequestsRelaunch.jsx',
  'src/pages/InviteRelaunch.jsx',
  'src/pages/HelpCenterRelaunch.jsx',
  'src/pages/PremiumFeatures.jsx',
  'src/pages/RelationshipGoalsRelaunch.jsx',
  'src/lib/chatCopy.js',
];

const centralizedChatSurfaces = [
  'src/pages/Chat.jsx',
  'src/components/chat/ChatWindow.jsx',
  'src/components/chat/ChatComposerRelaunch.jsx',
  'src/components/chat/ChatMessageRelaunch.jsx',
];

const failures = [];

const read = (file) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    failures.push(`${file}: could not be read (${error.message})`);
    return '';
  }
};

const layout = read('src/pages/LayoutRelaunch.jsx');

for (const language of ACTIVE_LANGUAGES) {
  const activePattern = new RegExp(`code:\\s*['\"]${language}['\"][^}]*active:\\s*true`);
  if (!activePattern.test(layout)) failures.push(`LayoutRelaunch.jsx: ${language} must remain an active One2OneLove language.`);
}

for (const language of DISABLED_LANGUAGES) {
  const disabledPattern = new RegExp(`code:\\s*['\"]${language}['\"][^}]*active:\\s*false`);
  if (!disabledPattern.test(layout)) failures.push(`LayoutRelaunch.jsx: ${language} must remain disabled until explicitly approved.`);
}

for (const file of requiredSurfaces) {
  const source = read(file);
  if (!source) continue;

  for (const language of ACTIVE_LANGUAGES) {
    const languageBlock = new RegExp(`(?:^|\\n)\\s*${language}:\\s*\\{`, 'm');
    if (!languageBlock.test(source)) failures.push(`${file}: missing ${language} translation block.`);
  }
}

for (const file of centralizedChatSurfaces) {
  const source = read(file);
  if (!source) continue;
  if (!source.includes('chatCopy') && !source.includes('getChatCopy')) {
    failures.push(`${file}: relaunch Chat surface must use the centralized five-language Chat copy.`);
  }
}

const home = read('src/pages/Home.jsx');
if (home && !/languages:\s*["']5 languages["']/.test(home)) {
  failures.push('Home.jsx: public language count must continue to state 5 languages.');
}

const chatCopy = read('src/lib/chatCopy.js');
for (const language of ACTIVE_LANGUAGES) {
  const languageBlock = new RegExp(`(?:^|\\n)\\s*${language}:\\s*\\{`, 'm');
  if (!languageBlock.test(chatCopy)) failures.push(`chatCopy.js: missing ${language} active Chat translation.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove multilingual relaunch check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('\nNew user-facing relaunch work must preserve English, Spanish, French, Italian, and German.\n');
  process.exit(1);
}

console.log('✅ Multilingual relaunch coverage passed for the five active languages (EN/ES/FR/IT/DE) across the core account, Love Notes, member, Chat and relationship-tool journey.');
