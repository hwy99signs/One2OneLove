import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRACKING_TEST_ACCOUNT_EMAIL,
  TRACKING_HOUSEHOLD_EMAILS,
  TRACKING_EXCLUSION_CLEANUP_KEY,
  isExcludedAccountIdentity,
  accountCountableSql,
  eventActorCountableSql,
  EVENT_ACTOR_COUNTABLE_SQL,
  VISITOR_LINK_COUNTABLE_SQL,
  linkVisitorToAccount,
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

test("the owner's personal member accounts are excluded (household)", () => {
  for (const email of TRACKING_HOUSEHOLD_EMAILS) {
    assert.equal(isExcludedAccountIdentity({ role: 'user', email }), true);
    assert.equal(isExcludedAccountIdentity({ role: 'user', email: ` ${email.toUpperCase()} ` }), true);
  }
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

test('accountCountableSql excludes admin role and every excluded email', () => {
  const sql = accountCountableSql('a');
  assert.ok(sql.includes("COALESCE(a.role,'user') <> 'admin'"));
  assert.ok(sql.includes("lower(COALESCE(a.email,'')) NOT IN ("));
  assert.ok(sql.includes(`'${TRACKING_TEST_ACCOUNT_EMAIL}'`));
  for (const email of TRACKING_HOUSEHOLD_EMAILS) assert.ok(sql.includes(`'${email}'`));
});

test('the historic cleanup is armed at v2 for the household widening', () => {
  assert.equal(TRACKING_EXCLUSION_CLEANUP_KEY, 'owner_tracking_cleanup_v2');
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

const HOUSEHOLD_ID = '44444444-4444-4444-8444-444444444444';

const USERS = {
  [ADMIN_ID]: { role: 'admin', email: 'owner@example.com' },
  [TEST_ID]: { role: 'user', email: TRACKING_TEST_ACCOUNT_EMAIL },
  [MEMBER_ID]: { role: 'user', email: 'member@example.com' },
  [HOUSEHOLD_ID]: { role: 'user', email: TRACKING_HOUSEHOLD_EMAILS[0] },
};

test('resolver: signed-in admin and test account are excluded', async () => {
  const db = fakeDb({ users: USERS });
  assert.equal(await resolveIdentityExcluded(db, { userId: ADMIN_ID }), true);
  assert.equal(await resolveIdentityExcluded(db, { userId: TEST_ID }), true);
  assert.equal(await resolveIdentityExcluded(db, { userId: MEMBER_ID }), false);
});

test('resolver: household accounts are excluded directly and by visitor link', async () => {
  const db = fakeDb({ users: USERS, links: { 'visitor-household': HOUSEHOLD_ID } });
  assert.equal(await resolveIdentityExcluded(db, { userId: HOUSEHOLD_ID }), true);
  assert.equal(await resolveIdentityExcluded(db, { visitorId: 'visitor-household' }), true);
});

// --- Sign-in linking ---------------------------------------------------------

test('link helper upserts a signed_in_activity link and stays defensive', async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes('to_regclass')) return { rows: [{ ready: true }] };
      return { rows: [] };
    },
  };
  assert.equal(await linkVisitorToAccount(db, { visitorId: 'visitor-1', userId: MEMBER_ID }), true);
  const upsert = calls.find((c) => c.sql.includes('INSERT INTO public.visitor_identity_links'));
  assert.ok(upsert);
  assert.ok(upsert.sql.includes("'signed_in_activity'"));
  assert.ok(upsert.sql.includes('ON CONFLICT(visitor_id) DO UPDATE'));
  assert.deepEqual(upsert.params, ['visitor-1', MEMBER_ID]);

  assert.equal(await linkVisitorToAccount(db, { visitorId: 'visitor-1', userId: 'not-a-uuid' }), false);
  assert.equal(await linkVisitorToAccount(db, { visitorId: '', userId: MEMBER_ID }), false);
  assert.equal(await linkVisitorToAccount(db, {}), false);

  const missingTableDb = {
    async query(sql) {
      if (sql.includes('to_regclass')) return { rows: [{ ready: false }] };
      throw new Error('must not reach the upsert');
    },
  };
  assert.equal(await linkVisitorToAccount(missingTableDb, { visitorId: 'v', userId: MEMBER_ID }), false);

  const failingDb = { async query() { throw new Error('db down'); } };
  assert.equal(await linkVisitorToAccount(failingDb, { visitorId: 'v', userId: MEMBER_ID }), false);
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
  for (const email of TRACKING_HOUSEHOLD_EMAILS) assert.ok(deleteSql.includes(email));
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

test('client: presence ping is the link carrier only while an excluded identity is signed in', async () => {
  const mod = await import('../src/lib/interactionAnalytics.js?presence=1');
  installWindowStub('');
  let tick = null;
  globalThis.window.setInterval = (fn) => { tick = fn; return 1; };
  globalThis.document = { addEventListener: () => {} };
  const fetches = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => { fetches.push(String(url)); return { ok: true }; };
  try {
    mod.installPresenceHeartbeat();
    assert.equal(fetches.length, 1); // ordinary anonymous ping
    mod.setAnalyticsIdentity({ role: 'user', email: 'izoemotors@gmail.com' });
    tick();
    assert.equal(fetches.length, 2); // link-carrier ping despite the flag
    mod.setAnalyticsIdentity(null); // signed out: silence resumes
    tick();
    assert.equal(fetches.length, 2);
    mod.setAnalyticsIdentity({ role: 'user', email: 'member@example.com' });
    tick();
    assert.equal(fetches.length, 2); // a regular member does not un-silence a flagged browser
    assert.ok(fetches.every((url) => url.includes('/api/site-presence/ping')));
  } finally {
    globalThis.fetch = realFetch;
    delete globalThis.document;
  }
});

test("client: the owner's own member accounts also exclude the browser", async () => {
  // Fresh module instance (query suffix): the identity flag above is
  // module-level state already set by the admin test.
  const { isTrackingExcluded, setAnalyticsIdentity } = await import('../src/lib/interactionAnalytics.js?household=1');
  installWindowStub('');
  setAnalyticsIdentity({ role: 'user', email: 'member@example.com' });
  assert.equal(isTrackingExcluded(), false);
  setAnalyticsIdentity({ role: 'user', email: 'izoemotors@gmail.com' });
  assert.equal(isTrackingExcluded(), true);
});

// --- Fresh start (owner order, 2026-10-24) ---------------------------------

test('excluded pre-launch account ids are excluded and appear in the SQL predicate', async () => {
  const mod = await import('../worker/tracking-exclusion.js');
  for (const id of mod.TRACKING_EXCLUDED_USER_IDS) {
    assert.equal(mod.isExcludedAccountIdentity({ id, role: 'user', email: 'someone@example.com' }), true);
    assert.ok(mod.accountCountableSql('a').includes(`'${id}'`));
  }
  assert.equal(mod.isExcludedAccountIdentity({ id: '29f23379-5da5-418b-b0a3-c43a75f4b784', role: 'user', email: 'member@example.com' }), false);
  assert.ok(mod.userColumnCountableSql('user_id').startsWith('(user_id IS NULL OR user_id NOT IN'));
});

test('automated clients are uncountable; ordinary browsers count', async () => {
  const { isAutomatedUserAgent, isUncountableRequest } = await import('../worker/tracking-exclusion.js');
  const automated = [
    '',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'curl/8.5.0',
    'python-requests/2.31.0',
  ];
  for (const ua of automated) assert.equal(isAutomatedUserAgent(ua), true, ua);
  const people = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/530.0.0.40.97]',
  ];
  for (const ua of people) assert.equal(isAutomatedUserAgent(ua), false, ua);
  const req = (ua) => ({ headers: new Headers(ua ? { 'user-agent': ua } : {}) });
  assert.equal(isUncountableRequest(req(people[0]), {}), false);
  assert.equal(isUncountableRequest(req(people[0]), { ANALYTICS_INGEST_DISABLED: '1' }), true);
  assert.equal(isUncountableRequest(req(automated[1]), {}), true);
});
