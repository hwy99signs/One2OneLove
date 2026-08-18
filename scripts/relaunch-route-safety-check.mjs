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

for (const file of [routerFile, helpFile, unavailableFile, notFoundFile]) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const router = exists(routerFile) ? read(routerFile) : '';
const help = exists(helpFile) ? read(helpFile) : '';

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

console.log('\nOne2OneLove relaunch route-safety check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
