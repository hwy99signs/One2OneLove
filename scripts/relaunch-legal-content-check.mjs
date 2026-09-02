import fs from 'node:fs';

const failures = [];
const termsFile = 'src/pages/TermsOfService.jsx';
const privacyFile = 'src/pages/PrivacyPolicy.jsx';
const pendingShellFile = 'src/pages/LegalPolicyPending.jsx';
const approvalFile = 'docs/RELAUNCH_LEGAL_APPROVAL.md';
const pendingAlias = "export { default } from './LegalPolicyPending';";

for (const file of [termsFile, privacyFile, pendingShellFile, approvalFile]) {
  if (!fs.existsSync(file)) failures.push(`${file}: required legal/release file is missing.`);
}

const terms = fs.existsSync(termsFile) ? fs.readFileSync(termsFile, 'utf8').trim() : '';
const privacy = fs.existsSync(privacyFile) ? fs.readFileSync(privacyFile, 'utf8').trim() : '';
const pendingShell = fs.existsSync(pendingShellFile) ? fs.readFileSync(pendingShellFile, 'utf8') : '';
const approval = fs.existsSync(approvalFile) ? fs.readFileSync(approvalFile, 'utf8') : '';
const isPending = approval.includes('Status: **PENDING');
const isApproved = approval.includes('Status: **APPROVED**');

if (!isPending && !isApproved) {
  failures.push(`${approvalFile}: legal checkpoint must be explicitly PENDING or APPROVED.`);
}

if (isPending) {
  if (terms !== pendingAlias) failures.push(`${termsFile}: while legal review is PENDING, stale/draft Terms must remain fenced behind LegalPolicyPending.`);
  if (privacy !== pendingAlias) failures.push(`${privacyFile}: while legal review is PENDING, stale/draft Privacy Policy must remain fenced behind LegalPolicyPending.`);

  for (const language of ['en', 'es', 'fr', 'it', 'de']) {
    const block = pendingShell.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`));
    if (!block) {
      failures.push(`${pendingShellFile}: missing ${language} pending-legal copy.`);
      continue;
    }
    for (const key of ['termsTitle', 'privacyTitle', 'body', 'detail', 'back', 'badge']) {
      if (!block[1].includes(`${key}:`)) failures.push(`${pendingShellFile}: ${language} pending-legal copy missing ${key}.`);
    }
  }

  for (const required of [
    "const isPrivacy = pathname.toLowerCase().includes('privacy')",
    'isPrivacy ? t.privacyTitle : t.termsTitle',
    '{t.body}',
    '{t.detail}',
    '<Link to="/Home">',
  ]) {
    if (!pendingShell.includes(required)) failures.push(`${pendingShellFile}: missing safe pending-review behavior ${required}.`);
  }

  if (failures.length) {
    console.error('\n⛔ Relaunch pending legal-content check failed:');
    failures.forEach((failure) => console.error(` - ${failure}`));
    process.exit(1);
  }

  console.log('✅ Legal review is still PENDING, so stale policy text remains hidden behind the multilingual pending-review shell.');
  process.exit(0);
}

// APPROVED state: an approval flag is not enough. The real policy pages must replace the
// pending shell and describe the actual relaunch product before production may proceed.
if (terms === pendingAlias) failures.push(`${termsFile}: approved legal state must replace the pending shell with final Terms.`);
if (privacy === pendingAlias) failures.push(`${privacyFile}: approved legal state must replace the pending shell with the final Privacy Policy.`);

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

if (failures.length) {
  console.error('\n⛔ Relaunch approved legal-content check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('The approval flag cannot override missing, stale or incomplete final policy content.');
  process.exit(1);
}

console.log('✅ Approved relaunch legal pages contain required current product concepts and no stale November 2025 markers.');
