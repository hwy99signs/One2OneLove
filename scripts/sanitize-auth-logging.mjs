import fs from 'node:fs';

const file = 'src/contexts/AuthContext.jsx';
const source = fs.readFileSync(file, 'utf8');
// Authentication/account state should never be emitted to the browser console.
// Keep this list explicit so a newly introduced diagnostic method cannot be
// mistaken for approved production logging. Trace calls are covered too.
const prefixes = ['console.log', 'console.warn', 'console.error', 'console.debug', 'console.info', 'console.trace'];

function findClosingParen(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

let output = '';
let cursor = 0;
let removed = 0;

while (cursor < source.length) {
  let matchIndex = -1;
  let matchedPrefix = '';
  for (const prefix of prefixes) {
    const index = source.indexOf(prefix, cursor);
    if (index >= 0 && (matchIndex < 0 || index < matchIndex)) {
      matchIndex = index;
      matchedPrefix = prefix;
    }
  }

  if (matchIndex < 0) {
    output += source.slice(cursor);
    break;
  }

  output += source.slice(cursor, matchIndex);
  const before = source[matchIndex - 1] || '';
  if (/[\w$]/.test(before)) {
    output += matchedPrefix;
    cursor = matchIndex + matchedPrefix.length;
    continue;
  }

  let openIndex = matchIndex + matchedPrefix.length;
  while (/\s/.test(source[openIndex] || '')) openIndex += 1;
  if (source[openIndex] !== '(') {
    output += matchedPrefix;
    cursor = matchIndex + matchedPrefix.length;
    continue;
  }

  const closeIndex = findClosingParen(source, openIndex);
  if (closeIndex < 0) throw new Error(`Could not parse ${matchedPrefix} call at offset ${matchIndex}`);

  let end = closeIndex + 1;
  while (source[end] === ' ' || source[end] === '\t') end += 1;
  if (source[end] === ';') end += 1;

  output += 'void 0;';
  cursor = end;
  removed += 1;
}

if (removed === 0) {
  console.log('AuthContext contains no console diagnostics to remove.');
  process.exit(0);
}

fs.writeFileSync(file, output);
console.log(`Removed ${removed} AuthContext console diagnostics.`);
