import fs from 'node:fs';

const file = 'src/pages/RelationshipCoach.jsx';
const serviceFile = 'src/lib/relationshipCoachService.js';
const source = fs.readFileSync(file, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
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

for (const required of [
  "en: 'Coaching Session'",
  "es: 'Sesión de coaching'",
  "fr: 'Session de coaching'",
  "it: 'Sessione di coaching'",
  "de: 'Coaching-Sitzung'",
  "const localizedTitle = clean(title, 120) || DEFAULT_TITLES[languageKey]",
  "empty.code = 'MESSAGE_REQUIRED'",
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing localized/service-safe Coach behavior ${required}.`);
}
if (service.includes("title = 'Coaching Session'")) {
  failures.push(`${serviceFile}: do not persist an English-only default title for every language.`);
}
if (service.includes("throw new Error('Type a message first.')")) {
  failures.push(`${serviceFile}: service layer must return a machine code rather than English-only member copy.`);
}

if (failures.length) {
  console.error('\n⛔ Relationship Coach multilingual runtime check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Relationship Coach runtime and service defaults remain localized in all active languages without English-only transport copy.');
