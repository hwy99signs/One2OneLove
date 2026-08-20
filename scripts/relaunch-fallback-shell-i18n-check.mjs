import fs from 'node:fs';

const failures = [];
const surfaces = [
  ['src/pages/RelaunchUnavailable.jsx', ['title', 'body', 'home']],
  ['src/pages/NotFoundRelaunch.jsx', ['title', 'body', 'home']],
  ['src/pages/PremiumFeatureStaged.jsx', ['eyebrow', 'title', 'body', 'detail', 'back', 'membership']],
];

for (const [file, keys] of surfaces) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: missing shared relaunch shell.`);
    continue;
  }
  const source = fs.readFileSync(file, 'utf8');
  for (const language of ['en', 'es', 'fr', 'it', 'de']) {
    const block = source.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`));
    if (!block) {
      failures.push(`${file}: missing ${language} copy block.`);
      continue;
    }
    for (const key of keys) {
      if (!block[1].includes(`${key}:`)) failures.push(`${file}: ${language} copy missing ${key}.`);
    }
  }
  if (!source.includes('COPY[currentLanguage] || COPY.en')) {
    failures.push(`${file}: must render through selected-language copy with a safe English fallback.`);
  }
}

const router = fs.readFileSync('src/pages/index.jsx', 'utf8');
if (!router.includes('["*", NotFoundRelaunch]')) failures.push('src/pages/index.jsx: catch-all must remain routed to multilingual NotFoundRelaunch.');
for (const route of ['/Developer', '/WinACruise', '/ContactUs', '/Blog', '/Reviews', '/Suggestions', '/Leaderboard', '/Achievements']) {
  if (!router.includes(`["${route}", RelaunchUnavailable]`)) failures.push(`src/pages/index.jsx: ${route} must remain fenced through the multilingual unavailable shell.`);
}

if (failures.length) {
  console.error('\n⛔ Relaunch fallback-shell multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Not-found, fenced-route and staged-premium fallback shells remain multilingual across all active One2OneLove languages.');
