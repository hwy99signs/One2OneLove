import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const routerFile = 'src/pages/index.jsx';
const helpFile = 'src/pages/HelpCenterRelaunch.jsx';
const unavailableFile = 'src/pages/RelaunchUnavailable.jsx';
const notFoundFile = 'src/pages/NotFoundRelaunch.jsx';
const aboutFile = 'src/pages/AboutUsRelaunch.jsx';
const aboutAliasFile = 'src/pages/AboutUs.jsx';
const layoutFile = 'src/pages/LayoutRelaunch.jsx';
const homeFile = 'src/pages/Home.jsx';
const communityFile = 'src/pages/LiveCommunity.jsx';

for (const file of [routerFile, helpFile, unavailableFile, notFoundFile, aboutFile, aboutAliasFile, layoutFile, homeFile, communityFile]) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const router = exists(routerFile) ? read(routerFile) : '';
const help = exists(helpFile) ? read(helpFile) : '';
const about = exists(aboutFile) ? read(aboutFile) : '';
const aboutAlias = exists(aboutAliasFile) ? read(aboutAliasFile) : '';
const generalNavigationSurface = [layoutFile, homeFile, helpFile, communityFile]
  .filter(exists)
  .map((file) => read(file))
  .join('\n');

const blockedRoutes = [
  '/Developer',
  '/WinACruise',
  '/CouplesProfile',
  '/Blog',
  '/Reviews',
  '/Suggestions',
  '/Leaderboard',
  '/Achievements',
  '/ContactUs',
];

for (const route of blockedRoutes) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\[\\"${escaped}\\", RelaunchUnavailable\\]`);
  check(
    `legacy route fenced: ${route}`,
    pattern.test(router),
    `${route} must stay preserved in source but unavailable from the relaunch route surface until reviewed.`
  );
}

const requiredPrivateMemberRoutes = [
  ['/PrivacyCenter', 'PrivacyCenter'],
  ['/BlockedMembers', 'BlockedMembers'],
  ['/SupportRequests', 'SupportRequests'],
  ['/ProgrammingSchedule', 'ProgrammingSchedule'],
];

for (const [route, component] of requiredPrivateMemberRoutes) {
  check(
    `private member route wired: ${route}`,
    router.includes(`["${route}", ${component}]`),
    `${route} is a reviewed member control and must not silently disappear from the relaunch router.`
  );
}

const staffConsoleRoutes = [
  '/SupportAdmin',
  '/O2OLProgrammingAdmin',
  '/ProgrammingModerationAdmin',
];

for (const route of staffConsoleRoutes) {
  check(
    `staff console routed privately: ${route}`,
    router.includes(`["${route}",`),
    `${route} must remain routable for server-authorized staff while its page enforces the feature switch and server allowlist.`
  );
  check(
    `staff console absent from general navigation: ${route}`,
    !generalNavigationSurface.includes(route),
    `${route} must not be exposed from the main header, Home, Help Center or Community navigation surfaces.`
  );
}

check(
  'unknown routes have a safe catch-all',
  router.includes('import NotFoundRelaunch from "./NotFoundRelaunch"')
    && router.includes('["*", NotFoundRelaunch]'),
  'Guessable/unknown URLs should never fall through to a blank or unintended legacy screen.'
);
check(
  'Help Center route uses reviewed relaunch help',
  router.includes('import HelpCenter from "./HelpCenterRelaunch"')
    && router.includes('["/HelpCenter", HelpCenter]'),
  'Help must document current relaunch behavior rather than unfinished legacy promises.'
);
check(
  'Help Center search is real',
  help.includes('const [query, setQuery]')
    && help.includes('.filter((row) =>')
    && help.includes('value={query}')
    && help.includes('onChange={(event) => setQuery(event.target.value)}'),
  'The visible Help search box must actually filter help topics.'
);
check(
  'Help Center does not point to fake contact delivery',
  !help.includes('/ContactUs') && !help.includes('support@one2onelove.com'),
  'Do not imply a monitored contact channel until one is verified/implemented.'
);
check(
  'Help Center documents current no-fake-activity boundaries',
  help.includes('instead of pretending people are there')
    && help.includes('does not automatically create a couple account'),
  'Help copy should reinforce the relaunch truthfulness rules.'
);
check(
  'legacy About entry resolves to reviewed relaunch About page',
  aboutAlias.includes("export { default } from './AboutUsRelaunch'"),
  'Old imports must not revive the fabricated legacy About page.'
);
check(
  'About page contains no fabricated scale/team/history claims',
  !about.includes('50,000+')
    && !about.includes('1M+')
    && !about.includes('10,000 Couples')
    && !about.includes('Sarah Johnson')
    && !about.includes('Michael Chen')
    && !about.includes('Join thousands'),
  'Public About content must not manufacture users, founders, history or adoption statistics.'
);
check(
  'About page states relaunch truthfulness boundaries',
  about.includes('fake activity, rankings or manufactured social proof')
    && about.includes('never pretends humans are present')
    && about.includes('not therapists, emergency services'),
  'Public positioning should match the reviewed no-fake-activity and AI-boundary design.'
);

console.log('\nOne2OneLove relaunch route-safety check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
