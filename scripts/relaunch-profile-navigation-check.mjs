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
  profileShim: 'src/pages/ProfileRelaunch.jsx',
  profileShell: 'src/pages/ProfileRelaunchShell.jsx',
  profile: 'src/pages/ProfileRelaunchSafe.jsx',
  profileService: 'src/lib/profileService.js',
  privacyCenter: 'src/pages/PrivacyCenter.jsx',
  unavailable: 'src/pages/RelaunchUnavailable.jsx',
};

for (const file of Object.values(files)) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const router = exists(files.router) ? read(files.router) : '';
const sharedLayout = exists(files.sharedLayout) ? read(files.sharedLayout) : '';
const layout = exists(files.layout) ? read(files.layout) : '';
const profileShim = exists(files.profileShim) ? read(files.profileShim) : '';
const profileShell = exists(files.profileShell) ? read(files.profileShell) : '';
const profile = exists(files.profile) ? read(files.profile) : '';
const profileService = exists(files.profileService) ? read(files.profileService) : '';
const privacyCenter = exists(files.privacyCenter) ? read(files.privacyCenter) : '';
const unavailable = exists(files.unavailable) ? read(files.unavailable) : '';

check(
  'router uses relaunch Profile',
  router.includes('import Profile from "./ProfileRelaunch"') && router.includes('["/Profile", Profile]'),
  'The public Profile route must not drift back to the legacy fake-activity page.'
);
check(
  'Profile shim resolves through privacy-aware relaunch shell',
  profileShim.includes("export { default } from './ProfileRelaunchShell'"),
  'The public Profile entry point must include the reviewed profile plus discoverable privacy controls.'
);
check(
  'Profile shell preserves reviewed profile and exposes Privacy Center',
  profileShell.includes("import ProfileRelaunchSafe from './ProfileRelaunchSafe'")
    && profileShell.includes('<ProfileRelaunchSafe />')
    && profileShell.includes('to="/PrivacyCenter"')
    && profileShell.includes('Privacy & Account Controls'),
  'Members must be able to find privacy/account controls from their Profile without replacing the reviewed profile surface.'
);
check(
  'Privacy Center remains an explicit authenticated relaunch route',
  router.includes('import PrivacyCenter from "./PrivacyCenter"')
    && router.includes('["/PrivacyCenter", PrivacyCenter]')
    && privacyCenter.includes('Privacy & Account Controls')
    && privacyCenter.includes('if (!isAuthenticated)'),
  'Privacy/account controls must be reachable but remain account-authenticated.'
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
  'excluded Developer and prize routes cannot render their legacy pages',
  router.includes('["/Developer", RelaunchUnavailable]')
    && router.includes('["/WinACruise", RelaunchUnavailable]')
    && unavailable.includes('not part of the current relaunch'),
  'Hiding a menu item is insufficient when the old URL is directly guessable.'
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
  'Profile truthfully distinguishes discoverable and private fields',
  profile.includes('What other members can discover')
    && profile.includes('display name, optional profile image, short bio and member-since date')
    && profile.includes('Account-private details')
    && profile.includes('location, relationship status, anniversary, partner information and Love Language remain account-private'),
  'Discoverable profile copy must match the five-field privacy-minimized member directory.'
);
check(
  'relaunch Profile does not collect partner email before partner linking exists',
  !profile.includes('partner_email')
    && profile.includes('Partner email is not collected'),
  'Data minimization should win until a reviewed partner-linking workflow actually needs partner email.'
);
check(
  'Profile save uses reviewed profile service boundary',
  profile.includes("from '@/lib/profileService'")
    && profile.includes('updateUserProfile(user.id')
    && !profile.includes("supabase.from('users')"),
  'Profile writes should remain centralized through the allowlisted service.'
);
const profileSafeUpdateBlock = profileService.match(/const SAFE_PROFILE_UPDATE_FIELDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
check(
  'profile service allowlist excludes account/role/billing and partner-email writes',
  profileService.includes('SAFE_PROFILE_UPDATE_FIELDS')
    && profileService.includes('sanitizeProfileUpdates')
    && profileService.includes('getAuthenticatedOwnUser')
    && ['partner_email', 'email', 'user_type', 'subscription_status', 'stripe_customer_id', 'is_verified', 'is_active']
      .every((field) => !profileSafeUpdateBlock.includes(`'${field}'`) && !profileSafeUpdateBlock.includes(`"${field}"`)),
  'The browser-editable allowlist must stay narrow while authenticated own-row role checks remain permitted.'
);
check(
  'navigation language rollout preserves disabled Dutch and Portuguese state',
  /\{ code: 'nl', name: '[^']+', flag: 'nl', active: false \}/.test(layout)
    && /\{ code: 'pt', name: '[^']+', flag: 'pt', active: false \}/.test(layout),
  'Localized language labels may vary, but Dutch and Portuguese must remain disabled.'
);

console.log('\nOne2OneLove relaunch profile/navigation check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
