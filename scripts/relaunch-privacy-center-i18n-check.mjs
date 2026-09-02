import fs from 'node:fs';

const file = 'src/pages/PrivacyCenter.jsx';
const serviceFile = 'src/lib/privacyRequestService.js';
const source = fs.readFileSync(file, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
const runtime = source.split('export default function PrivacyCenter()')[1] || '';
const failures = [];

const activeLocales = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };
for (const [language, locale] of Object.entries(activeLocales)) {
  const pattern = new RegExp(`${language}: \\{ locale: '${locale}'[^\\n]*requestTypes:[^\\n]*statuses:[^\\n]*awaiting_fulfillment:`);
  if (!pattern.test(source)) failures.push(`${file}: missing ${language} awaiting-fulfillment request-history translation/locale.`);
}

for (const required of [
  't.loadError',
  't.submitError',
  '{t.loading}',
  'requestTypeLabel(item.request_type, t)',
  'requestStatusLabel(item.status, t)',
  'toLocaleString(t.locale)',
  "baseCopy.privateText.replace('Love Notes', extras.loveNotesName)",
  "['submitted', 'in_review', 'awaiting_fulfillment'].includes(item.status)",
]) {
  if (!runtime.includes(required) && !source.includes(required)) failures.push(`${file}: missing localized/runtime privacy binding ${required}.`);
}

for (const forbidden of [
  "'Unable to load privacy requests.'",
  "'Unable to submit privacy request.'",
  '>Loading…</div>',
  "type === 'account_deletion' ? 'Account deletion' : 'Data export'",
  'new Date(item.created_at).toLocaleString()',
  '>{item.status}</span>',
]) {
  if (runtime.includes(forbidden)) failures.push(`${file}: English/browser-default privacy runtime remains (${forbidden}).`);
}

for (const language of Object.keys(activeLocales)) {
  const line = source.split('\n').find((candidate) => candidate.trimStart().startsWith(`${language}: { locale:`)) || '';
  if (line.includes("completed: '")) {
    failures.push(`${file}: active ${language} history still labels a review-only state as completed.`);
  }
  if (!line.includes("awaiting_fulfillment: '")) {
    failures.push(`${file}: active ${language} history must explicitly label awaiting_fulfillment.`);
  }
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

console.log('✅ Privacy Center request history, awaiting-fulfillment state, errors and timestamps follow EN/ES/FR/IT/DE; review never presents itself as fulfillment.');
