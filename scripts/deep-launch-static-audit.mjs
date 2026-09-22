import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const WORKER = path.join(ROOT, 'worker');
const OUT = path.join(ROOT, 'audit-artifacts');
fs.mkdirSync(OUT, { recursive: true });

const EXPECTED_LANGS = ['en','es','fr','it','de'];
const PUBLIC_ROUTES = [
  '/', '/Home', '/AboutUs', '/SignIn', '/login', '/SignUp', '/signup',
  '/ForgotPassword', '/Invite', '/HelpCenter', '/ContactUs', '/PrivacyPolicy',
  '/TermsOfService', '/Reviews', '/LeaveReview', '/Suggestions'
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
function rel(file) { return path.relative(ROOT, file).replaceAll('\\\\', '/'); }
function read(file) { return fs.readFileSync(file, 'utf8'); }

const allSourceFiles = walk(SRC).filter(function(f){ return /\.(?:js|jsx|ts|tsx)$/.test(f); });
const allWorkerFiles = walk(WORKER).filter(function(f){ return /\.(?:js|jsx|ts|tsx)$/.test(f); });
const existing = new Set(walk(ROOT).map(rel));

function resolveLocal(fromFile, spec) {
  if (!(spec.startsWith('.') || spec.startsWith('@/'))) return null;
  const base = spec.startsWith('@/') ? path.join(SRC, spec.slice(2)) : path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base, base + '.js', base + '.jsx', base + '.ts', base + '.tsx',
    path.join(base, 'index.js'), path.join(base, 'index.jsx'),
    path.join(base, 'index.ts'), path.join(base, 'index.tsx')
  ];
  return candidates.find(function(c){ return fs.existsSync(c) && fs.statSync(c).isFile(); }) || null;
}
function importSpecs(code) {
  const specs = [];
  const patterns = [
    /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) specs.push(m[1]);
  }
  return specs;
}

const reachable = new Set();
const unresolvedImports = [];
const queue = [path.join(SRC, 'main.jsx')];
while (queue.length) {
  const file = queue.shift();
  if (!file || reachable.has(file)) continue;
  reachable.add(file);
  const code = read(file);
  for (const spec of importSpecs(code)) {
    const local = resolveLocal(file, spec);
    if ((spec.startsWith('.') || spec.startsWith('@/')) && !local) unresolvedImports.push({ file: rel(file), spec: spec });
    else if (local && !reachable.has(local)) queue.push(local);
  }
}
const reachableFiles = Array.from(reachable).sort();

const indexCode = read(path.join(SRC, 'pages', 'index.jsx'));
const routeMatches = Array.from(indexCode.matchAll(/<Route\s+path=["']([^"']+)["']/g)).map(function(m){ return m[1]; });
const appCode = read(path.join(SRC, 'App.jsx'));
const directAppRoutes = Array.from(appCode.matchAll(/pathname\s*===\s*['"]([^'"]+)['"]/g)).map(function(m){ return m[1]; });
const routeSet = new Set(routeMatches.concat(directAppRoutes).map(function(r){ return r.toLowerCase(); }));
const routeDuplicates = routeMatches.filter(function(r,i,a){ return a.indexOf(r) !== i; });

const createPageTargets = [];
const directTargets = [];
const literalApiCalls = [];
const assetRefs = [];
const activeWarnings = [];
const activeCritical = [];
const staleStack = [];
const testCodeHits = [];
const unsafeHits = [];
const hrefHashHits = [];
const httpHits = [];
const importMetaEnv = new Set();

