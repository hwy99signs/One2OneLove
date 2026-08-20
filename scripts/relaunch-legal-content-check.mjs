import fs from 'node:fs';

const failures = [];
const termsFile = 'src/pages/TermsOfService.jsx';
const privacyFile = 'src/pages/PrivacyPolicy.jsx';
const approvalFile = 'docs/RELAUNCH_LEGAL_APPROVAL.md';

for (const file of [termsFile, privacyFile, approvalFile]) {
  if (!fs.existsSync(file)) failures.push(`${file}: required legal/release file is missing.`);
}

const terms = fs.existsSync(termsFile) ? fs.readFileSync(termsFile, 'utf8') : '';
const privacy = fs.existsSync(privacyFile) ? fs.readFileSync(privacyFile, 'utf8') : '';
const approval = fs.existsSync(approvalFile) ? fs.readFileSync(approvalFile, 'utf8') : '';

const legacyMarkers = [
  'Last Updated: November 15, 2025',
  'Última Actualización: 15 de Noviembre de 2025',
  'Dernière Mise à Jour: 15 Novembre 2025',
  'Ultimo Aggiornamento: 15 Novembre 2025',
  'Letzte Aktualisierung: 15. November 2025',
];

for (const marker of legacyMarkers) {
  if (terms.includes(marker)) failures.push(`${termsFile}: stale legacy date remains: ${marker}.`);
  if (privacy.includes(marker)) failures.push(`${privacyFile}: stale legacy date remains: ${marker}.`);
}

const requiredTermsConcepts = [
  ['community/creator content', ['creator', 'community']],
  ['AI limitations', ['AI', 'therapy']],
  ['membership/billing', ['membership', 'billing']],
  ['moderation/account enforcement', ['moderation', 'suspend']],
  ['private-content treatment', ['private', 'Love Note']],
];
for (const [label, words] of requiredTermsConcepts) {
  if (!words.every((word) => terms.toLowerCase().includes(word.toLowerCase()))) {
    failures.push(`${termsFile}: final relaunch terms must address ${label}.`);
  }
}

const requiredPrivacyConcepts = [
  ['Love Note/contact processing', ['Love Note', 'recipient']],
  ['private chat/content', ['private', 'chat']],
  ['community/moderation', ['community', 'moderation']],
  ['AI processing', ['AI', 'OpenAI']],
  ['billing processor', ['Stripe']],
  ['infrastructure/processors', ['Supabase', 'Vercel']],
  ['member privacy controls', ['delete', 'privacy']],
];
for (const [label, words] of requiredPrivacyConcepts) {
  if (!words.every((word) => privacy.toLowerCase().includes(word.toLowerCase()))) {
    failures.push(`${privacyFile}: final relaunch privacy policy must address ${label}.`);
  }
}

if (!approval.includes('Status: **PENDING')) {
  // Approval is not sufficient by itself: stale/incomplete content must still block.
  if (failures.length) failures.push(`${approvalFile}: legal status must not be APPROVED while relaunch policy-content blockers remain.`);
}

if (failures.length) {
  console.error('\n⛔ Relaunch legal content check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('Final production legal copy still requires owner/legal review; development may continue while strict production preflight remains blocked.');
  process.exit(1);
}

console.log('✅ Relaunch legal pages contain the required current product concepts and no stale November 2025 markers.');
