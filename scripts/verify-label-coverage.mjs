// Label-coverage verification (2026-10-08).
// Run: node scripts/verify-label-coverage.mjs
// Proves every registered app route resolves to a REAL human label — an
// explicit FEATURE_BY_ROUTE entry that (a) agrees between the client map
// (src/lib/interactionAnalytics.js) and the server mirror
// (worker/click-labels.js) and (b) is a member of TRACKABLE_FEATURES
// (worker/feature-usage.ts), so the ingest actually stores it instead of
// nulling the feature (which is what rendered rows "Unnamed feature" /
// prettified-raw). Admin surfaces are excluded by design: analytics
// tracking is suppressed there on both client and server, so they can
// never produce an unlabeled row.
import { readFileSync } from 'node:fs';
import { featureForPath, prettifyRoute } from '../src/lib/interactionAnalytics.js';
import { featureForRoutePath } from '../worker/click-labels.js';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(root + p, 'utf8');

// --- Enumerate the route registry -------------------------------------------
const pagesSrc = read('src/pages/index.jsx');
const routes = [...pagesSrc.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const uniqueRoutes = [...new Set(routes)];

// Admin / tracking-suppressed surfaces (ADMIN_PATHS in the client emitter;
// the worker likewise never stores their events as visitor analytics).
const EXCLUDED = new Set(['/admin', '/adminaccess', '/analytics', '/developer']);

// --- TRACKABLE_FEATURES (the ingest-side allowlist of storable labels) ------
const featureUsageSrc = read('worker/feature-usage.ts');
const trackableBlock = featureUsageSrc.match(/const TRACKABLE_FEATURES = new Set\(\[([\s\S]*?)\]\);/)[1];
const TRACKABLE = new Set([...trackableBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]));

// --- Parse both route->feature maps ------------------------------------------
function parseMap(path) {
  const src = read(path);
  const map = {};
  for (const m of src.matchAll(/'(\/[^']*)':\s*'([^']+)'/g)) map[m[1]] = m[2];
  return map;
}
const clientMap = parseMap('src/lib/interactionAnalytics.js');
const serverMap = parseMap('worker/click-labels.js');

let failures = 0;
let labeled = 0;
const gaps = [];
console.log('--- Route coverage (registered routes -> human label) ---');
for (const rawRoute of uniqueRoutes) {
  if (rawRoute === '*') { console.log(`  SKIP  *  (catch-all redirect)`); continue; }
  const route = (rawRoute.toLowerCase().replace(/\/$/, '') || '/');
  if (EXCLUDED.has(route)) { console.log(`  SKIP  ${route}  (admin surface — tracking suppressed by design)`); continue; }
  const clientLabel = featureForPath(route);
  const serverLabel = featureForRoutePath(route);
  if (!clientLabel) {
    gaps.push(`${route} -> NO map entry (feature stored NULL; display falls back to prettified raw "${prettifyRoute(route)}")`);
    failures += 1;
    continue;
  }
  if (serverLabel !== clientLabel) {
    gaps.push(`${route} -> client/server mismatch ("${clientLabel}" vs "${serverLabel}")`);
    failures += 1;
    continue;
  }
  if (!TRACKABLE.has(clientLabel)) {
    gaps.push(`${route} -> label "${clientLabel}" not in TRACKABLE_FEATURES (ingest would null it)`);
    failures += 1;
    continue;
  }
  labeled += 1;
  console.log(`  PASS  ${route} -> "${clientLabel}"`);
}

// --- Every map value must be storable ----------------------------------------
console.log('--- Map-value coverage (FEATURE_BY_ROUTE values in TRACKABLE_FEATURES) ---');
for (const [route, name] of Object.entries(clientMap)) {
  if (!TRACKABLE.has(name)) {
    console.log(`  FAIL  ${route} -> "${name}" not trackable`);
    failures += 1;
  }
}
console.log(`  ${Object.keys(clientMap).length} client map entries checked; ${TRACKABLE.size} trackable features.`);

// --- Admin dashboard tabs all carry labels ------------------------------------
console.log('--- Admin.jsx tab definitions ---');
const adminSrc = read('src/pages/Admin.jsx');
const tabDefs = [...adminSrc.matchAll(/\{\s*id:\s*'([^']+)',\s*label:\s*'([^']+)'/g)];
const tabIds = [...adminSrc.matchAll(/\{\s*id:\s*'([^']+)',/g)].map((m) => m[1]);
if (tabDefs.length >= 9 && tabIds.length === tabDefs.length) {
  console.log(`  PASS  all ${tabDefs.length} admin tabs have labels (${tabDefs.map((t) => t[2]).join(', ')})`);
} else {
  console.log(`  FAIL  admin tabs: ${tabDefs.length} labeled of ${tabIds.length} defined`);
  failures += 1;
}

console.log(`\n${labeled} routes labeled; ${gaps.length} gap(s):`);
for (const g of gaps) console.log(`  GAP  ${g}`);
console.log(failures === 0 ? '\nALL LABEL COVERAGE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
