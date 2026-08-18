import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const couple = read('src/pages/CoupleSupportRelaunch.jsx');
const coupleAlias = read('src/pages/CoupleSupport.jsx');
const lgbtq = read('src/pages/LGBTQSupportRelaunch.jsx');
const lgbtqAlias = read('src/pages/LGBTQSupport.jsx');
const counseling = read('src/pages/CounselingSupport.jsx');
const articles = read('src/pages/ArticlesSupport.jsx');
const podcasts = read('src/pages/PodcastsSupport.jsx');
const influencers = read('src/pages/InfluencersSupport.jsx');

check('Relationship Support uses relaunch hub', coupleAlias.includes("./CoupleSupportRelaunch"), 'Legacy hub must not revive unreviewed expert-resource links.');
check('Relationship Support does not claim a professional marketplace', couple.includes('not presenting a therapist marketplace') && !couple.includes('licensed and verified professionals'), 'Professional directories require real verification and operations.');
check('Relationship Support links only reviewed core tools', ['/Community','/LoveLanguageQuiz','/DateIdeas','/HelpCenter','/RelationshipCoach','/RelationshipGoals'].every((path) => couple.includes(path)), 'Support hub should stay on reviewed relaunch paths.');
check('LGBTQ support uses reviewed inclusive page', lgbtqAlias.includes("./LGBTQSupportRelaunch"), 'Old specialized-resource page must not return through a legacy import.');
check('LGBTQ page has no hard-coded crisis numbers or fake therapist directory', !/1-8\d\d-\d{3}-\d{4}/.test(lgbtq) && !lgbtq.includes('Directory of LGBTQ+ affirming relationship therapists'), 'High-stakes resources must be current, location-aware and deliberately reviewed.');
check('LGBTQ page states AI/professional boundaries', lgbtq.includes('not therapy, legal advice, medical care or emergency services') && lgbtq.includes('appropriate qualified/local resources'), 'Inclusive support should not masquerade as professional care.');
for (const [name, content] of [['Counseling', counseling], ['Articles', articles], ['Podcasts', podcasts], ['Influencers', influencers]]) {
  check(`${name} legacy support route is fenced`, content.includes("export { default } from './RelaunchUnavailable'"), 'Unverified directory/editorial content should remain unavailable during beta.');
}

console.log('\nOne2OneLove relaunch support-safety check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name} — ${item.detail}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
