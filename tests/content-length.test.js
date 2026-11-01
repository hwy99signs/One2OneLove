import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTENT_LENGTH_RULES, contentLengthPrompt, fitContentLength } from '../worker/content-length-rules.js';
import { CONTENT_LENGTH_LIMITS } from '../src/lib/contentShare.js';

const note = readFileSync(new URL('./fixtures/amora-reference-note.txt', import.meta.url), 'utf8').trim();
const up10 = (n) => Math.ceil(n / 10) * 10;

test('limits come from the owner reference note, rounded up to the nearest 10', () => {
  const lens = note.split('\n\n').map((p) => p.length).sort((a, b) => b - a);
  assert.equal(CONTENT_LENGTH_RULES.short.maxChars, up10(lens[0]));
  assert.equal(CONTENT_LENGTH_RULES.medium.maxChars, up10(lens[0] + lens[1]));
  assert.equal(CONTENT_LENGTH_RULES.long.maxChars, up10(note.length));
  assert.deepEqual([380, 700, 1070], ['short', 'medium', 'long'].map((k) => CONTENT_LENGTH_RULES[k].maxChars));
});

test('frontend labels match the worker limits', () => {
  for (const k of ['short', 'medium', 'long']) assert.equal(CONTENT_LENGTH_LIMITS[k], CONTENT_LENGTH_RULES[k].maxChars);
});

test('prompt states the character cap; unknown length falls back to medium', () => {
  assert.match(contentLengthPrompt('short'), /Never exceed 380 characters/);
  assert.match(contentLengthPrompt('bogus'), /Never exceed 700 characters/);
});

test('over-long output ends at a complete sentence within the cap', () => {
  assert.equal(fitContentLength(note, 'long'), note);
  const short = fitContentLength(note, 'short');
  assert.ok(short.length <= 380);
  assert.match(short, /[.!?…]$/);
  assert.equal(fitContentLength('Hi there.', 'short'), 'Hi there.');
});
