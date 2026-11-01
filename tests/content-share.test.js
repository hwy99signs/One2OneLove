import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_FOOTER, withContentFooter, fitForX } from '../src/lib/contentShare.js';

test('footer is one2onelove with two hearts', () => {
  assert.equal(CONTENT_FOOTER, 'one2onelove 💕');
  assert.equal(withContentFooter('  Hi love  '), 'Hi love\n\none2onelove 💕');
});

test('X post stays within 280 characters (links count as 23)', () => {
  const link = 'https://one2onelove.com/i/ABCD23';
  const post = fitForX('x'.repeat(1000), link);
  const counted = post.replace(link, 'L'.repeat(23)).length;
  assert.ok(counted <= 280, String(counted));
  assert.ok(post.endsWith(`${CONTENT_FOOTER} ${link}`));
  assert.equal(fitForX('Short note', link), `Short note\n\n${CONTENT_FOOTER} ${link}`);
});
