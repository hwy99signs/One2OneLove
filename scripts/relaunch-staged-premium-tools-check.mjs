import fs from 'node:fs';

const failures = [];
const stagedAlias = "export { default } from './PremiumFeatureStaged';";
const stagedFiles = [
  'src/pages/MemoryLane.jsx',
  'src/pages/RelationshipMilestones.jsx',
  'src/pages/Meditation.jsx',
  'src/pages/CommunicationPractice.jsx',
  'src/pages/CoupleActivities.jsx',
  'src/pages/SharedJournals.jsx',
  'src/pages/CooperativeGames.jsx',
  'src/pages/CouplesDashboard.jsx',
  'src/pages/CouplesCalendar.jsx',
  'src/pages/RelationshipQuizzes.jsx',
  'src/pages/AnniversaryTracker.jsx',
];

for (const file of stagedFiles) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: missing staged premium route alias.`);
    continue;
  }
  const source = fs.readFileSync(file, 'utf8').trim();
  if (source !== stagedAlias) {
    failures.push(`${file}: unreviewed premium tool must remain routed through PremiumFeatureStaged until its private-data, multilingual and entitlement review is complete.`);
  }
}

const stagedPage = 'src/pages/PremiumFeatureStaged.jsx';
if (!fs.existsSync(stagedPage)) {
  failures.push(`${stagedPage}: staged premium shell is missing.`);
} else {
  const source = fs.readFileSync(stagedPage, 'utf8');
  for (const language of ['en', 'es', 'fr', 'it', 'de']) {
    if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(source)) {
      failures.push(`${stagedPage}: missing ${language} staged-premium copy.`);
    }
  }
  for (const forbidden of ['fake activity', 'coming with your partner data already loaded', 'SMS reminder sent', 'Your partner has joined']) {
    if (source.toLowerCase().includes(forbidden.toLowerCase())) {
      failures.push(`${stagedPage}: staged premium shell contains an unverified behavior claim: ${forbidden}.`);
    }
  }
}

if (failures.length) {
  console.error('\n⛔ Staged premium relationship-tools check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log(`✅ ${stagedFiles.length} unreviewed premium relationship tools remain safely staged instead of reviving legacy private-data flows.`);
