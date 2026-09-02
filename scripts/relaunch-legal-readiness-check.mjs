import fs from 'node:fs';

const approvalPath = 'docs/RELAUNCH_LEGAL_APPROVAL.md';

console.log('\nOne2OneLove relaunch legal-readiness check\n');

if (!fs.existsSync(approvalPath)) {
  console.error('❌ Legal approval checkpoint is missing.');
  process.exitCode = 1;
} else {
  const approval = fs.readFileSync(approvalPath, 'utf8');
  const approved = approval.includes('Status: **APPROVED**');

  if (approved) {
    console.log('✅ Final Privacy/Terms checkpoint is approved.');
  } else {
    console.error('❌ Final Privacy/Terms checkpoint is still PENDING.');
    console.error('Strict production preflight remains blocked by design.');
    process.exitCode = 1;
  }
}
