import test from 'node:test';
import assert from 'node:assert/strict';
import { isConsentProtectedSave } from '../worker/save-consent-rules.js';

test('member saves and sends require Terms + Disclaimer consent', () => {
  for (const [m, p] of [['POST','/api/memories'],['PATCH','/api/memories/abc'],['POST','/api/media/memories/x'],['POST','/api/journals'],['PUT','/api/goals/1'],['POST','/api/milestones'],['POST','/api/calendar-events'],['POST','/api/date-ideas'],['POST','/api/stories'],['POST','/api/love-notes/send-sms'],['POST','/api/love-notes/scheduled'],['POST','/api/love-notes/sent']]) {
    assert.equal(isConsentProtectedSave(m, p), true, `${m} ${p}`);
  }
});

test('reads, deletes and unrelated routes are not blocked', () => {
  for (const [m, p] of [['GET','/api/memories'],['DELETE','/api/memories/abc'],['POST','/api/consents/terms'],['POST','/api/voting/vote'],['POST','/api/memoriesx'],['POST','/api/love-notes/scheduled/abc/cancel'],['GET','/api/love-notes/sent']]) {
    assert.equal(isConsentProtectedSave(m, p), false, `${m} ${p}`);
  }
});
