import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveClickIdentity,
  isPasswordVisibilityLabel,
  cleanAnalyticsUsername,
} from '../worker/click-labels.js';
import {
  clickAudienceLabel,
  setAnalyticsIdentity,
  getAnalyticsIdentity,
} from '../src/lib/interactionAnalytics.js';

// --- AUDIENCE derivation (admin Recent Click Details) ---

test('audience: member with username shows @username', () => {
  assert.equal(
    clickAudienceLabel({ username: 'jane_doe', user_id: 'u-1', actor_type: 'registered' }),
    '@jane_doe',
  );
});

test('audience: stored username with a leading @ is normalized, not doubled', () => {
  assert.equal(clickAudienceLabel({ username: '@jane_doe', user_id: 'u-1' }), '@jane_doe');
});

test('audience: member id without a username falls back to Member', () => {
  assert.equal(
    clickAudienceLabel({ username: null, user_id: 'u-1', actor_type: 'registered' }),
    'Member',
  );
});

test('audience: registered row without id or username still reads Member, never Anonymous', () => {
  assert.equal(clickAudienceLabel({ username: null, user_id: null, actor_type: 'registered' }), 'Member');
});

test('audience: guest row shows Anonymous', () => {
  assert.equal(
    clickAudienceLabel({ username: null, user_id: null, actor_type: 'anonymous' }),
    'Anonymous',
  );
  assert.equal(clickAudienceLabel({}), 'Anonymous');
  assert.equal(clickAudienceLabel({ username: 'not a username!', user_id: null, actor_type: 'anonymous' }), 'Anonymous');
});

// --- Identity resolution at ingest ---

const MEMBER = { userId: '11111111-1111-4111-8111-111111111111', role: 'user', username: 'jane_doe' };
const MEMBER_NO_NAME = { userId: MEMBER.userId, role: 'user', username: null };
const ADMIN = { userId: '22222222-2222-4222-8222-222222222222', role: 'admin', username: 'site_admin' };

test('identity: session member is registered with their stored username', () => {
  const resolved = resolveClickIdentity({ sessionRow: MEMBER });
  assert.equal(resolved.drop, false);
  assert.equal(resolved.userId, MEMBER.userId);
  assert.equal(resolved.actorType, 'registered');
  assert.equal(resolved.username, 'jane_doe');
});

test('identity: session member without a stored username takes their own claimed username', () => {
  const resolved = resolveClickIdentity({
    sessionRow: MEMBER_NO_NAME,
    claimedUserId: MEMBER.userId,
    claimedUsername: 'jane_doe',
  });
  assert.equal(resolved.actorType, 'registered');
  assert.equal(resolved.username, 'jane_doe');
});

test('identity: a claimed username for a DIFFERENT account is never used', () => {
  const resolved = resolveClickIdentity({
    sessionRow: MEMBER_NO_NAME,
    claimedUserId: ADMIN.userId,
    claimedUsername: 'someone_else',
  });
  assert.equal(resolved.userId, MEMBER.userId);
  assert.equal(resolved.username, null);
});

test('identity: link-verified claim resolves the member (sign-in page / return visit)', () => {
  const resolved = resolveClickIdentity({
    claimedRow: MEMBER,
    linkVerified: true,
    claimedUserId: MEMBER.userId,
    claimedUsername: null,
  });
  assert.equal(resolved.drop, false);
  assert.equal(resolved.userId, MEMBER.userId);
  assert.equal(resolved.actorType, 'registered');
  assert.equal(resolved.username, 'jane_doe');
});

test('identity: an unverified claim is ignored — the event stays anonymous', () => {
  const resolved = resolveClickIdentity({
    claimedRow: MEMBER,
    linkVerified: false,
    claimedUserId: MEMBER.userId,
    claimedUsername: 'jane_doe',
  });
  assert.deepEqual(resolved, { drop: false, userId: null, actorType: 'anonymous', username: null });
});

test('identity: guest with no session and no claim is anonymous', () => {
  assert.deepEqual(resolveClickIdentity({}), {
    drop: false, userId: null, actorType: 'anonymous', username: null,
  });
});

test('identity: admin session is dropped, never stored', () => {
  assert.equal(resolveClickIdentity({ sessionRow: ADMIN }).drop, true);
});

test('identity: admin role on a session stub (no account row) is still dropped', () => {
  const stub = { userId: null, role: 'admin', username: null };
  assert.equal(resolveClickIdentity({ sessionRow: stub }).drop, true);
});

test('identity: admin reached through a verified claim is dropped too', () => {
  const resolved = resolveClickIdentity({
    claimedRow: ADMIN,
    linkVerified: true,
    claimedUserId: ADMIN.userId,
  });
  assert.equal(resolved.drop, true);
  assert.equal(resolved.userId, null);
});

// --- Username hygiene ---

test('username: only real username shapes survive cleaning', () => {
  assert.equal(cleanAnalyticsUsername('jane_doe'), 'jane_doe');
  assert.equal(cleanAnalyticsUsername('@jane_doe'), 'jane_doe');
  assert.equal(cleanAnalyticsUsername('  jane.doe-1  '), 'jane.doe-1');
  assert.equal(cleanAnalyticsUsername('ab'), null);
  assert.equal(cleanAnalyticsUsername('has space'), null);
  assert.equal(cleanAnalyticsUsername(''), null);
  assert.equal(cleanAnalyticsUsername(null), null);
});

// --- Password-visibility toggles are not clicks ---

test('toggles: show/hide password labels match in all five site languages', () => {
  const labels = [
    'Show password', 'Hide password', 'Show confirm password', 'Hide confirm password',
    'Mostrar contraseña', 'Ocultar contraseña',
    'Afficher le mot de passe', 'Masquer le mot de passe',
    'Mostra password', 'Nascondi password',
    'Passwort anzeigen', 'Passwort ausblenden',
  ];
  for (const label of labels) assert.equal(isPasswordVisibilityLabel(label), true, label);
});

test('toggles: ordinary controls do not match', () => {
  const labels = ['Sign In', 'Show more', 'Password help', 'Forgot password?', '', null, undefined];
  for (const label of labels) assert.equal(isPasswordVisibilityLabel(label), false, String(label));
});

// --- Client identity holder ---

test('client identity: publishing a member attaches a normalized identity; clearing removes it', () => {
  setAnalyticsIdentity({ userId: MEMBER.userId, username: '@jane_doe' });
  assert.deepEqual(getAnalyticsIdentity(), { userId: MEMBER.userId, username: 'jane_doe' });
  setAnalyticsIdentity(null);
  assert.equal(getAnalyticsIdentity(), null);
  setAnalyticsIdentity({ username: 'jane_doe' });
  assert.equal(getAnalyticsIdentity(), null);
});
