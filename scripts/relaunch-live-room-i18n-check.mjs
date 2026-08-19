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

for (const binding of [
  'aria-label={t.reactionAria(emoji)}',
  '<span className="font-black text-purple-950">{t.hostName}</span>',
  '<ReactionBar message={message} onReact={react} t={t} />',
  'toast.error(t.loadFailed)',
  'toast.error(t.sendError)',
  'toast.error(t.reportFailed)',
]) {
  if (!source.includes(binding)) failures.push(`${file}: missing localized Live Room runtime binding ${binding}.`);
}

for (const forbidden of [
  'aria-label={`React ${emoji}`}',
  '>O2OL Host</span>',
  'toast.error(error?.message || t.loadFailed)',
  'toast.error(error?.message || t.sendError)',
  'toast.error(error?.message || t.reportFailed)',
]) {
  if (runtime.includes(forbidden) || source.includes(forbidden)) failures.push(`${file}: English/raw runtime path remains (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Live Room multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Live Room host identity, reaction accessibility and member-facing failure states follow EN/ES/FR/IT/DE.');
