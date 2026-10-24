// Owner/agent tracking exclusion (owner-directed, 2026-10-12).
//
// Eisenhower's order: the interaction/visitor recording system must NEVER
// record or count activity by the owner himself or by Muse / agent test
// accounts — their testing traffic was inflating the visitor numbers he
// reads as business truth. Real visitor tracking is unchanged.
//
// An identity is excluded when EITHER:
//   (a) its neon_auth."user" role is 'admin' (the owner), or
//   (b) its email is the Muse test account created 2026-10-12 to prove
//       the sign-up counter (admin+o2oltest@erantpropertyservices.com), or
//   (c) its email is one of the owner's own personal member accounts
//       (TRACKING_HOUSEHOLD_EMAILS) — added 2026-10-12 evening after the
//       owner reported "our presence" still showing on his dashboard:
//       the admin-only rule missed every visit he made signed in as
//       himself instead of as the admin.
//
// This module is the single source for that decision: the ingest drop
// (worker/feature-usage.ts), the admin/analytics read-side filters
// (worker/admin.ts, worker/analytics.ts), and the one-time historic
// cleanup all derive from the helpers below so the rule cannot drift.

export const TRACKING_TEST_ACCOUNT_EMAIL = 'admin+o2oltest@erantpropertyservices.com';
// The owner's personal member accounts (he tests the site signed in as
// himself, not only as the admin). Household traffic is his own presence,
// never visitor truth. Account/Credit aggregates do NOT use this module's
// predicate (they carry their own role-only filters), so these accounts
// still exist as members everywhere it matters — only activity counting
// (registry, funnel, site usage, feature activity, presence) skips them.
export const TRACKING_HOUSEHOLD_EMAILS = [
  'izoemotors@gmail.com',
  'eranttrucking@gmail.com',
];
export const TRACKING_EXCLUDED_EMAILS = [
  TRACKING_TEST_ACCOUNT_EMAIL,
  ...TRACKING_HOUSEHOLD_EMAILS,
];
// Fresh start (owner order, 2026-10-24): of the accounts that existed
// before the fresh start, only Rhonda Campbell counts as a real outside
// member. The remaining pre-launch account is excluded by id (ids, not
// emails, so no member's address is written into the public repo).
// Every account created after the fresh start counts normally.
export const TRACKING_EXCLUDED_USER_IDS = [
  '374e87e4-ef00-48e6-ab10-448480a2d512',
];

// Automated-client rule (owner order, 2026-10-24): only visitors that can be
// verified as people from outside count. Requests from crawlers, link
// previewers, headless/automated browsers (our own QA included) and plain
// HTTP tools are dropped at ingest. A missing user agent is treated as
// automated. ANALYTICS_INGEST_DISABLED="1" turns ingest off entirely for a
// Worker (the production-certification Worker shares the live database).
const AUTOMATED_UA_PATTERN = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|playwright|puppeteer|selenium|webdriver|phantomjs|electron|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|curl\/|wget\/|python|node-fetch|undici|axios|go-http|java\/|okhttp|libwww|httpclient|scrapy|uptime|monitor|pingdom|statuscake/i;

export function isAutomatedUserAgent(userAgent) {
  const ua = String(userAgent || '').trim();
  if (!ua) return true;
  return AUTOMATED_UA_PATTERN.test(ua);
}

export function isUncountableRequest(request, env) {
  if (String(env?.ANALYTICS_INGEST_DISABLED || '') === '1') return true;
  return isAutomatedUserAgent(request?.headers?.get?.('user-agent'));
}
// v2 (2026-10-12 evening): the household widening — the same DELETE runs
// once more under a new key so historic rows recorded by the owner's
// personal accounts (and by browsers linked to them) are removed too.
export const TRACKING_EXCLUSION_CLEANUP_KEY = 'owner_tracking_cleanup_v2';

// Pure decision — unit-tested in tests/tracking-exclusion.test.js.
export function isExcludedAccountIdentity(identity) {
  if (!identity || typeof identity !== 'object') return false;
  if (String(identity.role || '').trim().toLowerCase() === 'admin') return true;
  if (identity.id && TRACKING_EXCLUDED_USER_IDS.includes(String(identity.id).trim().toLowerCase())) return true;
  return TRACKING_EXCLUDED_EMAILS.includes(String(identity.email || '').trim().toLowerCase());
}

