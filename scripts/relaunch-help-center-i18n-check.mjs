import fs from 'node:fs';

const file = 'src/pages/HelpCenterRelaunch.jsx';
const source = fs.readFileSync(file, 'utf8');
const runtime = source.split('export default function HelpCenterRelaunch()')[1] || '';
const failures = [];

const activeTerms = {
  es: ['Notas de Amor', 'Comunidad en Vivo', 'Anfitrión de IA', 'Ideas para Citas', 'Metas de Relación'],
  fr: ['Mots d’Amour', 'Communauté en Direct', 'Hôte IA', 'Idées de Rendez-vous', 'Objectifs de Relation'],
  it: ['Note d’Amore', 'Community dal Vivo', 'Host IA', 'Idee per Appuntamenti', 'Obiettivi di Relazione'],
  de: ['Liebesnotizen', 'Live-Community', 'KI-Host', 'Date-Ideen', 'Beziehungsziele'],
};

for (const [language, terms] of Object.entries(activeTerms)) {
  if (!source.includes(`${language}: [`)) failures.push(`${file}: missing ${language} feature-term localization map.`);
  for (const term of terms) {
    if (!source.includes(term)) failures.push(`${file}: ${language} feature-term map is missing ${term}.`);
  }
}

for (const binding of [
  'localizeFeatureTerms(COPY[language], FEATURE_TERMS[language] || [])',
  'aria-expanded={open}',
  'aria-label={`${open ? t.close : t.open}: ${row.question}`}',
]) {
  if (!runtime.includes(binding)) failures.push(`${file}: missing multilingual/accessibility runtime binding ${binding}.`);
}

if (runtime.includes('const t = COPY[currentLanguage] || COPY.en')) {
  failures.push(`${file}: Help Center must pass translated copy through the feature-term localization layer.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Help Center multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Help Center feature naming and FAQ accessibility follow the selected One2OneLove language.');
