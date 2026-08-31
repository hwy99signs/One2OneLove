import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const execution = read('docs/PRODUCTION_APPROVAL_EXECUTION.md');
const queue = read('docs/RELAUNCH_APPROVAL_QUEUE.md');
const retainedExecution = read('docs/APPROVAL_EXECUTION_20260820.md');

for (const marker of [
  '#1 — Love Notes invitation database foundation — COMPLETE',
  '#1A — Love Notes history view hardening — COMPLETE',
  '#2 — Love Notes server functions deployed DARK — COMPLETE',
  '#3 — Preserve existing Resend secret — COMPLETE POLICY DECISION',
  '#4 — Saved Love Notes database storage — COMPLETE',
  '#5 — Live Room messaging foundation + identity safeguards — COMPLETE',
  '#6 — Live Room report intake — COMPLETE',
  '#7 — Live Room identity hardening — SATISFIED / NO-OP',
  '#8B — Community membership security — COMPLETE',
  '#8C — Presence + member-directory privacy — COMPLETE',
  '#8C-A — Member-directory source minimization — COMPLETE',
]) {
  requireText(execution, marker, `Execution ledger is missing completed checkpoint: ${marker}`);
}

for (const marker of [
  '### Approval #8C — Presence and member-directory privacy reconciliation',
  '### Approval #8C-A — Member-directory source minimization',
]) {
  requireText(retainedExecution, marker, `Retained 2026-08-20 execution evidence is missing: ${marker}`);
}

requireText(execution, '**#8C is already live. Do not reapply it.**', 'Execution ledger must explicitly prohibit replaying completed #8C.');
requireText(execution, '**#8C-A is already live. Do not reapply it.**', 'Execution ledger must explicitly prohibit replaying completed #8C-A.');
requireText(execution, 'A development commit, feature flag, migration file, Edge Function source file, or instruction to `continue uninterrupted` is **not** production approval.', 'Execution ledger must distinguish uninterrupted development from production approval.');
requireText(execution, 'development/recovery reference for fresh or materially drifted environments', 'Canonical #8C development migration must be documented as recovery/reference only.');

for (const stale of [
  '### #8B — Community membership security — PENDING',
  '### #8C — Presence + member-directory privacy — PENDING',
  '**Do not apply #8C until the user explicitly says `Approve #8C.`**',
]) {
  forbidText(queue, stale, `Completed approval must not regress into the pending queue: ${stale}`);
}

requireText(queue, 'Completed production approvals through **#8C-A**', 'Pending queue must acknowledge completed production state through #8C-A.');
requireText(queue, 'No production action is automatically next', 'Pending queue must not infer a production mutation from development progress.');
requireText(queue, 'must **not** be applied to the existing production project merely because it is newer', 'Queue must prohibit casual replay of the canonical #8C migration.');
requireText(queue, 'Handle production approvals **one at a time**.', 'Pending queue must enforce one-at-a-time production approvals.');
requireText(queue, 'Privacy-request backend activation', 'Pending queue must retain privacy-request production activation as a future approval.');
requireText(queue, 'SMS / external messaging activation', 'Pending queue must retain SMS/external messaging as a future approval.');
requireText(queue, 'verified number control', 'Pending SMS activation must require verified destination control before active consent.');
requireText(queue, 'Production branch / Vercel cutover', 'Pending queue must retain production deployment as a future approval.');
requireText(queue, 'Professional application review', 'Pending queue must retain professional application review as a future approval.');
requireText(queue, 'O2OL_PROFESSIONAL_APPLICATION_ADMIN_USER_IDS', 'Pending queue must protect production reviewer authority behind an explicit server allowlist.');
requireText(queue, 'Relaunch membership billing / Stripe cutover', 'Pending queue must retain billing cutover as a future approval.');

for (const stale of [
  'Apply `supabase/migrations/20260817_love_note_invitations.sql` to the live Supabase project.',
  'Apply `supabase/migrations/20260817_love_note_saves.sql` to activate persistent Saved Love Notes.',
  'Apply `supabase/migrations/20260817_live_room_messaging.sql` to the live database.',
  'Apply `supabase/migrations/20260817_live_room_moderation.sql`.',
  'Apply `supabase/migrations/20260817_live_room_identity_hardening.sql`.',
]) {
  forbidText(queue, stale, `Completed/retired live action must not reappear as pending: ${stale}`);
}

if (failures.length) {
  console.error('\nProduction approval ledger blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Production approval ledger preflight passed: completed live work through #8C-A is locked against replay, pending work remains explicit, and production approvals remain one-at-a-time.');
