import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRACKING_TEST_ACCOUNT_EMAIL,
  isExcludedAccountIdentity,
  accountCountableSql,
  eventActorCountableSql,
  EVENT_ACTOR_COUNTABLE_SQL,
  VISITOR_LINK_COUNTABLE_SQL,
  resolveIdentityExcluded,
  runTrackingExclusionCleanupOnce,
} from '../worker/tracking-exclusion.js';

// --- Pure decision: isExcludedAccountIdentity -------------------------------

test('admin role is excluded (any case/whitespace)', () => {
  assert.equal(isExcludedAccountIdentity({ role: 'admin' }), true);
  assert.equal(isExcludedAccountIdentity({ role: ' Admin ' }), true);
  assert.equal(isExcludedAccountIdentity({ role: 'ADMIN', email: 'someone@example.com' }), true);
});

test('the Muse test account email is excluded (any case/whitespace)', () => {
  assert.equal(isExcludedAccountIdentity({ role: 'user', email: TRACKING_TEST_ACCOUNT_EMAIL }), true);
  assert.equal(isExcludedAccountIdentity({ email: ' Admin+O2OLTest@ErantPropertyServices.com ' }), true);
});

test('regular members and empty identities are NOT excluded', () => {
  assert.equal(isExcludedAccountIdentity({ role: 'user', email: 'member@example.com' }), false);
  assert.equal(isExcludedAccountIdentity({ role: 'user' }), false);
  assert.equal(isExcludedAccountIdentity({}), false);
  assert.equal(isExcludedAccountIdentity(null), false);
  assert.equal(isExcludedAccountIdentity(undefined), false);
  assert.equal(isExcludedAccountIdentity('admin'), false);
});

// --- SQL fragments mirror the JS decision -----------------------------------

test('accountCountableSql excludes admin role and the test email', () => {
  const sql = accountCountableSql('a');
  assert.ok(sql.includes("COALESCE(a.role,'user') <> 'admin'"));
  assert.ok(sql.includes(`lower(COALESCE(a.email,'')) <> '${TRACKING_TEST_ACCOUNT_EMAIL}'`));
});

test('event actor predicate keeps anonymous rows countable', () => {
  assert.ok(EVENT_ACTOR_COUNTABLE_SQL.startsWith('(e.user_id IS NULL OR '));
  assert.equal(eventActorCountableSql('x', 'y').includes('x.user_id IS NULL'), true);
  assert.ok(VISITOR_LINK_COUNTABLE_SQL.includes('o2ol_vil.user_id IS NULL'));
});

// --- Defensive ingest resolution (fake db) -----------------------------------

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const TEST_ID = '22222222-2222-4222-8222-222222222222';
const MEMBER_ID = '33333333-3333-4333-8333-333333333333';

function fakeDb({ users = {}, links = {}, linksTableReady = true, failAll = false } = {}) {
  return {
    async query(sql, params = []) {
      if (failAll) throw new Error('db down');
      if (sql.includes('to_regclass')) return { rows: [{ ready: linksTableReady }] };
      if (sql.includes('visitor_identity_links')) {
        const userId = links[params[0]];
        const identity = userId ? users[userId] : null;
        return { rows: identity ? [{ role: identity.role, email: identity.email }] : [] };
      }
      if (sql.includes('neon_auth."user"')) {
        const identity = users[params[0]] || null;
        return { rows: identity ? [identity] : [] };
      }
      throw new Error('unexpected query: ' + sql);
    },
  };
}

const USERS = {
  [ADMIN_ID]: { role: 'admin', email: 'owner@example.com' },
  [TEST_ID]: { role: 'user', email: TRACKING_TEST_ACCOUNT_EMAIL },
  [MEMBER_ID]: { role: 'user', email: 'member@example.com' },
};

test('resolver: signed-in admin and test account are excluded', async () => {
  const db = fakeDb({ users: USERS });
  assert.equal(await resolveIdentityExcluded(db, { userId: ADMIN_ID }), true);
  assert.equal(await resolveIdentityExcluded(db, { userId: TEST_ID }), true);
  assert.equal(await resolveIdentityExcluded(db, { userId: MEMBER_ID }), false);
});

