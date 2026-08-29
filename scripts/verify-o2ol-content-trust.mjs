import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const languages = ['en', 'es', 'fr', 'it', 'de'];
const files = [
  'src/pages/WinACruise.jsx',
  'src/pages/CounselingSupport.jsx',
  'src/pages/PodcastsSupport.jsx',
  'src/pages/InfluencersSupport.jsx',
  'src/pages/ArticlesSupport.jsx',
];

function read(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing trust-sensitive page: ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

const source = Object.fromEntries(files.map((file) => [file, read(file)]));

for (const [file, content] of Object.entries(source)) {
  for (const language of languages) {
    if (!content.includes(`${language}:`)) failures.push(`${file} missing ${language} translation`);
  }
  if (/console\.(log|warn|error|debug|info|trace)/.test(content)) {
    failures.push(`${file} must not emit trust-sensitive diagnostics to the browser console`);
  }
}

const promotions = source['src/pages/WinACruise.jsx'];
for (const phrase of ['no active One2OneLove prize', 'official eligibility', '/GlobalRelationshipRoom', '/CouplesChallenges']) {
  if (!promotions.includes(phrase)) failures.push(`Promotions page missing truth safeguard: ${phrase}`);
}
for (const pattern of [/\$5,?000/i, /Start Competing/i, /contestants/i, /monthly standings/i, /enter contest/i]) {
  if (pattern.test(promotions)) failures.push(`Promotions page restored inactive contest claim: ${pattern}`);
}

const counseling = source['src/pages/CounselingSupport.jsx'];
for (const phrase of ['does not currently operate a verified therapist directory', 'not a substitute for therapy', '/CommunicationPractice', '/RelationshipLibrary']) {
  if (!counseling.includes(phrase)) failures.push(`Counseling page missing limitation or real route: ${phrase}`);
}
for (const pattern of [/Dr\. Sarah/i, /Book Session/i, /per session/i, /reviews?:\s*[0-9]/i, /rating:\s*[0-9]/i]) {
  if (pattern.test(counseling)) failures.push(`Counseling page restored fabricated provider claim: ${pattern}`);
}

const podcasts = source['src/pages/PodcastsSupport.jsx'];
for (const phrase of ['does not currently maintain a verified third-party podcast catalog', '/O2OLShow', '/GlobalRelationshipRoom']) {
  if (!podcasts.includes(phrase)) failures.push(`Podcast page missing trust safeguard: ${phrase}`);
}
for (const pattern of [/episodes:\s*[0-9]/i, /rating:\s*[0-9]/i, /Listen Now/i, /Subscribe to Our Podcast Newsletter/i]) {
  if (pattern.test(podcasts)) failures.push(`Podcast page restored unverified catalog claim: ${pattern}`);
}

const influencers = source['src/pages/InfluencersSupport.jsx'];
for (const phrase of ['does not currently publish a verified influencer directory', '/RoomCreatorAccess', '/GlobalRelationshipRoom']) {
  if (!influencers.includes(phrase)) failures.push(`Influencer page missing trust safeguard: ${phrase}`);
}
for (const pattern of [/followers:\s*['"][0-9]/i, /Dr\. Sarah/i, /@relationship/i, /Follow\s*<|>Follow</i]) {
  if (pattern.test(influencers)) failures.push(`Influencer page restored fabricated creator claim: ${pattern}`);
}

const articles = source['src/pages/ArticlesSupport.jsx'];
for (const phrase of ['does not currently publish the legacy article catalog', '/RelationshipLibrary', '/MarriageMatters', '/DailyQuestion']) {
  if (!articles.includes(phrase)) failures.push(`Articles page missing trust safeguard: ${phrase}`);
}
for (const pattern of [/author:\s*['"]/i, /readTime:/i, /publishedAt:/i, /newsletter/i, /Subscribe/i]) {
  if (pattern.test(articles) && !/newsletter-subscription claims|newsletter non funzionante|Newsletter-Behauptungen/.test(articles)) {
    failures.push(`Articles page restored fabricated publication/subscription behavior: ${pattern}`);
  }
}

if (failures.length) {
  console.error('\nO2OL content trust verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL content trust verification passed.');