for (const file of reachableFiles) {
  const code = read(file);
  const rp = rel(file);
  for (const m of code.matchAll(/createPageUrl\(\s*['"]([^'"]+)['"]\s*\)/g)) createPageTargets.push({ file: rp, target: m[1] });
  for (const m of code.matchAll(/(?:navigate\(|to=\{|to=)\s*['"]\/?([^'"?#]+)[^'"]*['"]/g)) directTargets.push({ file: rp, target: '/' + m[1].replace(/^\//,'') });
  for (const m of code.matchAll(/['"](\/api\/[A-Za-z0-9_./?=&{}:$\-]+)['"]/g)) literalApiCalls.push({ file: rp, endpoint: m[1] });
  for (const m of code.matchAll(/['"](\/assets\/[A-Za-z0-9_./%+@()\-]+)['"]/g)) assetRefs.push({ file: rp, asset: m[1] });
  for (const m of code.matchAll(/import\.meta\.env\.([A-Za-z0-9_]+)/g)) importMetaEnv.add(m[1]);

  if (/\b(?:supabase|base44|vercel\.app)\b/i.test(code)) staleStack.push(rp);
  if (/dangerouslySetInnerHTML|\beval\s*\(|new\s+Function\s*\(/.test(code)) unsafeHits.push(rp);
  if (/\b123456\b/.test(code) && /verif|code|otp/i.test(code)) testCodeHits.push(rp);
  if (/href\s*=\s*["']#["']/.test(code)) hrefHashHits.push(rp);
  if (/http:\/\//i.test(code)) httpHits.push(rp);
  if (/Available in 6 Languages|Disponible en 6 idiomas|Disponible en 6 langues|Disponibile in 6 lingue|Verfügbar in 6 Sprachen/i.test(code) && !rp.endsWith('i18nFallbackLocalization.js')) {
    activeCritical.push({ file: rp, issue: 'Stale six-language launch copy is reachable.' });
  }
  for (const token of ['TODO','FIXME','coming soon','not implemented','Lorem ipsum']) {
    const found = token === 'TODO'
      ? /\bTODO\b/.test(code)
      : token === 'FIXME'
        ? /\bFIXME\b/.test(code)
        : code.toLowerCase().includes(token.toLowerCase());
    if (found) activeWarnings.push({ file: rp, issue: 'Reachable source contains ' + token + '.' });
  }
}

const missingPageTargets = [];
for (const item of createPageTargets) {
  const expected = ('/' + item.target).toLowerCase();
  if (!routeSet.has(expected)) missingPageTargets.push(item);
}
for (const item of directTargets) {
  const target = item.target.toLowerCase();
  if (target.startsWith('/api/') || target.startsWith('/http')) continue;
  if (!routeSet.has(target) && !['/admin','/analytics','/'].includes(target)) missingPageTargets.push(item);
}
const missingPublicRoutes = PUBLIC_ROUTES.filter(function(r){ return !routeSet.has(r.toLowerCase()); });

const workerText = allWorkerFiles.map(read).join('\n');
const uncoveredApiRoots = [];
for (const item of literalApiCalls) {
  const clean = item.endpoint.split('?')[0];
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] !== 'api' || parts.length < 2) continue;
  const root = '/api/' + parts[1];
  if (root === '/api/auth') continue;
  if (!workerText.includes(root)) uncoveredApiRoots.push({ file: item.file, endpoint: item.endpoint, root: root });
}

const missingAssets = [];
for (const item of assetRefs) {
  const publicPath = 'public' + decodeURIComponent(item.asset);
  if (!existing.has(publicPath)) missingAssets.push({ file: item.file, asset: item.asset, expected: publicPath });
}

const layout = read(path.join(SRC, 'pages', 'Layout.jsx'));
const activeLangs = Array.from(layout.matchAll(/code:\s*["']([a-z]{2})["'][\s\S]{0,220}?active:\s*true/g)).map(function(m){ return m[1]; });
const uniqueActiveLangs = Array.from(new Set(activeLangs));
const languageConfigOk = EXPECTED_LANGS.every(function(x){ return uniqueActiveLangs.includes(x); }) &&
  uniqueActiveLangs.every(function(x){ return EXPECTED_LANGS.includes(x); }) &&
  uniqueActiveLangs.length === EXPECTED_LANGS.length;

const requiredLocalized = [
  'src/pages/Home.jsx',
  'src/pages/Layout.jsx',
  'src/pages/SignIn.jsx',
  'src/pages/ForgotPassword.jsx',
  'src/pages/VerifyPhone.jsx',
  'src/pages/Subscription.jsx',
  'src/components/signup/LaunchRegularUserForm.jsx'
];
const localizationGaps = [];
for (const rp of requiredLocalized) {
  const code = read(path.join(ROOT, rp));
  for (const lang of EXPECTED_LANGS) {
    const re = new RegExp('(^|\\n|\\{|,)\\s*' + lang + '\\s*:', 'm');
    if (!re.test(code)) localizationGaps.push({ file: rp, language: lang });
  }
}
for (const lang of EXPECTED_LANGS) {
  if (!existing.has('src/content/terms/' + lang + '.js')) localizationGaps.push({ file: 'src/content/terms', language: lang });
  if (!existing.has('src/components/lovenotes/additional/LoveNotesAdditional.' + lang + '.js')) localizationGaps.push({ file: 'LoveNotesAdditional', language: lang });
}

const deferredNavigationTargets = new Set([
  'AIContentCreator','RelationshipCoach','WinACruise','Developer','FriendRequests',
  'Meditation','CooperativeGames','PremiumFeatures','Leaderboard','Achievements',
  'CounselingSupport','InfluencersSupport','InfluencerSignup','ProfessionalSignup','TherapistSignup'
]);
const deferredDirectPaths = new Set(Array.from(deferredNavigationTargets).map(function(target){
  return ('/' + target).toLowerCase();
}));
const reachableDeferredNavigation = createPageTargets
  .filter(function(item){ return deferredNavigationTargets.has(item.target); })
  .concat(directTargets.filter(function(item){ return deferredDirectPaths.has(item.target.toLowerCase()); }));

const critical = [];
if (unresolvedImports.length) critical.push({ issue: 'Unresolved local imports', details: unresolvedImports });
if (reachableDeferredNavigation.length) critical.push({ issue: 'Launch-reachable navigation points to a deferred feature', details: reachableDeferredNavigation });
if (routeDuplicates.length) critical.push({ issue: 'Duplicate route declarations', details: routeDuplicates });
if (missingPublicRoutes.length) critical.push({ issue: 'Missing public launch routes', details: missingPublicRoutes });
if (missingPageTargets.length) critical.push({ issue: 'Reachable navigation targets have no route', details: missingPageTargets });
if (uncoveredApiRoots.length) critical.push({ issue: 'Reachable frontend API roots have no Worker handler surface', details: uncoveredApiRoots });
if (missingAssets.length) critical.push({ issue: 'Referenced launch assets are missing', details: missingAssets });
if (!languageConfigOk) critical.push({ issue: 'Active language selector is not exactly en/es/fr/it/de', details: uniqueActiveLangs });
if (localizationGaps.length) critical.push({ issue: 'Core launch localization map is missing required language entries', details: localizationGaps });
if (staleStack.length) critical.push({ issue: 'Reachable launch code contains legacy stack references', details: Array.from(new Set(staleStack)) });
if (testCodeHits.length) critical.push({ issue: 'Reachable launch code contains a hard-coded verification/test code', details: Array.from(new Set(testCodeHits)) });
if (unsafeHits.length) critical.push({ issue: 'Reachable launch code contains unsafe dynamic execution/HTML primitive', details: Array.from(new Set(unsafeHits)) });
critical.push(...activeCritical);

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    sourceModules: allSourceFiles.length,
    reachableLaunchModules: reachableFiles.length,
    workerModules: allWorkerFiles.length,
    routes: routeMatches.length + directAppRoutes.length,
    publicRoutesChecked: PUBLIC_ROUTES.length,
    literalApiCalls: literalApiCalls.length,
    activeLanguages: uniqueActiveLangs,
    importMetaEnv: Array.from(importMetaEnv).sort(),
    criticalCount: critical.length,
    warningCount: activeWarnings.length + hrefHashHits.length + httpHits.length
  },
  critical: critical,
  warnings: {
    launchMarkers: activeWarnings,
    hashLinks: Array.from(new Set(hrefHashHits)),
    insecureHttpReferences: Array.from(new Set(httpHits))
  },
  diagnostics: {
    reachableFiles: reachableFiles.map(rel),
    apiEndpoints: Array.from(new Set(literalApiCalls.map(function(x){ return x.endpoint; }))).sort(),
    navigationTargets: Array.from(new Set(createPageTargets.map(function(x){ return x.target; }))).sort(),
    assetReferences: Array.from(new Set(assetRefs.map(function(x){ return x.asset; }))).sort()
  }
};

fs.writeFileSync(path.join(OUT, 'static-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
if (critical.length) {
  console.error('\nCRITICAL DEEP-LAUNCH AUDIT FINDINGS');
  for (const finding of critical) console.error('-', finding.issue, JSON.stringify(finding.details || ''));
  process.exit(1);
}
console.log('\nDeep static launch audit passed with no critical structural findings.');
