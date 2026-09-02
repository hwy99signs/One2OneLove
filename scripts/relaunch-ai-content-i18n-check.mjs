import fs from 'node:fs';

const file = 'src/pages/AIContentCreator.jsx';
const source = fs.readFileSync(file, 'utf8');
const failures = [];

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  const block = source.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`));
  if (!block) {
    failures.push(`${file}: missing ${language} translation block.`);
    continue;
  }
  for (const key of ['safetyNote', 'emptyResult', 'recovered', 'staged', 'membership', 'selectFirst']) {
    if (!block[1].includes(`${key}:`)) failures.push(`${file}: ${language} copy missing ${key}.`);
  }
}

for (const required of [
  'toast.success(t.recovered)',
  '{t.safetyNote}',
  '{t.emptyResult}',
  'toast.error(t.selectFirst)',
  'language, requestId',
]) {
  if (!source.includes(required)) failures.push(`${file}: localized runtime binding missing ${required}.`);
}

for (const forbidden of [
  "toast.success('Recovered your completed draft.')",
  '>AI drafts are suggestions, not facts about your relationship. Review anything personal before using it.<',
  '>Your generated draft will appear here. Nothing is automatically sent to anyone.<',
]) {
  if (source.includes(forbidden)) failures.push(`${file}: hard-coded English runtime copy remains: ${forbidden}.`);
}

if (failures.length) {
  console.error('\n⛔ AI Content Creator multilingual runtime check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ AI Content Creator safety, recovery, empty-result and generation states remain localized in all active languages.');
