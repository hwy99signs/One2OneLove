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

requireText(router, 'VITE_PROFESSIONAL_APPLICATIONS_ENABLED', 'Professional application routes must default behind an explicit frontend activation flag.');
requireText(router, 'ProfessionalApplicationsClosed', 'Closed application routes must render the truthful staged state.');
requireText(closed, 'No application was submitted from this page.', 'Closed application state must not imply intake occurred.');
requireText(service, "submit-professional-application", 'Professional application forms must use the private Edge Function service.');
requireText(widget, "professional_application", 'Turnstile widget must use the reviewed professional_application action.');

requireText(fn, "PROFESSIONAL_APPLICATIONS_ENABLED", 'Edge Function must require an explicit server-side application enable flag.');
requireText(fn, "Deno.env.get('PROFESSIONAL_APPLICATION_TURNSTILE_REQUIRED') !== 'true'", 'Enabled public intake must fail closed when required Turnstile protection is not configured.');
requireText(fn, "return json(request, { error: 'ANTI_ABUSE_NOT_CONFIGURED' }, 503)", 'Unprotected public intake must be rejected before parsing/submitting an application.');
requireText(fn, "PROFESSIONAL_APPLICATION_ALLOWED_ORIGINS", 'Edge Function must use an explicit origin allowlist.');
requireText(fn, "const verifyTurnstile = async", 'Public intake must actively verify Turnstile when enabled.');
requireText(fn, "result?.action === TURNSTILE_ACTION", 'Turnstile verification must bind to the reviewed action name.');
requireText(fn, "expectedHostnames.has(hostname)", 'Turnstile verification must bind to an allowed application hostname.');
requireText(fn, "THERAPIST_LICENSE_LOCATION_REQUIRED", 'Therapist payload must be validated server-side.');
requireText(fn, "INFLUENCER_PLATFORM_REQUIRED", 'Influencer payload must be validated server-side.');
requireText(fn, "PROFESSIONAL_ORGANIZATION_REQUIRED", 'Professional payload must be validated server-side.');
requireText(fn, "cleanUrlMap", 'Application URLs/platform maps must be sanitized server-side.');
requireText(fn, ".select('id, application_type, status, created_at')", 'Application response must not return private email/phone/details.');

requireText(migration, 'alter table public.professional_applications enable row level security;', 'Professional applications must remain RLS-protected.');
requireText(migration, 'revoke all on table public.professional_applications from anon, authenticated;', 'Browser roles must have no direct professional application table access.');
requireText(migration, 'create schema if not exists o2ol_private;', 'Professional application helper must use the established non-public helper schema.');
requireText(migration, 'create or replace function o2ol_private.set_professional_application_updated_at()', 'Updated-at trigger helper must not live in public.');
requireText(migration, 'security invoker', 'Professional application trigger helper must use SECURITY INVOKER.');
requireText(migration, "set search_path = ''", 'Professional application trigger helper must use an empty search path.');
requireText(migration, 'revoke all on function o2ol_private.set_professional_application_updated_at() from public, anon, authenticated;', 'Professional application trigger helper must not be directly browser-executable.');
requireText(migration, 'for each row execute function o2ol_private.set_professional_application_updated_at();', 'Application trigger must call the private helper.');

if (/select\([^)]*(email|phone|details)/i.test(fn)) {
  failures.push('Edge Function response selection must not expose application email, phone, or details.');
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

console.log('Professional application route, private storage, mandatory anti-abuse activation and response boundaries are staged safely.');
