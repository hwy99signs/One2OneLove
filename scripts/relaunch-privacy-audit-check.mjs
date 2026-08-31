import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');

const reconciliation = read('supabase/migrations/20260821211500_privacy_request_workflow_reconciliation.sql');
const finalizer = read('supabase/migrations/20260821224500_privacy_request_submission_audit.sql');
const memberFn = read('supabase/functions/privacy-request/index.ts');
const adminFn = read('supabase/functions/manage-privacy-requests/index.ts');

for (const required of [
  'create or replace function o2ol_private.audit_privacy_request_state()',
  'security invoker',
  "set search_path = ''",
  "values (new.id, new.user_id, 'submitted')",
  "audit_action := 'staff_accepted_for_fulfillment'",
  "audit_action := 'staff_rejected'",
  "audit_action := case when old.status='submitted' then 'staff_started' else 'staff_reopened' end",
  'create trigger privacy_requests_audit_state',
  'after insert or update of status on public.privacy_requests',
  'revoke all on function o2ol_private.audit_privacy_request_state() from public, anon, authenticated;',
]) {
  if (!reconciliation.includes(required)) failures.push(`Privacy atomic-audit reconciliation missing safeguard: ${required}`);
}

for (const required of [
  'drop trigger if exists privacy_requests_audit_submission on public.privacy_requests;',
  'drop function if exists public.audit_privacy_request_submission();',
  'O2OL_PRIVACY_ATOMIC_AUDIT_TRIGGER_MISSING',
  'O2OL_PRIVACY_ATOMIC_AUDIT_FUNCTION_MISSING',
  'Exactly one non-internal privacy audit trigger exists',
]) {
  if (!finalizer.includes(required)) failures.push(`Privacy audit finalizer missing safeguard: ${required}`);
}

for (const forbidden of ['delete from auth.users', 'auth.admin', 'stripe', 'resend', 'twilio']) {
  if (reconciliation.toLowerCase().includes(forbidden.toLowerCase()) || finalizer.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`Privacy audit migrations must remain non-destructive/provider-free: ${forbidden}`);
  }
}

for (const [label, source] of [['member', memberFn], ['staff', adminFn]]) {
  if (source.includes(".from('privacy_request_audit')")) {
    failures.push(`${label} privacy Edge Function must not perform second-step audit writes; audit is database-atomic.`);
  }
}

if (!adminFn.includes("status: accepted ? 'awaiting_fulfillment' : 'declined'")) {
  failures.push('Staff privacy review must accept into awaiting_fulfillment rather than a false completed state.');
}
if (!adminFn.includes("PRIVACY_FULFILLMENT_NOT_AVAILABLE")) {
  failures.push('Staff privacy review must explicitly reject complete/fulfill actions until a real fulfillment workflow exists.');
}
if (adminFn.includes("status: 'completed'") || adminFn.includes("action: 'staff_completed'")) {
  failures.push('Staff privacy review must not retain the retired completed/staff_completed semantics.');
}

if (failures.length) {
  console.error('\nPrivacy request audit blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Privacy request audit preflight passed: one database-atomic lifecycle trigger owns all audit events and review cannot claim fulfillment.');
