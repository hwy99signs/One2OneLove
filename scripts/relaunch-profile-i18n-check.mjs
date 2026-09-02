import fs from 'node:fs';

const file = 'src/pages/ProfileRelaunchSafe.jsx';
const source = fs.readFileSync(file, 'utf8');
const runtime = source.split('export default function ProfileRelaunchSafe()')[1] || '';
const failures = [];

const expected = {
  en: { locale: 'en-US', profileSetup: 'Profile setup', memberFallback: 'Member', loveNotes: 'Love Notes' },
  es: { locale: 'es-ES', profileSetup: 'Configuración del perfil', memberFallback: 'Miembro', loveNotes: 'Notas de Amor' },
  fr: { locale: 'fr-FR', profileSetup: 'Configuration du profil', memberFallback: 'Membre', loveNotes: 'Mots d’Amour' },
  it: { locale: 'it-IT', profileSetup: 'Configurazione del profilo', memberFallback: 'Membro', loveNotes: 'Note d’Amore' },
  de: { locale: 'de-DE', profileSetup: 'Profileinrichtung', memberFallback: 'Mitglied', loveNotes: 'Liebesnotizen' },
};

for (const [language, values] of Object.entries(expected)) {
  const entry = `  ${language}: { locale: '${values.locale}', profileSetup: '${values.profileSetup}', memberFallback: '${values.memberFallback}', actions: { loveNotes: '${values.loveNotes}' } }`;
  if (!source.includes(entry)) failures.push(`${file}: missing protected ${language} profile relaunch extras.`);
}

const requiredRuntimeBindings = [
  'user.name || t.memberFallback',
  '>{t.profileSetup}</span>',
  'formatDate(user.created_at, t.notSet, t.locale)',
  'formatDate(user.anniversary_date, t.notSet, t.locale)',
  't.actions[key]',
];
for (const binding of requiredRuntimeBindings) {
  if (!runtime.includes(binding)) failures.push(`${file}: runtime must use ${binding}.`);
}

const forbiddenRuntime = [
  '>Profile setup</span>',
  "user.name || 'Member'",
  'formatDate(user.created_at, t.notSet)',
  'formatDate(user.anniversary_date, t.notSet)',
];
for (const literal of forbiddenRuntime) {
  if (runtime.includes(literal)) failures.push(`${file}: hard-coded/non-localized profile runtime remains (${literal}).`);
}

if (!source.includes('date.toLocaleDateString(locale,')) {
  failures.push(`${file}: profile date helper must use the selected One2OneLove locale.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove profile multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Profile multilingual runtime passed for EN/ES/FR/IT/DE, including dates, accessibility fallback, setup label and Love Notes tool naming.');
