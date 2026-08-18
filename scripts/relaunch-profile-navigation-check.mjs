import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  router: 'src/pages/index.jsx',
  sharedLayout: 'src/Layout.jsx',
  layout: 'src/pages/LayoutRelaunch.jsx',
  profile: 'src/pages/ProfileRelaunch.jsx',
  profileService: 'src/lib/profileService.js',
};

for (const file of Object.values(files)) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const router = exists(files.router) ? read(files.router) : '';
const sharedLayout = exists(files.sharedLayout) ? read(files.sharedLayout) : '';
const layout = exists(files.layout) ? read(files.layout) : '';
const profile = exists(files.profile) ? read(files.profile) : '';
const profileService = exists(files.profileService) ? read(files.profileService) : '';

check(
  'router uses relaunch Profile',
  router.includes('import Profile from "./ProfileRelaunch"') && router.includes('["/Profile", Profile]'),
  'The public Profile route must not drift back to the legacy fake-activity page.'
);
check(
  'router uses relaunch Relationship Goals',
  router.includes('import RelationshipGoals from "./RelationshipGoalsRelaunch"'),
  'Paid goals must stay on the reviewed private-data implementation.'
);
check(
  'router uses relaunch navigation shell',
  router.includes('import Layout from "./LayoutRelaunch.jsx"'),
  'The public router must use the lean relaunch navigation shell.'
);
check(
  'shared language context points to relaunch layout',
  sharedLayout.includes('./pages/LayoutRelaunch.jsx'),
  '@/Layout consumers must share the same LanguageProvider used by the router shell.'
);
check(
  'main relaunch navigation does not advertise legacy prize or developer pages',
  !layout.includes('WinACruise')
    && !layout.includes('Win Prizes')
    && !layout.includes('/Developer')
    && !layout.includes('developer'),
  'Legacy campaign and developer destinations must not be promoted in public navigation.'
);
check(
  'main navigation promotes the reviewed acquisition loop',
  layout.includes("path: '/Community'")
    && layout.includes("path: '/LoveNotes'")
    && layout.includes("path: '/LoveLanguageQuiz'")
    && layout.includes("path: '/DateIdeas'"),
  'Home/community/Love Notes/free engagement tools should remain easy to reach.'
);
check(
  'relaunch Profile contains no hard-coded activity counters',
  !profile.includes('quizzesTaken')
    && !profile.includes('love_notes_sent')
    && !profile.includes('streak_days')
    && !profile.includes('Mock memories')
    && !profile.includes('const memories = []'),
  'Profile must not display fabricated activity metrics.'
);
check(
  'Profile explicitly avoids fake partner-account linking',
  profile.includes('does not automatically link two One2OneLove accounts')
    && !profile.includes('Link your profiles together'),
  'A stored partner email is not a couple-account permission/link model.'
);
check(
  'Profile save uses reviewed profile service boundary',
  profile.includes("from '@/lib/profileService'")
    && profile.includes('updateUserProfile(user.id')
    && !profile.includes("supabase.from('users')"),
  'Profile writes should remain centralized through the allowlisted service.'
);
check(
  'profile service has explicit self-service allowlist',
  profileService.includes('SAFE_PROFILE_UPDATE_FIELDS')
    && profileService.includes('sanitizeProfileUpdates')
    && profileService.includes('getAuthenticatedOwnUser'),
  'Profile UI safety depends on the existing own-user/field allowlist remaining intact.'
);
check(
  'navigation language rollout preserves disabled Dutch and Portuguese state',
  layout.includes("{ code: 'nl', name: 'Dutch', flag: 'nl', active: false }")
    && layout.includes("{ code: 'pt', name: 'Portuguese', flag: 'pt', active: false }"),
  'Do not silently change the language rollout while cleaning navigation.'
);

console.log('\nOne2OneLove relaunch profile/navigation check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