// SQL predicate: TRUE when the neon_auth."user" row aliased `alias` is a
// countable (non-excluded) account. Mirrors isExcludedAccountIdentity.
export function accountCountableSql(alias) {
  const emailList = TRACKING_EXCLUDED_EMAILS.map((email) => `'${email}'`).join(',');
  const idList = TRACKING_EXCLUDED_USER_IDS.map((id) => `'${id}'`).join(',');
  return `(COALESCE(${alias}.role,'user') <> 'admin' AND lower(COALESCE(${alias}.email,'')) NOT IN (${emailList}) AND COALESCE(${alias}.id::text,'') NOT IN (${idList}))`;
}

// SQL predicate for any table's user column: TRUE when the row has no user
// or belongs to a countable account. Used by the trend charts (love notes,
// community, feature activity, payments) so excluded accounts never count.
export function userColumnCountableSql(column) {
  return `(${column} IS NULL OR ${column} NOT IN (SELECT o2ol_xa.id FROM neon_auth."user" o2ol_xa WHERE NOT ${accountCountableSql('o2ol_xa')}))`;
}

// SQL predicate for an interaction_events row: countable when it is
// anonymous (no user_id) or its signed-in account (auth alias) is countable.
export function eventActorCountableSql(eventAlias = 'e', authAlias = 'a') {
  return `(${eventAlias}.user_id IS NULL OR ${accountCountableSql(authAlias)})`;
}

// The common case (events aliased `e`, auth aliased `a`) as a constant,
// matching how worker/sweep-exclusion.js exposes SWEEP_EVENT_FILTER.
export const EVENT_ACTOR_COUNTABLE_SQL = eventActorCountableSql('e', 'a');

// Join + predicate that tie an interaction_events row (alias `e`) to the
// account its visitor is LINKED to via public.visitor_identity_links, so a
// visitor whose browser ever signed in as an excluded account is excluded
// even for their signed-out events. visitor_id is unique in the links
// table (launch-auth upserts ON CONFLICT(visitor_id)), so this stays 1:1.
export const VISITOR_LINK_JOINS_SQL = `LEFT JOIN public.visitor_identity_links o2ol_vil ON o2ol_vil.visitor_id=e.visitor_id
      LEFT JOIN neon_auth."user" o2ol_va ON o2ol_va.id=o2ol_vil.user_id`;
export const VISITOR_LINK_COUNTABLE_SQL = `AND (o2ol_vil.user_id IS NULL OR ${accountCountableSql('o2ol_va')})`;

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Defensive identity resolution for the ingest path. Returns true only when
// an identity is PROVEN excluded; any missing table, bad id, or query error
// resolves to false so real-visitor ingest can never break on this check.
export async function resolveIdentityExcluded(db, { visitorId = null, userId = null } = {}) {
  if (userId && UUID_PATTERN.test(String(userId))) {
    try {
      const result = await db.query(
        `SELECT id,role,email FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`,
        [String(userId)],
      );
      if (isExcludedAccountIdentity(result.rows[0])) return true;
    } catch { /* fall through to the visitor-link check */ }
  }
  if (visitorId) {
    try {
      const ready = await db.query(
        `SELECT to_regclass('public.visitor_identity_links') IS NOT NULL AS ready`,
      );
      if (ready.rows[0]?.ready) {
        const result = await db.query(
          `SELECT a.id AS id, a.role AS role, a.email AS email
             FROM public.visitor_identity_links vil
             JOIN neon_auth."user" a ON a.id=vil.user_id
            WHERE vil.visitor_id=$1
            LIMIT 1`,
          [String(visitorId)],
        );
        if (isExcludedAccountIdentity(result.rows[0])) return true;
      }
    } catch { /* defensive: never break ingest */ }
  }
  return false;
}