test('resolver: visitor linked to an excluded account is excluded', async () => {
  const db = fakeDb({ users: USERS, links: { 'visitor-owner': ADMIN_ID, 'visitor-test': TEST_ID, 'visitor-member': MEMBER_ID } });
  assert.equal(await resolveIdentityExcluded(db, { visitorId: 'visitor-owner' }), true);
  assert.equal(await resolveIdentityExcluded(db, { visitorId: 'visitor-test' }), true);
  assert.equal(await resolveIdentityExcluded(db, { visitorId: 'visitor-member' }), false);
  assert.equal(await resolveIdentityExcluded(db, { visitorId: 'visitor-unknown' }), false);
});

test('resolver: failures and missing tables resolve to NOT excluded', async () => {
  assert.equal(await resolveIdentityExcluded(fakeDb({ failAll: true }), { visitorId: 'v', userId: ADMIN_ID }), false);
  assert.equal(await resolveIdentityExcluded(fakeDb({ users: USERS, linksTableReady: false }), { visitorId: 'visitor-owner' }), false);
  assert.equal(await resolveIdentityExcluded(fakeDb({ users: USERS }), { userId: 'not-a-uuid' }), false);
  assert.equal(await resolveIdentityExcluded(fakeDb({ users: USERS }), {}), false);
});

// --- One-time historic cleanup ----------------------------------------------

test('cleanup deletes only excluded-identity rows (actor or link), exactly once', async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push(sql);
      if (sql.includes('to_regclass')) return { rows: [{ events_ready: true, links_ready: true }] };
      if (sql.includes('CREATE TABLE')) return { rows: [] };
      if (sql.includes('o2ol_tracking_maintenance') && sql.includes('SELECT')) return { rows: [] };
      if (sql.includes('DELETE FROM public.interaction_events')) return { rows: [], rowCount: 7 };
      if (sql.includes('INSERT INTO public.o2ol_tracking_maintenance')) return { rows: [], rowCount: 1 };
      throw new Error('unexpected query: ' + sql);
    },
  };
  const first = await runTrackingExclusionCleanupOnce(db);
  assert.equal(first.ran, true);
  assert.equal(first.deleted, 7);
  const deleteSql = calls.find((sql) => sql.includes('DELETE FROM public.interaction_events'));
  assert.ok(deleteSql.includes('public.visitor_identity_links'));
  assert.ok(deleteSql.includes('vil.visitor_id=e.visitor_id'));
  assert.ok(deleteSql.includes('e.user_id IN'));
  assert.ok(deleteSql.includes(TRACKING_TEST_ACCOUNT_EMAIL));
  assert.ok(!deleteSql.includes('DELETE FROM public.visitor_identity_links'));
  const callsAfterFirst = calls.length;
  const second = await runTrackingExclusionCleanupOnce(db);
  assert.equal(second.ran, true); // same cached promise — no new queries
  assert.equal(calls.length, callsAfterFirst);
});

// --- Client tracker exclusion (src/lib/interactionAnalytics.js) -------------

function installWindowStub(search = '') {
  const store = new Map();
  globalThis.window = {
    location: { search, origin: 'https://one2onelove.com', pathname: '/', href: 'https://one2onelove.com/' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: () => {},
  };
  return store;
}

test('client: ?o2ol_exclude=1 sets the permanent flag', async () => {
  const { isTrackingExcluded } = await import('../src/lib/interactionAnalytics.js');
  const store = installWindowStub('?o2ol_exclude=1');
  assert.equal(isTrackingExcluded(), true);
  assert.equal(store.get('o2ol_tracking_excluded'), '1');
  globalThis.window.location.search = '';
  assert.equal(isTrackingExcluded(), true); // persists without the param
});

test('client: admin identity excludes permanently; non-admin never sets or clears it', async () => {
  const { isTrackingExcluded, setAnalyticsIdentity } = await import('../src/lib/interactionAnalytics.js');
  const store = installWindowStub('');
  setAnalyticsIdentity({ role: 'user' });
  assert.equal(isTrackingExcluded(), false);
  setAnalyticsIdentity(null);
  assert.equal(isTrackingExcluded(), false);
  setAnalyticsIdentity({ role: 'admin' });
  assert.equal(isTrackingExcluded(), true);
  assert.equal(store.get('o2ol_tracking_excluded'), '1');
  setAnalyticsIdentity({ role: 'user' }); // a later member sign-in must not clear it
  assert.equal(isTrackingExcluded(), true);
  setAnalyticsIdentity(null); // sign-out must not clear it either
  assert.equal(isTrackingExcluded(), true);
});
