// Verification for the Cloudflare edge-counts dashboard panel.
// Run: node scripts/verify-cloudflare-edge.mjs
// Proves: (1) the GraphQL transform zero-fills the 30-day window, picks
// out today, and totals correctly; (2) empty and malformed payloads are
// handled honestly; (3) the missing-token path reports exactly which env
// values are absent and never calls the API; (4) a stubbed successful
// fetch is transformed and then served from the ~15-minute cache.
import {
  transformEdgeCounts,
  getEdgeCounts,
  missingEdgeConfig,
  resetEdgeCountsCache,
} from '../worker/cloudflare-edge.js';

let failures = 0;
function check(label, actual, expected) {
  const ok = typeof expected === 'function' ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  =>  ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
}

const NOW = new Date('2026-10-07T23:30:00.000Z'); // pinned "today" = 2026-10-07 UTC

// --- 1. Transform with a partial fixture (gaps must zero-fill) ------------
const fixture = {
  data: {
    viewer: {
      zones: [{
        httpRequests1dGroups: [
          { dimensions: { date: '2026-10-05' }, sum: { requests: 900, pageViews: 120 }, uniq: { uniques: 40 } },
          { dimensions: { date: '2026-10-06' }, sum: { requests: 10280, pageViews: 1080 }, uniq: { uniques: 700 } },
          { dimensions: { date: '2026-10-07' }, sum: { requests: 7640, pageViews: 1440 }, uniq: { uniques: 1330 } },
        ],
      }],
    },
  },
};
const transformed = transformEdgeCounts(fixture, NOW);
check('transform returns connected payload', transformed?.connected, true);
check('window spans exactly 30 days', transformed?.days?.length, 30);
check('window starts 2026-09-08', transformed?.days?.[0]?.date, '2026-09-08');
check('window ends today 2026-10-07', transformed?.days?.[29]?.date, '2026-10-07');
check('gap day is zero-filled', transformed?.days?.find(d => d.date === '2026-10-04'), { date: '2026-10-04', requests: 0, pageViews: 0, visits: 0 });
check('today row picked out', transformed?.today, { date: '2026-10-07', requests: 7640, pageViews: 1440, visits: 1330 });
check('totals sum the window', transformed?.totals, { requests: 18820, pageViews: 2640, visits: 2070 });

// --- 2. Empty + malformed payloads ----------------------------------------
const empty = transformEdgeCounts({ data: { viewer: { zones: [{ httpRequests1dGroups: [] }] } } }, NOW);
check('empty groups still give a full zero window', empty?.totals, { requests: 0, pageViews: 0, visits: 0 });
check('null payload is rejected', transformEdgeCounts(null, NOW), null);
check('payload without zones is rejected', transformEdgeCounts({ data: {} }, NOW), null);
check('junk groups are skipped, not fatal', transformEdgeCounts({ data: { viewer: { zones: [{ httpRequests1dGroups: [{ dimensions: {} }, null] }] } } }, NOW)?.totals, { requests: 0, pageViews: 0, visits: 0 });

// --- 3. Missing env: named, calm, and the API is never called -------------
check('missing config lists both names', missingEdgeConfig({}), ['CLOUDFLARE_ANALYTICS_TOKEN', 'CLOUDFLARE_ZONE_ID']);
check('missing config lists only the token', missingEdgeConfig({ CLOUDFLARE_ZONE_ID: 'zone-x' }), ['CLOUDFLARE_ANALYTICS_TOKEN']);
resetEdgeCountsCache();
const forbiddenFetch = async () => { throw new Error('fetch must not be called without config'); };
const notConfigured = await getEdgeCounts({}, { fetchImpl: forbiddenFetch, now: NOW });
check('missing-token path is not connected', notConfigured, { connected: false, reason: 'not_configured', missing: ['CLOUDFLARE_ANALYTICS_TOKEN', 'CLOUDFLARE_ZONE_ID'] });

// --- 4. Stubbed success + cache -------------------------------------------
resetEdgeCountsCache();
let fetchCalls = 0;
const stubFetch = async (url, init) => {
  fetchCalls += 1;
  check('GraphQL endpoint used', url, 'https://api.cloudflare.com/client/v4/graphql');
  check('bearer token comes from env', init?.headers?.authorization, 'Bearer test-token');
  const body = JSON.parse(init.body);
  check('query variables carry zone + window', body?.variables, { zoneTag: 'zone-x', start: '2026-09-08', end: '2026-10-07' });
  return { ok: true, json: async () => fixture };
};
const env = { CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone-x' };
const first = await getEdgeCounts(env, { fetchImpl: stubFetch, now: NOW });
check('stubbed fetch connects', first?.connected, true);
check('stubbed fetch today matches fixture', first?.today?.pageViews, 1440);
const second = await getEdgeCounts(env, { fetchImpl: stubFetch, now: new Date(NOW.getTime() + 5 * 60 * 1000) });
check('second read inside TTL is cached (still 1 fetch)', fetchCalls, 1);
check('cached read returns same totals', second?.totals, first?.totals);
const third = await getEdgeCounts(env, { fetchImpl: stubFetch, now: new Date(NOW.getTime() + 16 * 60 * 1000) });
check('read after TTL refetches (2 fetches)', fetchCalls, 2);
check('refetched read still connects', third?.connected, true);

// --- 5. Failure paths stay calm -------------------------------------------
resetEdgeCountsCache();
const httpFail = await getEdgeCounts(env, { fetchImpl: async () => ({ ok: false, status: 403 }), now: NOW });
check('HTTP failure is a calm unavailable state', httpFail, { connected: false, reason: 'unavailable' });
const gqlFail = await getEdgeCounts(env, { fetchImpl: async () => ({ ok: true, json: async () => ({ errors: [{ message: 'bad token' }] }) }), now: NOW });
check('GraphQL errors are a calm unavailable state', gqlFail, { connected: false, reason: 'unavailable' });

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
