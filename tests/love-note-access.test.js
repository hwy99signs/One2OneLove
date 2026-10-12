import test from 'node:test';
import assert from 'node:assert/strict';
import { loveNoteAccessDecision } from '../worker/love-note-access.js';

// The Love Note send gate (owner rules): an active account with a VERIFIED
// phone number on file may send; everyone else is refused before any
// pricing or delivery work happens. The verified phone is the sender's
// FROM number, saved once through /api/phone-verification.

test('active account with a verified phone may send', () => {
  const decision = loveNoteAccessDecision({ is_active: true, phone_verified: true });
  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, 'free_verified_member');
});

test('no verified phone blocks the send with phone_verification_required', () => {
  for (const row of [
    { is_active: true, phone_verified: false },
    { is_active: true }, // column missing/falsey
    { is_active: true, phone_verified: null },
    {}, // no profile row yet — entitlement handler passes {}
    null,
    undefined,
  ]) {
    const decision = loveNoteAccessDecision(row);
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'phone_verification_required');
    assert.equal(decision.message, 'Phone verification is required before sending Love Notes.');
  }
});

test('inactive account is refused first, even with a verified phone', () => {
  const decision = loveNoteAccessDecision({ is_active: false, phone_verified: true });
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'account_inactive');
});

test('truthy non-boolean phone flags do not pass the gate', () => {
  // The SQL in love-note-entitlements.ts COALESCEs to a real boolean; the
  // decision still demands strict true so nothing else can slip through.
  assert.equal(loveNoteAccessDecision({ is_active: true, phone_verified: 1 }).allowed, false);
  assert.equal(loveNoteAccessDecision({ is_active: true, phone_verified: 'true' }).allowed, false);
});
