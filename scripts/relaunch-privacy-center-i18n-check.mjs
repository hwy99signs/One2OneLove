import fs from 'node:fs';

const file = 'src/pages/PrivacyCenter.jsx';
const source = fs.readFileSync(file, 'utf8');
const runtime = source.split('export default function PrivacyCenter()')[1] || '';
const failures = [];

const activeLocales = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };
for (const [language, locale] of Object.entries(activeLocales)) {
  const pattern = new RegExp(`${language}: \\{ locale: '${locale}'[^\\n]*requestTypes:[^\\n]*statuses:`);
  if (!pattern.test(source)) failures.push(`${file}: missing ${language} request-history translations/locale.`);
}

const required = [
  't.loadError',
  't.submitError',
  '{t.loading}',
  'requestTypeLabel(item.request_type, t)',
  'requestStatusLabel(item.status, t)',
  'toLocaleString(t.locale)',
  "baseCopy.privateText.replace('Love Notes', extras.loveNotesName)",
];
for (const binding of required) {
  if (!runtime.includes(binding) && !source.includes(binding)) failures.push(`${file}: missing localized runtime binding ${binding}.`);
}

const forbidden = [
  "'Unable to load privacy requests.'",
  "'Unable to submit privacy request.'",
  '>Loading…</div>',
  "type === 'account_deletion' ? 'Account deletion' : 'Data export'",
  'new Date(item.created_at).toLocaleString()',
  '>{item.status}</span>',
];
for (const literal of forbidden) {
  if (runtime.includes(literal)) failures.push(`${file}: English/browser-default privacy runtime remains (${literal}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Privacy Center multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Privacy Center request history, statuses, errors and timestamps follow EN/ES/FR/IT/DE.');
