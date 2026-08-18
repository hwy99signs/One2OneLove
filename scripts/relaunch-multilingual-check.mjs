import fs from 'node:fs';

const ACTIVE_LANGUAGES = ['en', 'es', 'fr', 'it', 'de'];
const DISABLED_LANGUAGES = ['nl', 'pt'];

const requiredSurfaces = [
  'src/pages/LayoutRelaunch.jsx',
  'src/pages/Home.jsx',
  'src/pages/LoveNotesHub.jsx',
  'src/pages/DateIdeasRelaunchBrowse.jsx',
];

const failures = [];

const read = (file) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    failures.push(`${file}: could not be read (${error.message})`);
    return '';
  }
};

const layout = read('src/pages/LayoutRelaunch.jsx');

for (const language of ACTIVE_LANGUAGES) {
  const activePattern = new RegExp(`code:\\s*['\"]${language}['\"][^}]*active:\\s*true`);
  if (!activePattern.test(layout)) {
    failures.push(`LayoutRelaunch.jsx: ${language} must remain an active One2OneLove language.`);
  }
}

for (const language of DISABLED_LANGUAGES) {
  const disabledPattern = new RegExp(`code:\\s*['\"]${language}['\"][^}]*active:\\s*false`);
  if (!disabledPattern.test(layout)) {
    failures.push(`LayoutRelaunch.jsx: ${language} must remain disabled until explicitly approved.`);
  }
}

for (const file of requiredSurfaces) {
  const source = read(file);
  if (!source) continue;

  for (const language of ACTIVE_LANGUAGES) {
    const languageBlock = new RegExp(`(?:^|\\n)\\s*${language}:\\s*\\{`, 'm');
    if (!languageBlock.test(source)) {
      failures.push(`${file}: missing ${language} translation block.`);
    }
  }
}

const home = read('src/pages/Home.jsx');
if (home && !/languages:\s*["']5 languages["']/.test(home)) {
  failures.push('Home.jsx: public language count must continue to state 5 languages.');
}

if (failures.length) {
  console.error('\n⛔ One2OneLove multilingual relaunch check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('\nNew user-facing relaunch work must preserve English, Spanish, French, Italian, and German.\n');
  process.exit(1);
}

console.log('✅ Multilingual relaunch coverage passed for the five active languages (EN/ES/FR/IT/DE).');
