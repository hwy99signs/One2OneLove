// Verification for click-label completeness (2026-10-07).
// Run: node scripts/verify-click-labels.mjs
// Proves: (1) the exact /chat and /signin elements that used to record
// nameless now derive a name under the client logic; (2) the server ingest
// backstop names simulated payloads that arrive with no label; (3) the
// client and server route->feature maps agree; (4) source audits of every
// click-emitting path.
import { readFileSync } from 'node:fs';
import { deriveClickControlKey as clientDerive, featureForPath } from '../src/lib/interactionAnalytics.js';
import { deriveClickControlKey as serverDerive, deriveClickFeature, featureForRoutePath } from '../worker/click-labels.js';

let failures = 0;
function check(label, actual, expected) {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  =>  ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
}
function oldClientLabel(d) {
  // The pre-fix emitter: data-analytics-id / aria-label / title / name / id only.
  return d.analyticsId || d.ariaLabel || d.title || d.name || d.id || null;
}

// --- 1. The exact elements from the /chat and /signin audit ----------------
// Descriptors are what installClickAnalytics builds from the real JSX.
const elements = [
  // Chat.jsx L434 room card: no label attrs at all, text = room name + blurb.
  { page: '/chat', name: 'room card button', d: { text: 'Relationship 100 If you had 100% to divide among the things that matter most in your relationship, how would you divide it? 0 online 0 messages', route: '/chat', controlType: 'button' }, expect: (v) => v && v.startsWith('Relationship 100') },
  // Chat.jsx L502 composer Send submit: text only.
  { page: '/chat', name: 'Send submit button', d: { text: 'Send', route: '/chat', controlType: 'button' }, expect: 'Send' },
  // Chat.jsx L411 back link: text only.
  { page: '/chat', name: 'back link', d: { text: 'Back', destination: '/', route: '/chat', controlType: 'a' }, expect: 'Back' },
  // Chat.jsx L426 refresh rooms: icon-only, aria-label (the labeled row in the screenshot).
  { page: '/chat', name: 'refresh icon button', d: { ariaLabel: 'Refresh', route: '/chat', controlType: 'button' }, expect: 'Refresh' },
  // Chat.jsx L458 topic chip: title holds "N messages" — visible text must win over title.
  { page: '/chat', name: 'topic chip', d: { text: 'Who should apologize first?', title: '3 messages', route: '/chat', controlType: 'button' }, expect: 'Who should apologize first?' },
  // Chat.jsx L457 main-room chip: text only.
  { page: '/chat', name: 'main-room chip', d: { text: 'Main room', route: '/chat', controlType: 'button' }, expect: 'Main room' },
  // Chat.jsx L488 delete-message icon button: aria-label only.
  { page: '/chat', name: 'delete message icon', d: { ariaLabel: 'Delete message', route: '/chat', controlType: 'button' }, expect: 'Delete message' },
  // Chat.jsx hypothetical worst case: icon-only, no text, no attrs, no destination.
  { page: '/chat', name: 'bare icon button (fallback)', d: { route: '/chat', controlType: 'button' }, expect: 'Community Chat — button' },
  // SignIn.jsx submit Button: text only -> was "Unlabeled button".
  { page: '/signin', name: 'Sign In submit', d: { text: 'Sign In', route: '/signin', controlType: 'button' }, expect: 'Sign In' },
  // SignIn.jsx forgot-password link: text + destination.
  { page: '/signin', name: 'forgot password link', d: { text: 'Forgot password?', destination: '/forgotpassword', route: '/signin', controlType: 'a' }, expect: 'Forgot password?' },
  // SignIn.jsx sign-up tab link: text, role=tab.
  { page: '/signin', name: 'sign-up tab link', d: { text: 'Sign Up', destination: '/signup', route: '/signin', controlType: 'tab' }, expect: 'Sign Up' },
  // SignIn.jsx close X link: aria-label only (labeled fine before, must stay).
  { page: '/signin', name: 'close X link', d: { ariaLabel: 'Close', destination: '/', route: '/signin', controlType: 'a' }, expect: 'Close' },
  // SignIn.jsx bare link, nothing at all: destination-derived name.
  { page: '/signin', name: 'bare link to /chat (destination-derived)', d: { destination: '/chat', route: '/signin', controlType: 'a' }, expect: 'Community Chat' },
];
console.log('--- Client derivation: audited /chat + /signin elements ---');
for (const el of elements) {
  const before = oldClientLabel(el.d);
  const after = clientDerive(el.d);
  console.log(`  [${el.page}] ${el.name}: pre-fix label = ${JSON.stringify(before)}`);
  check(`client derives name for ${el.name}`, after, el.expect);
}

