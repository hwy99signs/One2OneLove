import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLocalDate } from '../src/utils/localDate.js';

test('Postgres DATE values parse as the same local calendar day', () => {
  for (const v of ['2026-11-01', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00Z']) {
    const d = parseLocalDate(v);
    assert.ok(d, v);
    assert.deepEqual([d.getFullYear(), d.getMonth() + 1, d.getDate()], [2026, 11, 1], v);
  }
});

test('invalid or empty values return null instead of throwing', () => {
  assert.equal(parseLocalDate(''), null);
  assert.equal(parseLocalDate(null), null);
  assert.equal(parseLocalDate('not-a-date'), null);
});
