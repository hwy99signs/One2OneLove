import fs from 'node:fs';

const failures = [];
const surfaces = [
  {
    file: 'src/pages/CoupleSupportRelaunch.jsx',
    required: ['title', 'subtitle', 'search', 'noResults', 'note', 'free', 'membership', 'open'],
    forbidden: ['verified therapist directory', 'book a therapist now', '24/7 counseling'],
  },
  {
    file: 'src/pages/LGBTQSupportRelaunch.jsx',
    required: ['eyebrow', 'title', 'subtitle', 'body', 'safetyTitle', 'safety', 'community', 'notes', 'dates', 'help'],
    forbidden: ['verified therapist directory', 'legal advice service', '24/7 crisis network'],
  },
];

for (const surface of surfaces) {
  if (!fs.existsSync(surface.file)) {
    failures.push(`${surface.file}: missing reviewed relationship-support surface.`);
    continue;
  }
  const source = fs.readFileSync(surface.file, 'utf8');
  for (const language of ['en', 'es', 'fr', 'it', 'de']) {
    const block = source.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`));
    if (!block) {
      failures.push(`${surface.file}: missing ${language} translation block.`);
      continue;
    }
    for (const key of surface.required) {
      if (!block[1].includes(`${key}:`)) failures.push(`${surface.file}: ${language} copy missing ${key}.`);
    }
  }
  for (const phrase of surface.forbidden) {
    if (source.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`${surface.file}: contains unverified service claim: ${phrase}.`);
    }
  }
}

const coupleSupport = fs.readFileSync('src/pages/CoupleSupportRelaunch.jsx', 'utf8');
for (const required of [
  "path: '/Community'",
  "path: '/LoveLanguageQuiz'",
  "path: '/DateIdeas'",
  "path: '/HelpCenter'",
  "path: '/RelationshipCoach'",
  "path: '/RelationshipGoals'",
  't.items[item.key]',
]) {
  if (!coupleSupport.includes(required)) failures.push(`CoupleSupportRelaunch.jsx: missing reviewed tool binding ${required}.`);
}

const lgbtq = fs.readFileSync('src/pages/LGBTQSupportRelaunch.jsx', 'utf8');
for (const required of [
  'not therapy, legal advice, medical care or emergency services',
  'without pretending we currently operate a therapist directory',
  '<Link to="/Community">',
  '<Link to="/LoveNotes">',
  '<Link to="/DateIdeas">',
  '<Link to="/HelpCenter">',
]) {
  if (!lgbtq.includes(required)) failures.push(`LGBTQSupportRelaunch.jsx: missing relaunch truthfulness/navigation safeguard ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ Relationship support multilingual/truthfulness check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Relationship Support and LGBTQ+ Support remain multilingual, linked only to reviewed relaunch tools, and free of fabricated professional-service claims.');
