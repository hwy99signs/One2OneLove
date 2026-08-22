import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');

const migration = read('supabase/migrations/20260821224500_privacy_request_submission_audit.sql');
const memberFn = read('supabase/functions/privacy-request/index.ts');
const adminFn = read('supabase/functions/manage-privacy-requests/index.ts');

for (const required of [
  'DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.',
  'create or replace function public.audit_privacy_request_submission()',
  'security invoker',
  "set search_path = ''",
  "action\n  ) values (\n    new.id,\n    new.user_id,\n    'submitted'",
  'revoke all on function public.audit_privacy_request_submission() from public, anon, authenticated;',
  'create trigger privacy_requests_audit_submission',
  'after insert on public.privacy_requests',
]) {
  if (!migration.includes(required)) failures.push(`Privacy submission-audit migration missing safeguard: ${required}`);
}

for (const forbidden of [
  'delete from auth.users',
  'auth.admin',
  'stripe',
  'resend',
  'twilio',
]) {
  if (migration.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`Privacy submission-audit migration must remain non-destructive/provider-free: ${forbidden}`);
  }
}

// Submission auditing is database-owned so retries/handlers cannot accidentally create
// duplicate audit rows by also inserting a `submitted` event in application code.
if (memberFn.includes("action: 'submitted'") || memberFn.includes("action: \"submitted\"")) {
  failures.push('Member privacy Edge Function must not duplicate the database-owned submitted audit event.');
}

for (const required of [
  "action: 'staff_started'",
  "action: completed ? 'staff_completed' : 'staff_rejected'",
  "action: 'staff_reopened'",
]) {
  if (!adminFn.includes(required)) failures.push(`Privacy staff workflow missing audit event: ${required}`);
}

if (failures.length) {
  console.error('\nPrivacy request audit blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Privacy request audit preflight passed: submissions are audited once by the database and staff lifecycle actions remain explicitly audited.');
