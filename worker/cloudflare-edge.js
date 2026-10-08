// Cloudflare edge counts for the admin dashboard.
//
// The dashboard's own analytics (worker/analytics.ts) only count real
// browsers running the app — bots, crawlers and social link-preview
// fetchers never execute it, so the in-site numbers will ALWAYS sit far
// below Cloudflare's door count. This module fetches Cloudflare's zone
// analytics (GraphQL Analytics API, httpRequests1dGroups) so the admin
// dashboard can show both views side by side, each labeled for what it
// actually measures.
//
// Configuration comes ONLY from Worker env:
//   CLOUDFLARE_ANALYTICS_TOKEN — API token with Zone Analytics: Read
//   CLOUDFLARE_ZONE_ID         — the one2onelove.com zone id (not secret)
// No token is ever hardcoded. When either value is missing the panel
// renders a calm "not connected" state naming what is missing.
//
// Days are Cloudflare's days: httpRequests1dGroups buckets by UTC date.
// They are presented as-is and the panel says so — no silent conversion.

export const EDGE_WINDOW_DAYS = 30;
const CACHE_TTL_MS = 15 * 60 * 1000;
const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const EDGE_COUNTS_QUERY = `
  query EdgeCounts($zoneTag: string, $start: Date, $end: Date) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequests1dGroups(
          limit: 40
          filter: { date_geq: $start, date_leq: $end }
          orderBy: [date_ASC]
        ) {
          dimensions { date }
          sum { requests pageViews }
          uniq { uniques }
        }
      }
    }
  }
`;

function utcDateString(date) {
  return date.toISOString().slice(0, 10);
}

function shiftUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function zeroDay(date) {
  return { date, requests: 0, pageViews: 0, visits: 0 };
}

// Pure transform of a Cloudflare GraphQL response into the panel payload.
// `now` is injected so tests can pin "today". Returns null when the
// payload does not contain a usable zones result at all.
export function transformEdgeCounts(payload, now = new Date()) {
  const zones = payload?.data?.viewer?.zones;
  if (!Array.isArray(zones)) return null;
  const groups = Array.isArray(zones[0]?.httpRequests1dGroups)
    ? zones[0].httpRequests1dGroups
    : [];

  const byDate = new Map();
  for (const group of groups) {
    const date = group?.dimensions?.date;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    byDate.set(date, {
      date,
      requests: Number(group?.sum?.requests || 0),
      pageViews: Number(group?.sum?.pageViews || 0),
      // Cloudflare's uniq.uniques = unique visitors for the day. The
      // panel labels this "Visits (unique visitors)" — it is the closest
      // honest equivalent of a visit count the daily groups expose.
      visits: Number(group?.uniq?.uniques || 0),
    });
  }

  // Zero-fill the full window so the series always spans exactly
  // EDGE_WINDOW_DAYS days ending today (UTC), oldest first.
  const days = [];
  for (let offset = -(EDGE_WINDOW_DAYS - 1); offset <= 0; offset += 1) {
    const date = utcDateString(shiftUtcDays(now, offset));
    days.push(byDate.get(date) || zeroDay(date));
  }

  const totals = days.reduce((sum, day) => ({
    requests: sum.requests + day.requests,
    pageViews: sum.pageViews + day.pageViews,
    visits: sum.visits + day.visits,
  }), { requests: 0, pageViews: 0, visits: 0 });

  return {
    connected: true,
    days,
    today: days[days.length - 1],
    totals,
    fetchedAt: now.toISOString(),
  };
}

let cache = null; // { at: number, value: object } — successes only.

export function resetEdgeCountsCache() {
  cache = null;
}

export function missingEdgeConfig(env) {
  const missing = [];
  if (!env?.CLOUDFLARE_ANALYTICS_TOKEN) missing.push('CLOUDFLARE_ANALYTICS_TOKEN');
  if (!env?.CLOUDFLARE_ZONE_ID) missing.push('CLOUDFLARE_ZONE_ID');
  return missing;
}

// Fetch (and ~15-minute-cache) the edge counts for the dashboard.
// Never throws: every failure becomes a calm { connected:false } state.
export async function getEdgeCounts(env, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const now = options.now || new Date();

  const missing = missingEdgeConfig(env);
  if (missing.length) {
    return { connected: false, reason: 'not_configured', missing };
  }

  if (!options.force && cache && (now.getTime() - cache.at) < CACHE_TTL_MS) {
    return cache.value;
  }

  const end = utcDateString(now);
  const start = utcDateString(shiftUtcDays(now, -(EDGE_WINDOW_DAYS - 1)));

  let payload;
  try {
    const response = await fetchImpl(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.CLOUDFLARE_ANALYTICS_TOKEN}`,
      },
      body: JSON.stringify({
        query: EDGE_COUNTS_QUERY,
        variables: { zoneTag: env.CLOUDFLARE_ZONE_ID, start, end },
      }),
    });
    if (!response?.ok) return { connected: false, reason: 'unavailable' };
    payload = await response.json().catch(() => null);
  } catch {
    return { connected: false, reason: 'unavailable' };
  }

  if (!payload || (Array.isArray(payload.errors) && payload.errors.length)) {
    return { connected: false, reason: 'unavailable' };
  }
  const value = transformEdgeCounts(payload, now);
  if (!value) return { connected: false, reason: 'unavailable' };

  cache = { at: now.getTime(), value };
  return value;
}
