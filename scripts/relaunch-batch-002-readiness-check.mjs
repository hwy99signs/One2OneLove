import fs from 'node:fs';

/**
 * One2OneLove Approval Batch 002 — DEVELOPMENT readiness gate.
 *
 * This check does not authorize or execute any production action. It only proves that the
 * reviewed development pieces collected in docs/APPROVAL_BATCH_002.md still exist together
 * and that the important rollout gates have not silently disappeared from source control.
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
  if (!fs.existsSync(file)) failures.push(`${file}: required Batch 002 development artifact is missing.`);
};

const requireToken = (file, token, description = token) => {
  const source = read(file);
  if (source && !source.includes(token)) failures.push(`${file}: missing ${description}.`);
};

const requiredArtifacts = [
  // A. Pairwise Chat attachments
  'supabase/migrations/20260818_chat_attachment_privacy.sql',
  'supabase/migrations/20260817_message_insert_hardening.sql',
  'src/lib/chatService.js',

  // B. Love Note mixed-access membership enforcement
  'supabase/functions/send-love-note-invitation/index.ts',
  'src/lib/loveNoteInvitationService.js',

  // D. Premium AI
  'supabase/migrations/20260818_premium_ai_tools.sql',
  'supabase/functions/relationship-coach/index.ts',
  'supabase/functions/generate-relationship-content/index.ts',
  'src/lib/relationshipCoachService.js',
  'src/lib/aiContentCreatorService.js',

  // E. Free Date Ideas persistence
  'supabase/migrations/20260818_date_ideas_hardening.sql',
  'src/lib/dateIdeasService.js',
  'src/pages/DateIdeasRelaunchBrowse.jsx',

  // F. Paid Relationship Goals persistence
  'supabase/migrations/20260818_relationship_goals_membership_hardening.sql',
  'src/lib/relationshipGoalsService.js',
  'src/pages/RelationshipGoalsRelaunch.jsx',

  // G. Member-directory privacy minimization
  'supabase/migrations/20260818_member_directory_minimization.sql',
  'src/lib/buddyService.js',

  // H. Privacy/account-data request intake
  'supabase/migrations/20260818_privacy_requests.sql',
  'supabase/functions/privacy-request/index.ts',
  'src/lib/privacyRequestService.js',
  'src/pages/PrivacyCenter.jsx',

  // Approval/governance source of truth
  'docs/APPROVAL_BATCH_002.md',
  'docs/RELAUNCH_APPROVAL_QUEUE.md',
];

requiredArtifacts.forEach(requireFile);

// Rollout gates must remain explicit in server code. Their live values are production
// configuration and are intentionally NOT changed or asserted by this development check.
requireToken(
  'supabase/functions/send-love-note-invitation/index.ts',
  'MEMBERSHIP_GATING_ENABLED',
  'the Love Note membership rollout gate',
);
requireToken(
  'supabase/functions/relationship-coach/index.ts',
  'PREMIUM_AI_ENABLED',
  'the premium-AI rollout gate',
);
requireToken(
  'supabase/functions/relationship-coach/index.ts',
  'MEMBERSHIP_GATING_ENABLED',
  'the Relationship Coach membership gate',
);
requireToken(
  'supabase/functions/generate-relationship-content/index.ts',
  'PREMIUM_AI_ENABLED',
  'the premium-AI rollout gate',
);
requireToken(
  'supabase/functions/generate-relationship-content/index.ts',
  'MEMBERSHIP_GATING_ENABLED',
  'the AI Content Creator membership gate',
);
requireToken(
  'supabase/functions/privacy-request/index.ts',
  'PRIVACY_REQUESTS_ENABLED',
  'the server privacy-request rollout gate',
);
requireToken(
  'src/lib/privacyRequestService.js',
  'VITE_PRIVACY_REQUESTS_ENABLED',
  'the frontend privacy-request rollout gate',
);

// Approved Batch 002 still has to remain an approval collection, not an accidental release
// instruction. Changing this status is a deliberate owner checkpoint, not a coding side effect.
const batch = read('docs/APPROVAL_BATCH_002.md');
if (batch && !batch.includes('COLLECTING — DO NOT EXECUTE YET')) {
  failures.push('APPROVAL_BATCH_002.md: development work must not silently change the owner approval status.');
}

const approvalQueue = read('docs/RELAUNCH_APPROVAL_QUEUE.md');
for (const boundary of [
  'Production branch / production Vercel deployment',
  'SMS provider activation',
]) {
  if (approvalQueue && !approvalQueue.includes(boundary)) {
    failures.push(`RELAUNCH_APPROVAL_QUEUE.md: missing protected production boundary “${boundary}”.`);
  }
}

// The existing detailed private-feature preflight remains the controlled-test dependency
// named by Batch 002. This aggregate check makes sure that contract cannot disappear.
const packageJson = read('package.json');
if (packageJson && !packageJson.includes('"relaunch:private-feature-check"')) {
  failures.push('package.json: Batch 002 requires the relaunch:private-feature-check command to remain available.');
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Approval Batch 002 development readiness check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error('\nNo production action was attempted. Restore the reviewed development boundary before release work continues.\n');
  process.exit(1);
}

console.log('✅ Approval Batch 002 development artifacts and rollout gates are present.');
console.log('ℹ️ This is development readiness only. It does not approve migrations, billing, providers, secrets, or production deployment.');
