import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const execution = read('docs/PRODUCTION_APPROVAL_EXECUTION.md');
const queue = read('docs/RELAUNCH_APPROVAL_QUEUE.md');

for (const marker of [
  '#1 — Love Notes invitation database foundation — COMPLETE',
  '#1A — Love Notes history view hardening — COMPLETE',
  '#2 — Love Notes server functions deployed DARK — COMPLETE',
  '#3 — Preserve existing Resend secret — COMPLETE POLICY DECISION',
  '#4 — Saved Love Notes database storage — COMPLETE',
  '#5 — Live Room messaging foundation + identity safeguards — COMPLETE',
  '#6 — Live Room report intake — COMPLETE',
  '#7 — Live Room identity hardening — SATISFIED / NO-OP',
]) {
  requireText(execution, marker, `Execution ledger is missing completed checkpoint: ${marker}`);
}

requireText(execution, '#8B — Community membership security — PENDING', 'Execution ledger must keep #8B pending.');
requireText(execution, '#8C — Presence + member-directory privacy — PENDING', 'Execution ledger must keep #8C pending.');
requireText(execution, 'A development commit, feature flag, migration file, Edge Function source file, or `continue uninterrupted` instruction is **not** production approval.', 'Execution ledger must distinguish uninterrupted development from production approval.');

requireText(queue, '### #8B — Community membership security — PENDING', 'Pending queue must identify #8B as the next production approval.');
requireText(queue, '**Do not apply #8B until the user explicitly says `Approve #8B.`**', 'Pending queue must require explicit #8B approval.');
requireText(queue, '### #8C — Presence + member-directory privacy — PENDING', 'Pending queue must keep #8C separate and pending.');
requireText(queue, '**#8C is a separate approval. Do not treat approval of #8B as approval of #8C.**', 'Pending queue must prevent approval scope creep from #8B to #8C.');
requireText(queue, 'Handle production approvals **one at a time**.', 'Pending queue must enforce one-at-a-time production approvals.');
requireText(queue, 'Privacy-request backend activation', 'Pending queue must retain privacy-request production activation as a future approval.');
requireText(queue, 'Production branch / Vercel cutover', 'Pending queue must retain production deployment as a future approval.');
requireText(queue, 'Relaunch membership billing / Stripe cutover', 'Pending queue must retain billing cutover as a future approval.');

// Completed live actions belong in the execution ledger, never back in the pending queue.
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

console.log('Production approval ledger preflight passed: completed live actions are separated from pending approvals, #8B/#8C remain scoped independently, and production approvals remain one-at-a-time.');
