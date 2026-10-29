// Text-only correction for the 4.5 MB self-contained game asset.
// We patch the Vite-copied public HTML at build time because uploading the
// entire embedded-image source file through the repository connector fails.
// No game logic, art, question data, scores, or board elements are changed.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const asset = fileURLToPath(new URL('../dist/games-src/i-thought-so.html', import.meta.url));
const oldFooter = 'I THOUGHT SO!&nbsp; BUILD v1.1.0';
const newFooter = 'I THOUGHT SO!&nbsp; BUILD v1.1.2';
const html = readFileSync(asset, 'utf8');
const count = html.split(oldFooter).length - 1;
if (count === 1) {
  writeFileSync(asset, html.replace(oldFooter, newFooter), 'utf8');
  console.log('I THOUGHT SO! footer: BUILD v1.1.2 (text-only asset correction)');
} else if (count === 0 && html.includes(newFooter)) {
  console.log('I THOUGHT SO! footer already BUILD v1.1.2');
} else {
  throw new Error('I THOUGHT SO! footer did not match the expected one-time text correction');
}
