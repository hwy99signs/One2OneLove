import fs from 'node:fs';

const file = 'src/pages/RelationshipCoach.jsx';
const source = fs.readFileSync(file, 'utf8');
const failures = [];

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  const block = source.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`));
  if (!block) {
    failures.push(`${file}: missing ${language} Relationship Coach copy block.`);
    continue;
  }
  for (const key of [
    'signInBody',
    'signInButton',
    'deleteConfirm',
    'startFirst',
    'noConversations',
    'sessionTitle',
    'deleteAria',
    'privatePrefix',
    'thinking',
  ]) {
    if (!block[1].includes(`${key}:`)) failures.push(`${file}: ${language} copy missing ${key}.`);
  }
}

for (const required of [
  'window.confirm(t.deleteConfirm)',
  'setNotice(t.startFirst)',
  '{t.signInBody}',
  '{t.signInButton}',
  '{t.noConversations}',
  'conversation.title || t.sessionTitle',
  'aria-label={t.deleteAria}',
  '{t.privatePrefix} {t.note}',
  '{t.thinking}',
]) {
  if (!source.includes(required)) failures.push(`${file}: localized runtime binding missing ${required}.`);
}

for (const forbidden of [
  "window.confirm('Delete this coaching conversation?')",
  "setNotice('Start a conversation first.')",
  '>Sign in to use your private Relationship Coach conversations.<',
  '>Sign in<',
  '>No conversations yet.<',
  "conversation.title || 'Coaching Session'",
  'aria-label="Delete conversation"',
  '>Private to your account. {t.note}<',
  '> Thinking…<',
]) {
  if (source.includes(forbidden)) failures.push(`${file}: hard-coded English runtime string remains: ${forbidden}.`);
}

if (failures.length) {
  console.error('\n⛔ Relationship Coach multilingual runtime check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Relationship Coach signed-out, empty, confirmation, accessibility and sending states remain localized in all active languages.');
