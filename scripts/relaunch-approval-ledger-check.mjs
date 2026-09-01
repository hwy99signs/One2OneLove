import fs from 'node:fs';

const failures = [];
const read = (file) => fs.readFileSync(file, 'utf8');

const ledger = read('docs/PRODUCTION_APPROVAL_EXECUTION_20260831.md');
const queue = read('docs/RELAUNCH_APPROVAL_QUEUE.md');
const batch2 = read('docs/APPROVAL_BATCH_002.md');

for (const completed of [
  '#1', '#1A', '#2', '#3', '#4', '#5', '#6', '#7', '#8B', '#8C', '#8C-A',
]) {
  if (!ledger.includes(`**${completed}`)) failures.push(`Production ledger is missing completed approval ${completed}.`);
}

for (const forbidden of [
  '### Approval #8B',
  '### Approval #8C',
  '### Approval #8C-A',
]) {
  if (queue.includes(forbidden)) failures.push(`Pending queue must not re-list completed production checkpoint ${forbidden.replace('### Approval ', '')}.`);
}

for (const required of [
  'Privacy-request backend + review activation',
  'Production branch / Vercel cutover',
  'Stripe membership billing reconciliation and production cutover',
  'Real Love Notes delivery activation',
]) {
  if (!queue.includes(required)) failures.push(`Pending queue must retain future approval boundary: ${required}.`);
}

if (!queue.includes('Do not merge to `master` or alter the One2OneLove production deployment without explicit approval.')) {
  failures.push('Pending queue must preserve the explicit master/production deployment hold.');
}

if (!batch2.includes('Bulk approval is retired')) failures.push('Batch 002 must keep the obsolete bulk-approval path retired.');
if (!batch2.includes('one production checkpoint at a time')) failures.push('Batch 002 must preserve one-at-a-time production approval governance.');

if (failures.length) {
  console.error('\nProduction approval ledger blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Production approval ledger passed: completed live work is preserved, completed checkpoints cannot return to the pending queue, and future production actions remain individually approval-gated.');
