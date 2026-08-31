import fs from 'node:fs';

/**
 * One2OneLove historical Approval Batch 002 — governance/development integrity gate.
 *
 * Batch 002 is superseded as a bulk production-approval mechanism. This check now proves
 * that the historical workstreams still have their development artifacts/gates while the
 * repository preserves completed live approvals and the current one-at-a-time rule.
 */

const failures = [];

const read = (file) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    failures.push(`${file}: missing or unreadable (${error.message})`);
    return '';
  }
};

const requireFile = (file) => {
  if (!fs.existsSync(file)) failures.push(`${file}: required historical Batch 002 development artifact is missing.`);
};

const requireToken = (file, token, description = token) => {
  const source = read(file);
  if (source && !source.includes(token)) failures.push(`${file}: missing ${description}.`);
};

const requiredArtifacts = [
  'supabase/migrations/20260818_chat_attachment_privacy.sql',
  'supabase/migrations/20260817_message_insert_hardening.sql',
  'src/lib/chatService.js',
  'supabase/functions/send-love-note-invitation/index.ts',
  'src/lib/loveNoteInvitationService.js',
  'supabase/migrations/20260818_premium_ai_tools.sql',
  'supabase/functions/relationship-coach/index.ts',
  'supabase/functions/generate-relationship-content/index.ts',
  'src/lib/relationshipCoachService.js',
  'src/lib/aiContentCreatorService.js',
  'supabase/migrations/20260818_date_ideas_hardening.sql',
  'src/lib/dateIdeasService.js',
  'src/pages/DateIdeasRelaunchBrowse.jsx',
  'supabase/migrations/20260818_relationship_goals_membership_hardening.sql',
  'src/lib/relationshipGoalsService.js',
  'src/pages/RelationshipGoalsRelaunch.jsx',
  'supabase/migrations/20260818_member_directory_minimization.sql',
  'supabase/migrations/20260820100500_presence_directory_privacy_reconciliation.sql',
  'supabase/migrations/20260820151000_member_directory_source_minimization.sql',
  'supabase/migrations/20260822004500_presence_directory_privacy_final.sql',
  'src/lib/buddyService.js',
  'supabase/migrations/20260818_privacy_requests.sql',
  'supabase/migrations/20260821211500_privacy_request_workflow_reconciliation.sql',
  'supabase/functions/privacy-request/index.ts',
  'supabase/functions/manage-privacy-requests/index.ts',
  'src/lib/privacyRequestService.js',
  'src/pages/PrivacyCenter.jsx',
  'src/pages/PrivacyRequests.jsx',
  'docs/APPROVAL_BATCH_002.md',
  'docs/APPROVAL_EXECUTION_20260820.md',
  'docs/RELAUNCH_APPROVAL_QUEUE.md',
  'docs/PRODUCTION_APPROVAL_EXECUTION.md',
];

requiredArtifacts.forEach(requireFile);

for (const [file, token, description] of [
  ['supabase/functions/send-love-note-invitation/index.ts', 'MEMBERSHIP_GATING_ENABLED', 'the Love Note membership rollout gate'],
  ['supabase/functions/relationship-coach/index.ts', 'PREMIUM_AI_ENABLED', 'the premium-AI rollout gate'],
  ['supabase/functions/relationship-coach/index.ts', 'MEMBERSHIP_GATING_ENABLED', 'the Relationship Coach membership gate'],
  ['supabase/functions/generate-relationship-content/index.ts', 'PREMIUM_AI_ENABLED', 'the premium-AI rollout gate'],
  ['supabase/functions/generate-relationship-content/index.ts', 'MEMBERSHIP_GATING_ENABLED', 'the AI Content Creator membership gate'],
  ['supabase/functions/privacy-request/index.ts', 'PRIVACY_REQUESTS_ENABLED', 'the server privacy-request rollout gate'],
  ['src/lib/privacyRequestService.js', 'VITE_PRIVACY_REQUESTS_ENABLED', 'the frontend privacy-request rollout gate'],
  ['src/pages/PrivacyRequests.jsx', "export { default } from './PrivacyCenter';", 'the canonical Privacy Center compatibility alias'],
]) requireToken(file, token, description);

const batch = read('docs/APPROVAL_BATCH_002.md');
for (const marker of [
  'SUPERSEDED — DO NOT EXECUTE AS A BULK BATCH',
  'There is no valid bulk “Approval Batch 002” execution instruction anymore.',
]) {
  if (batch && !batch.includes(marker)) failures.push(`APPROVAL_BATCH_002.md: missing retired-batch boundary “${marker}”.`);
}

const approvalQueue = read('docs/RELAUNCH_APPROVAL_QUEUE.md');
for (const boundary of [
  'Production branch / Vercel cutover',
  'SMS / external messaging activation',
  'No production action is automatically next',
  'Handle production approvals **one at a time**.',
]) {
  if (approvalQueue && !approvalQueue.includes(boundary)) {
    failures.push(`RELAUNCH_APPROVAL_QUEUE.md: missing protected production boundary “${boundary}”.`);
  }
}
for (const stale of [
  '### #8B — Community membership security — PENDING',
  '### #8C — Presence + member-directory privacy — PENDING',
]) {
  if (approvalQueue.includes(stale)) failures.push(`RELAUNCH_APPROVAL_QUEUE.md: completed approval regressed into pending queue: ${stale}`);
}

const executionLedger = read('docs/PRODUCTION_APPROVAL_EXECUTION.md');
for (const marker of [
  '#7 — Live Room identity hardening — SATISFIED / NO-OP',
  '#8B — Community membership security — COMPLETE',
  '#8C — Presence + member-directory privacy — COMPLETE',
  '#8C-A — Member-directory source minimization — COMPLETE',
]) {
  if (executionLedger && !executionLedger.includes(marker)) {
    failures.push(`PRODUCTION_APPROVAL_EXECUTION.md: completed approval ledger is missing “${marker}”.`);
  }
}

const retainedExecution = read('docs/APPROVAL_EXECUTION_20260820.md');
for (const marker of [
  '### Approval #8C — Presence and member-directory privacy reconciliation',
  '### Approval #8C-A — Member-directory source minimization',
]) {
  if (retainedExecution && !retainedExecution.includes(marker)) {
    failures.push(`APPROVAL_EXECUTION_20260820.md: retained execution evidence is missing “${marker}”.`);
  }
}

const packageJson = read('package.json');
if (packageJson && !packageJson.includes('"relaunch:private-feature-check"')) {
  failures.push('package.json: relaunch:private-feature-check must remain available.');
}

if (failures.length) {
  console.error('\n⛔ Historical Batch 002 governance/development integrity check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('\nNo production action was attempted. Restore the reviewed one-at-a-time approval boundary before release work continues.\n');
  process.exit(1);
}

console.log('✅ Historical Batch 002 artifacts/gates are present, completed live work through #8C-A is preserved, and the obsolete bulk-approval path remains retired.');
console.log('ℹ️ This is development readiness only. Production actions still require individual explicit approval.');
