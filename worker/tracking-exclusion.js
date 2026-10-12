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
//       the sign-up counter (admin+o2oltest@erantpropertyservices.com).
//
// This module is the single source for that decision: the ingest drop
// (worker/feature-usage.ts), the admin/analytics read-side filters
// (worker/admin.ts, worker/analytics.ts), and the one-time historic
// cleanup all derive from the helpers below so the rule cannot drift.

export const TRACKING_TEST_ACCOUNT_EMAIL = 'admin+o2oltest@erantpropertyservices.com';
export const TRACKING_EXCLUSION_CLEANUP_KEY = 'owner_tracking_cleanup_v1';

// Pure decision — unit-tested in tests/tracking-exclusion.test.js.
export function isExcludedAccountIdentity(identity) {
  if (!identity || typeof identity !== 'object') return false;
  if (String(identity.role || '').trim().toLowerCase() === 'admin') return true;
  return String(identity.email || '').trim().toLowerCase() === TRACKING_TEST_ACCOUNT_EMAIL;
}

// SQL predicate: TRUE when the neon_auth."user" row aliased `alias` is a
// countable (non-excluded) account. Mirrors isExcludedAccountIdentity.
export function accountCountableSql(alias) {
  return `(COALESCE(${alias}.role,'user') <> 'admin' AND lower(COALESCE(${alias}.email,'')) <> '${TRACKING_TEST_ACCOUNT_EMAIL}')`;
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
        `SELECT role,email FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`,
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
          `SELECT a.role AS role, a.email AS email
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
