import fs from 'node:fs';

const file = 'src/pages/PrivacyCenter.jsx';
const serviceFile = 'src/lib/privacyRequestService.js';
const source = fs.readFileSync(file, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
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

for (const requiredServiceBinding of [
  "const codedError = (code = 'PRIVACY_REQUEST_FAILED')",
  "throw codedError('AUTH_REQUIRED')",
  "throw codedError('EMAIL_CONFIRMATION_REQUIRED')",
  "throw codedError('REQUESTS_NOT_ENABLED')",
  "throw codedError('INVALID_REQUEST_TYPE')",
  'throw codedError(functionErrorCode(data, error))',
]) {
  if (!service.includes(requiredServiceBinding)) failures.push(`${serviceFile}: missing non-display error-code behavior ${requiredServiceBinding}.`);
}

for (const englishServiceMessage of [
  'Please sign in to manage account privacy requests.',
  'Please confirm your email first.',
  'Privacy request service is unavailable right now.',
  'Privacy request intake is not active yet.',
  'Privacy request could not be completed right now.',
  'Invalid privacy request type.',
]) {
  if (service.includes(englishServiceMessage)) failures.push(`${serviceFile}: English member-facing service error remains (${englishServiceMessage}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Privacy Center multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Privacy Center request history, statuses, errors and timestamps follow EN/ES/FR/IT/DE; privacy service errors remain language-neutral.');
