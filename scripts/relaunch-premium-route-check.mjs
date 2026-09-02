import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const stagedFiles = [
  'src/pages/MemoryLane.jsx',
  'src/pages/RelationshipQuizzes.jsx',
  'src/pages/AnniversaryTracker.jsx',
  'src/pages/RelationshipMilestones.jsx',
  'src/pages/Meditation.jsx',
  'src/pages/CommunicationPractice.jsx',
  'src/pages/CoupleActivities.jsx',
  'src/pages/SharedJournals.jsx',
  'src/pages/CooperativeGames.jsx',
  'src/pages/CouplesDashboard.jsx',
  'src/pages/CouplesCalendar.jsx',
];

for (const file of stagedFiles) {
  const content = read(file);
  check(
    `staged premium route: ${file}`,
    content.trim() === "export { default } from './PremiumFeatureStaged';",
    'Unreviewed premium prototypes must resolve to the explicit staged-membership screen.'
  );
}

const coach = read('src/pages/RelationshipCoach.jsx');
const creator = read('src/pages/AIContentCreator.jsx');
const goals = read('src/pages/RelationshipGoalsRelaunch.jsx');
const premium = read('src/pages/PremiumFeatures.jsx');
const staged = read('src/pages/PremiumFeatureStaged.jsx');

check(
  'AI Relationship Coach remains a real reviewed page',
  !coach.includes("export { default } from './PremiumFeatureStaged'") && coach.includes('Relationship Coach'),
  'The reviewed Coach is part of the relaunch premium foundation.'
);
check(
  'AI Content Creator remains a real reviewed page',
  !creator.includes("export { default } from './PremiumFeatureStaged'") && creator.includes('AI Content'),
  'The reviewed AI Content Creator is part of the relaunch premium foundation.'
);
check(
  'Relationship Goals remains the reviewed relaunch implementation',
  !goals.includes("export { default } from './PremiumFeatureStaged'") && goals.includes('Relationship Goals'),
  'The reviewed Goals implementation is part of the relaunch premium foundation.'
);
check(
  'membership page names only the reviewed launch foundation as active premium',
  premium.includes('Reviewed relaunch premium foundation')
    && premium.includes("launchFeatures: ['AI Relationship Coach', 'AI Content Creator for romantic messages and ideas', 'Relationship Goals and progress tracking']"),
  'Do not sell unreviewed prototype tools as active membership benefits.'
);
check(
  'membership page labels additional tools as staged roadmap',
  premium.includes('Membership roadmap — staged for later rollout')
    && premium.includes('not being presented as active relaunch features'),
  'Additional couple tools must remain visibly staged until reviewed.'
);
check(
  'staged screen explains why the tool is unavailable',
  staged.includes('has not yet passed the relaunch privacy, data, product and real-functionality review')
    && staged.includes('AI Relationship Coach, AI Content Creator and Relationship Goals'),
  'Members should get a truthful roadmap explanation rather than a broken prototype.'
);

console.log('\nOne2OneLove premium-route relaunch check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name} — ${item.detail}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