// --- 2. Server backstop: simulated ingest payloads with missing labels -----
console.log('--- Server backstop (worker/click-labels.js) ---');
check('ingest: no label, destination /lovenotes', serverDerive({ controlKey: null, destination: '/lovenotes', route: '/home', controlType: 'a' }), 'Love Notes');
check('ingest: no label, no destination, /chat button', serverDerive({ controlKey: null, destination: null, route: '/chat', controlType: 'button' }), 'Community Chat — button');
check('ingest: no label, external destination', serverDerive({ controlKey: null, destination: 'external:therapistaid.com', route: '/lgbtqsupport', controlType: 'a' }), 'External — therapistaid.com');
check('ingest: no label, /signin button', serverDerive({ controlKey: null, destination: null, route: '/signin', controlType: 'button' }), 'Signin — button');
check('ingest: existing label is never overwritten', serverDerive({ controlKey: 'home-tool-dateideas', destination: '/dateideas', route: '/home', controlType: 'a' }), 'home-tool-dateideas');
check('feature: from destination /o2olstudio', deriveClickFeature({ feature: null, destination: '/o2olstudio', route: '/' }), 'O2OL Studio');
check('feature: from route /chat', deriveClickFeature({ feature: null, destination: null, route: '/chat' }), 'Community Chat');
check('feature: client feature kept', deriveClickFeature({ feature: 'Love Notes', destination: '/chat', route: '/chat' }), 'Love Notes');
check('client featureForPath /chat agrees', featureForPath('/chat'), featureForRoutePath('/chat'));

// --- 3. Route->feature map sync (client vs server) --------------------------
console.log('--- Route map sync ---');
function parseMap(path) {
  const src = readFileSync(new URL(path, import.meta.url), 'utf8');
  const map = {};
  for (const m of src.matchAll(/'(\/[^']*)':\s*'([^']+)'/g)) map[m[1]] = m[2];
  return map;
}
const clientMap = parseMap('../src/lib/interactionAnalytics.js');
const serverMap = parseMap('../worker/click-labels.js');
let syncIssues = 0;
for (const [route, name] of Object.entries(clientMap)) {
  const serverName = featureForRoutePath(route);
  if (serverName !== name) { console.log(`  MISMATCH ${route}: client=${name} server=${serverName}`); syncIssues += 1; }
}
check(`all ${Object.keys(clientMap).length} client route mappings resolve identically server-side`, syncIssues, 0);
check('server map size', Object.keys(serverMap).length, (n) => n >= 50);

// --- 4. Source audits --------------------------------------------------------
console.log('--- Source audits ---');
const featureUsage = readFileSync(new URL('../worker/feature-usage.ts', import.meta.url), 'utf8');
const insertIdx = featureUsage.indexOf('INSERT INTO public.interaction_events');
check('server backstop runs before INSERT', featureUsage.indexOf('deriveClickControlKey({ destination, route, controlType })') > -1 && featureUsage.indexOf('deriveClickControlKey({ destination, route, controlType })') < insertIdx, true);
check('server feature backstop wired', featureUsage.indexOf('deriveClickFeature({ destination, route })') > -1, true);
const panel = readFileSync(new URL('../src/pages/Analytics.jsx', import.meta.url), 'utf8');
check('panel has no nameless-row rendering left', panel.includes('Unlabeled'), false);
check('panel marks fallback rows as (older event)', panel.includes('(older event)'), true);
const emitter = readFileSync(new URL('../src/lib/interactionAnalytics.js', import.meta.url), 'utf8');
check('emitter uses deriveClickControlKey', emitter.includes('controlKey = deriveClickControlKey({'), true);
check('emitter keeps form-field privacy guard', emitter.includes('wrapsFormField'), true);
const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
check('click capture installed globally (main.jsx)', main.includes('installClickAnalytics'), true);

import { execSync } from 'node:child_process';
const analyticsIds = execSync("grep -rn 'data-analytics-id' src --include=*.jsx --include=*.js | wc -l", { cwd: new URL('..', import.meta.url).pathname }).toString().trim();
const actionSites = execSync("grep -rn 'trackFeatureAction(' src --include=*.jsx --include=*.js | grep -v 'function trackFeatureAction' | wc -l", { cwd: new URL('..', import.meta.url).pathname }).toString().trim();
console.log(`  census: ${analyticsIds} data-analytics-id attributes; ${actionSites} explicit trackFeatureAction call sites (labels are mandatory arguments there — the emitter drops the event if feature or detail is empty); 1 global click listener (installClickAnalytics) covering every other control.`);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
