import test from 'node:test';
import assert from 'node:assert/strict';
import {
  USERNAME_FORMAT_MESSAGE,
  USERNAME_LOOKUP_SQL,
  USERNAME_REQUIRED_MESSAGE,
  USERNAME_TAKEN_CODE,
  USERNAME_TAKEN_MESSAGE,
  isValidUsername,
  usernameTakenByOtherAccount,
} from '../worker/username-rules.js';

// --- Format rule: the quick gate's rule, now shared by every sign-up ------

test('valid usernames pass (3-40 of letters, numbers, . _ -)', () => {
  assert.equal(isValidUsername('abc'), true);
  assert.equal(isValidUsername('Ronda.T_1970-x'), true);
  assert.equal(isValidUsername('a'.repeat(40)), true);
  assert.equal(isValidUsername('123'), true);
});

test('invalid usernames fail', () => {
  assert.equal(isValidUsername('ab'), false); // too short
  assert.equal(isValidUsername('a'.repeat(41)), false); // too long
  assert.equal(isValidUsername('two words'), false); // space
  assert.equal(isValidUsername('name@example.com'), false); // @ not allowed
  assert.equal(isValidUsername('café'), false); // non-ASCII letters
  assert.equal(isValidUsername(''), false);
  assert.equal(isValidUsername(null), false);
  assert.equal(isValidUsername(undefined), false);
  assert.equal(isValidUsername(12345), false);
});

// --- Uniqueness decision: taken only by a DIFFERENT account email ---------

test('no profile row means the username is free', () => {
  assert.equal(usernameTakenByOtherAccount(null, 'new@example.com'), false);
  assert.equal(usernameTakenByOtherAccount(undefined, 'new@example.com'), false);
});

test('same email re-submitting is not a conflict (resumed registration)', () => {
  assert.equal(usernameTakenByOtherAccount({ email: 'Member@Example.com' }, 'member@example.com'), false);
});

test('a different email holding the username is a conflict', () => {
  assert.equal(usernameTakenByOtherAccount({ email: 'other@example.com' }, 'member@example.com'), true);
  assert.equal(usernameTakenByOtherAccount({ email: '' }, 'member@example.com'), true);
  assert.equal(usernameTakenByOtherAccount({}, 'member@example.com'), true);
});

// --- SQL + contract constants ----------------------------------------------

test('uniqueness probe reads the canonical column case-insensitively', () => {
  assert.ok(USERNAME_LOOKUP_SQL.includes('FROM public.users'));
  assert.ok(USERNAME_LOOKUP_SQL.includes('lower(u.username)=lower($1)'));
});

test('error contract matches the quick gate behaviour', () => {
  assert.equal(USERNAME_TAKEN_CODE, 'username_taken');
  assert.equal(USERNAME_TAKEN_MESSAGE, 'That username is already taken. Please choose another.');
  assert.ok(USERNAME_FORMAT_MESSAGE.includes('3–40'));
  assert.equal(USERNAME_REQUIRED_MESSAGE, 'Please choose a username.');
});
