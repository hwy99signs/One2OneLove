import fs from 'node:fs';

/**
 * One2OneLove production-release lock.
 *
 * Development and preview builds must remain free to continue. A Vercel PRODUCTION build,
 * however, must not be allowed to turn a relaunch-development commit into a public release
 * while owner approval is still pending or while the relaunch branch has not been deliberately
 * promoted to the production branch.
 *
 * This script performs no external action and changes no live state.
 */

const isProduction = String(process.env.VERCEL_ENV || '').toLowerCase() === 'production';
const gitRef = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim();
const failures = [];

const read = (file) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    failures.push(`${file}: missing or unreadable (${error.message})`);
    return '';
  }
};

const batch1 = read('docs/APPROVAL_BATCH_001_APPROVED.md');
const batch2 = read('docs/APPROVAL_BATCH_002.md');
const queue = read('docs/RELAUNCH_APPROVAL_QUEUE.md');

if (!batch1.includes('Status: **APPROVED**')) {
  failures.push('Approval Batch 001 must remain explicitly APPROVED before any production release.');
}

// Batch 002 is intentionally still collecting today. Preview/development builds are allowed,
// but a production build cannot proceed until its owner checkpoint is explicitly changed to
// an approved state in source control.
if (isProduction && !/Status:\s*\*\*APPROVED\*\*/.test(batch2)) {
  failures.push('Approval Batch 002 is not explicitly APPROVED; production release is locked.');
}

// The relaunch branch is a development branch. Production must come from the deliberately
// promoted production branch, never from a direct relaunch-homepage production deployment.
if (isProduction && gitRef && gitRef !== 'master') {
  failures.push(`Production deployment from branch “${gitRef}” is blocked; relaunch work must be deliberately promoted to master first.`);
}

// Queue headings may evolve; validate the actual production-cutover contract instead of a
// brittle exact heading. Both a Vercel/production cutover section and the explicit no-merge
// hold must remain present.
const hasCutoverSection = /###\s+Production branch\s*\/\s*(?:production\s+)?Vercel (?:deployment|cutover)/i.test(queue);
const hasExplicitHold = queue.includes('Do not merge to `master` or alter the One2OneLove production deployment without explicit approval.');
if (!hasCutoverSection || !hasExplicitHold) {
  failures.push('RELAUNCH_APPROVAL_QUEUE.md no longer contains the protected production/Vercel cutover checkpoint and explicit approval hold.');
}

if (failures.length) {
  console.error('\n⛔ One2OneLove production approval lock:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('\nNo production action was performed.\n');
  process.exit(1);
}

if (isProduction) {
  console.log('✅ One2OneLove production approval lock passed.');
} else {
  console.log('✅ One2OneLove production approval lock armed; this is not a production build, so development may continue.');
}
