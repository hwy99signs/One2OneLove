import fs from 'node:fs';

const file = 'src/pages/LayoutRelaunch.jsx';
const source = fs.readFileSync(file, 'utf8');
const failures = [];

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  const block = source.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`));
  if (!block) {
    failures.push(`${file}: missing ${language} navigation copy.`);
    continue;
  }
  for (const key of ['homeAria', 'languageAria', 'menuAria']) {
    if (!block[1].includes(`${key}:`)) failures.push(`${file}: ${language} navigation copy missing ${key}.`);
  }
}

for (const required of [
  'aria-label={t.homeAria}',
  'aria-label={t.languageAria}',
  'aria-label={t.menuAria}',
  "{ code: 'es', name: 'Español'",
  "{ code: 'fr', name: 'Français'",
  "{ code: 'it', name: 'Italiano'",
  "{ code: 'de', name: 'Deutsch'",
]) {
  if (!source.includes(required)) failures.push(`${file}: missing multilingual navigation/accessibility binding ${required}.`);
}

for (const forbidden of ['aria-label="One2OneLove home"', 'aria-label="Language"', 'aria-label="Menu"']) {
  if (source.includes(forbidden)) failures.push(`${file}: hard-coded English accessibility label remains: ${forbidden}.`);
}

if (failures.length) {
  console.error('\n⛔ Relaunch layout accessibility multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Relaunch header navigation, language picker and screen-reader labels remain localized across all active languages.');
