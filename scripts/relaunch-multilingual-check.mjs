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

const loveNotesHubRequiredKeys = [
  'fallbackMessage',
  'loveNoteLabel',
  'fromYou',
  'livePreview',
  'loveNotePreview',
  'steps',
];

const loveNoteSendRequiredKeys = [
  'defaultNote',
  'loveNoteLabel',
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

const assertActiveLanguageKeys = (source, file, keys) => {
  for (const language of ACTIVE_LANGUAGES) {
    const blockPattern = new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`);
    const match = source.match(blockPattern);
    if (!match) continue;

    for (const key of keys) {
      const keyPattern = new RegExp(`\\n\\s{4}${key}:`);
      if (!keyPattern.test(match[1])) failures.push(`${file}: ${language} is missing required translated UI key ${key}.`);
    }
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

const loveNotesHub = read('src/pages/LoveNotesHub.jsx');
assertActiveLanguageKeys(loveNotesHub, 'LoveNotesHub.jsx', loveNotesHubRequiredKeys);

const loveNotesHubRuntime = loveNotesHub.split('export default function LoveNotesHub()')[1] || '';
const requiredLoveNotesBindings = [
  't.fallbackMessage',
  't.loveNoteLabel',
  't.fromYou',
  't.livePreview',
  't.loveNotePreview',
  't.steps.map',
];
for (const binding of requiredLoveNotesBindings) {
  if (!loveNotesHubRuntime.includes(binding)) {
    failures.push(`LoveNotesHub.jsx: runtime UI must use ${binding} so the Love Notes experience follows the selected language.`);
  }
}

const forbiddenLoveNotesRuntimeLiterals = [
  '> Love Note</div>',
  '>— From you 💕</div>',
  '>Live preview</span>',
  '>Love Note preview</div>',
  '["1. Send", "2. Invite", "3. Reveal", "4. Reply / Save"].map',
];
for (const literal of forbiddenLoveNotesRuntimeLiterals) {
  if (loveNotesHubRuntime.includes(literal)) {
    failures.push(`LoveNotesHub.jsx: hard-coded English runtime copy remains (${literal}).`);
  }
}

const loveNoteSendFlow = read('src/pages/LoveNoteSendFlow.jsx');
assertActiveLanguageKeys(loveNoteSendFlow, 'LoveNoteSendFlow.jsx', loveNoteSendRequiredKeys);

const loveNoteSendRuntime = loveNoteSendFlow.split('export default function LoveNoteSendFlow()')[1] || '';
for (const binding of ['cleanDraft(t.defaultNote)', 't.defaultNote', 't.loveNoteLabel']) {
  if (!loveNoteSendRuntime.includes(binding)) {
    failures.push(`LoveNoteSendFlow.jsx: runtime must use ${binding} so default and preview copy follow the selected language.`);
  }
}

if (/const\s+DEFAULT_NOTE\s*=/.test(loveNoteSendFlow)) {
  failures.push('LoveNoteSendFlow.jsx: do not reintroduce a single hard-coded English DEFAULT_NOTE.');
}
if (loveNoteSendRuntime.includes('/> Love Note</div>')) {
  failures.push('LoveNoteSendFlow.jsx: sender preview must not hard-code the English “Love Note” label.');
}

const savedLoveNotes = read('src/pages/SavedLoveNotes.jsx');
assertActiveLanguageKeys(savedLoveNotes, 'SavedLoveNotes.jsx', ['noteFallback']);
const savedLoveNotesRuntime = savedLoveNotes.split('export default function SavedLoveNotes()')[1] || '';
if (!savedLoveNotesRuntime.includes('note.note_content || t.noteFallback')) {
  failures.push('SavedLoveNotes.jsx: empty saved-note content must use the selected-language fallback label.');
}
if (savedLoveNotesRuntime.includes('note.note_content || "Love Note"')) {
  failures.push('SavedLoveNotes.jsx: do not hard-code the English Love Note fallback in the saved library.');
}

const loveNotesCollection = read('src/pages/LoveNotesCollectionRelaunch.jsx');
assertActiveLanguageKeys(loveNotesCollection, 'LoveNotesCollectionRelaunch.jsx', ['draftTitle']);
const loveNotesCollectionRuntime = loveNotesCollection.split('export default function LoveNotesCollectionRelaunch()')[1] || '';
if (!loveNotesCollectionRuntime.includes('title: note?.title || t.draftTitle')) {
  failures.push('LoveNotesCollectionRelaunch.jsx: collection draft fallback title must follow the selected language.');
}
if (loveNotesCollectionRuntime.includes('title: note?.title || "Love Note"')) {
  failures.push('LoveNotesCollectionRelaunch.jsx: do not hard-code the English Love Note draft title.');
}

if (failures.length) {
  console.error('\n⛔ One2OneLove multilingual relaunch check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('\nNew user-facing relaunch work must preserve English, Spanish, French, Italian, and German.\n');
  process.exit(1);
}

console.log('✅ Multilingual relaunch coverage passed for the five active languages (EN/ES/FR/IT/DE) across the core account, Love Notes, member, Chat and relationship-tool journey.');