// Sign-in linking (owner-directed, 2026-10-12 evening): visitor_identity_
// links were only ever written at sign-up, so a browser that signed in —
// but never registered on that browser — could never be attributed to
// its account, and its signed-out trail stayed counted forever (the
// owner's laptop, locked out and anonymous, filled his own registry).
// The ingest paths now upsert this link from any authenticated event or
// presence ping. The guarded UPDATE keeps repeat pings write-light: the
// row only changes when it points at a different account. Defensive like
// the resolver: any failure returns false and never breaks ingest. This
// also serves the owner's counting rule that returning members show
// under their username instead of a visitor number.
export async function linkVisitorToAccount(db, { visitorId = null, userId = null } = {}) {
  if (!visitorId || !userId || !UUID_PATTERN.test(String(userId))) return false;
  const visitor = String(visitorId).trim().slice(0, 64);
  if (!visitor) return false;
  try {
    const ready = await db.query(
      `SELECT to_regclass('public.visitor_identity_links') IS NOT NULL AS ready`,
    );
    if (!ready.rows[0]?.ready) return false;
    await db.query(
      `INSERT INTO public.visitor_identity_links(visitor_id,user_id,link_source,linked_at,updated_at)
       VALUES($1,$2::uuid,'signed_in_activity',now(),now())
       ON CONFLICT(visitor_id) DO UPDATE SET
         user_id=EXCLUDED.user_id,
         link_source=EXCLUDED.link_source,
         updated_at=now()
       WHERE public.visitor_identity_links.user_id IS DISTINCT FROM EXCLUDED.user_id`,
      [visitor, String(userId)],
    );
    return true;
  } catch {
    return false;
  }
}

// One-time historic cleanup (owner-directed, 2026-10-12): delete the
// interaction_events rows recorded in the past by excluded accounts.
// Scoped STRICTLY to excluded identities — rows whose signed-in account
// (user_id) is an admin account or the Muse test account, plus rows
// whose visitor_id is linked to one via visitor_identity_links. The link
// rows themselves are kept (they are the mechanism that keeps those
// visitors excluded going forward). Idempotent: a persistent
// flag row records completion, and re-running the DELETE would match the
// same (by then empty) set anyway. Module-level promise so a warm isolate
// checks the flag at most once.
let cleanupPromise = null;
export function runTrackingExclusionCleanupOnce(db) {
  if (!cleanupPromise) {
    cleanupPromise = (async () => {
      try {
        const ready = await db.query(`
          SELECT to_regclass('public.interaction_events') IS NOT NULL AS events_ready,
                 to_regclass('public.visitor_identity_links') IS NOT NULL AS links_ready
        `);
        if (!ready.rows[0]?.events_ready || !ready.rows[0]?.links_ready) {
          return { ran: false, reason: 'tables_missing' };
        }
        await db.query(`
          CREATE TABLE IF NOT EXISTS public.o2ol_tracking_maintenance (
            key text PRIMARY KEY,
            applied_at timestamptz NOT NULL DEFAULT now()
          )`);
        const done = await db.query(
          `SELECT 1 FROM public.o2ol_tracking_maintenance WHERE key=$1`,
          [TRACKING_EXCLUSION_CLEANUP_KEY],
        );
        if (done.rows.length) return { ran: false, reason: 'already_applied' };
        const deleted = await db.query(`
          DELETE FROM public.interaction_events e
           WHERE e.user_id IN (
                   SELECT a.id FROM neon_auth."user" a
                    WHERE NOT ${accountCountableSql('a')}
                 )
              OR EXISTS (
                   SELECT 1
                     FROM public.visitor_identity_links vil
                     JOIN neon_auth."user" a ON a.id=vil.user_id
                    WHERE vil.visitor_id=e.visitor_id
                      AND NOT ${accountCountableSql('a')}
                 )`);
        await db.query(
          `INSERT INTO public.o2ol_tracking_maintenance(key) VALUES($1)
           ON CONFLICT(key) DO NOTHING`,
          [TRACKING_EXCLUSION_CLEANUP_KEY],
        );
        return { ran: true, deleted: deleted.rowCount ?? 0 };
      } catch {
        // Never break the caller (ingest) on a cleanup failure; the flag
        // stays unset so a later isolate retries.
        cleanupPromise = null;
        return { ran: false, reason: 'error' };
      }
    })();
  }
  return cleanupPromise;
}
