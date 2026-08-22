import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, message) => {
  if (!source.includes(needle)) failures.push(message);
};

const router = read('src/pages/index.jsx');
const closed = read('src/pages/ProfessionalApplicationsClosed.jsx');
const service = read('src/lib/professionalApplicationService.js');
const widget = read('src/components/signup/TurnstileWidget.jsx');
const fn = read('supabase/functions/submit-professional-application/index.ts');
const migration = read('supabase/migrations/20260817_professional_applications.sql');
const reviewMigration = read('supabase/migrations/20260822000500_professional_application_review_guard.sql');
const reviewFn = read('supabase/functions/manage-professional-applications/index.ts');

requireText(router, 'VITE_PROFESSIONAL_APPLICATIONS_ENABLED', 'Professional application routes must default behind an explicit frontend activation flag.');
requireText(router, 'ProfessionalApplicationsClosed', 'Closed application routes must render the truthful staged state.');
requireText(closed, 'No application was submitted from this page.', 'Closed application state must not imply intake occurred.');
requireText(service, "submit-professional-application", 'Professional application forms must use the private Edge Function service.');
requireText(widget, "professional_application", 'Turnstile widget must use the reviewed professional_application action.');

for (const required of [
  'PROFESSIONAL_APPLICATIONS_ENABLED',
  "Deno.env.get('PROFESSIONAL_APPLICATION_TURNSTILE_REQUIRED') !== 'true'",
  "return json(request, { error: 'ANTI_ABUSE_NOT_CONFIGURED' }, 503)",
  'PROFESSIONAL_APPLICATION_ALLOWED_ORIGINS',
  'const verifyTurnstile = async',
  'result?.action === TURNSTILE_ACTION',
  'expectedHostnames.has(hostname)',
  'THERAPIST_LICENSE_LOCATION_REQUIRED',
  'INFLUENCER_PLATFORM_REQUIRED',
  'PROFESSIONAL_ORGANIZATION_REQUIRED',
  'cleanUrlMap',
  ".select('id, application_type, status, created_at')",
]) requireText(fn, required, `Professional intake missing safeguard: ${required}`);

for (const required of [
  'alter table public.professional_applications enable row level security;',
  'revoke all on table public.professional_applications from anon, authenticated;',
  'create schema if not exists o2ol_private;',
  'create or replace function o2ol_private.set_professional_application_updated_at()',
  'security invoker',
  "set search_path = ''",
  'revoke all on function o2ol_private.set_professional_application_updated_at() from public, anon, authenticated;',
  'for each row execute function o2ol_private.set_professional_application_updated_at();',
]) requireText(migration, required, `Professional application storage missing safeguard: ${required}`);

for (const required of [
  'DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.',
  'create table if not exists public.professional_application_audit',
  'revoke all on table public.professional_application_audit from public, anon, authenticated;',
  'create or replace function o2ol_private.enforce_professional_application_review_state()',
  'O2OL_PRO_APPLICATION_CONTENT_IMMUTABLE',
  'O2OL_PRO_APPLICATION_INVALID_STATUS_TRANSITION',
  'O2OL_PRO_APPLICATION_VERIFICATION_REQUIRED',
  'create or replace function o2ol_private.audit_professional_application_review_state()',
  'insert into public.professional_application_audit',
  'after update on public.professional_applications',
]) requireText(reviewMigration, required, `Professional application review migration missing safeguard: ${required}`);

for (const required of [
  "Deno.env.get('PROFESSIONAL_APPLICATION_REVIEW_ENABLED') !== 'true'",
  "Deno.env.get('PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS') || ''",
  "Deno.env.get('O2OL_PROFESSIONAL_APPLICATION_ADMIN_USER_IDS')",
  'EMAIL_CONFIRMATION_REQUIRED',
  "error: 'O2OL_PRO_APPLICATION_ADMIN_REQUIRED'",
  "if (action === 'list')",
  "if (action === 'get')",
  "action === 'approve'",
  'APPLICATION_VERIFICATION_REQUIRED',
  'The database state trigger validates the transition/verification requirements',
]) requireText(reviewFn, required, `Professional application review endpoint missing safeguard: ${required}`);

if (/\.from\('users'\)[\s\S]{0,200}\.(update|insert|upsert)\(/.test(reviewFn)) {
  failures.push('Professional application review endpoint must never assign a users role or mutate a member account.');
}
if (reviewFn.includes('auth.admin') || reviewFn.includes('admin.createUser') || reviewFn.includes('admin.updateUser')) {
  failures.push('Professional application review endpoint must not create or mutate Auth accounts.');
}
if (reviewFn.includes(".from('professional_application_audit').insert")) {
  failures.push('Application review audit must be database-atomic, not a second Edge Function write.');
}
if (/select\([^)]*(email|phone|details)/i.test(fn)) {
  failures.push('Public intake response selection must not expose application email, phone, or details.');
}
if (migration.includes('authentication_placeholder')) {
  failures.push('Professional application migration contains an accidental placeholder token.');
}
if (/create or replace function\s+public\.set_professional_application_updated_at/i.test(migration)) {
  failures.push('Professional application updated-at helper must not be recreated in public.');
}

if (failures.length) {
  console.error('\nProfessional application safety blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Professional application intake/review preflight passed: public submission is anti-abuse gated, review is confirmed-account/allowlist-only, status/audit changes are database-atomic, approval requires prior verification, and no review path grants an account role.');
