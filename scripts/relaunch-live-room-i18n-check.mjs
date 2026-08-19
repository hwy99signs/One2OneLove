import fs from 'node:fs';

const file = 'src/pages/LiveRoom.jsx';
const source = fs.readFileSync(file, 'utf8');
const runtime = source.split('export default function LiveRoom()')[1] || '';
const failures = [];

const expectedHosts = {
  en: 'O2OL Host',
  es: 'Anfitrión O2OL',
  fr: 'Hôte O2OL',
  it: 'Host O2OL',
  de: 'O2OL-Host',
};
for (const [language, hostName] of Object.entries(expectedHosts)) {
  const row = `${language}: { hostName: '${hostName}'`;
  if (!source.includes(row)) failures.push(`${file}: missing ${language} localized O2OL host role.`);
}

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  const blockPattern = new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`);
  const match = source.match(blockPattern);
  if (!match) {
    failures.push(`${file}: missing ${language} Live Room copy block.`);
    continue;
  }
  for (const key of [
    'disclaimerTitle',
    'disclaimerText',
    'programmingLive',
    'programmingNext',
    'programmingLiveType',
    'programmingReplayType',
  ]) {
    if (!new RegExp(`\\b${key}:\\s*`).test(match[1])) failures.push(`${file}: ${language} is missing ${key}.`);
  }
}

for (const binding of [
  'aria-label={t.reactionAria(emoji)}',
  '<span className="font-black text-purple-950">{t.hostName}</span>',
  '<ReactionBar message={message} onReact={react} t={t} />',
  'toast.error(t.loadFailed)',
  'toast.error(t.sendError)',
  'toast.error(t.reportFailed)',
  '{t.disclaimerTitle}:',
  '{t.disclaimerText}',
  'CREATOR_PROGRAMMING_ENABLED && isAuthenticated',
  'getGlobalProgrammingStatus().catch(() => ({ enabled: false, current: null, next: null }))',
  '<ProgrammingStatus status={programmingStatus} locale={locale} t={t} />',
  'slot.content_mode === \'replay\' ? t.programmingReplayType : t.programmingLiveType',
]) {
  if (!source.includes(binding)) failures.push(`${file}: missing localized Live Room runtime binding ${binding}.`);
}

for (const forbidden of [
  'aria-label={`React ${emoji}`}',
  '>O2OL Host</span>',
  'toast.error(error?.message || t.loadFailed)',
  'toast.error(error?.message || t.sendError)',
  'toast.error(error?.message || t.reportFailed)',
  'creator_user_id',
  'replay_url',
  'price_cents',
  'payment_status',
]) {
  if (runtime.includes(forbidden)) failures.push(`${file}: forbidden raw/private runtime path remains (${forbidden}).`);
}

if (!source.includes("const REACTION_OPTIONS = ['❤️', '👍', '🤔'];")) {
  failures.push(`${file}: Live Room reactions must stay aligned to the database-supported reaction set.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Live Room multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Live Room host identity, reactions, disclaimer, now/next programming strip and member-facing failure states follow EN/ES/FR/IT/DE without private programming fields.');
