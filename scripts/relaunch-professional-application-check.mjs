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

requireText(router, 'VITE_PROFESSIONAL_APPLICATIONS_ENABLED', 'Professional application routes must default behind an explicit frontend activation flag.');
requireText(router, 'ProfessionalApplicationsClosed', 'Closed application routes must render the truthful staged state.');
requireText(closed, 'No application was submitted from this page.', 'Closed application state must not imply intake occurred.');
requireText(service, "submit-professional-application", 'Professional application forms must use the private Edge Function service.');
requireText(widget, "professional_application", 'Turnstile widget must use the reviewed professional_application action.');

requireText(fn, "PROFESSIONAL_APPLICATIONS_ENABLED", 'Edge Function must require an explicit server-side application enable flag.');
requireText(fn, "PROFESSIONAL_APPLICATION_TURNSTILE_REQUIRED", 'Edge Function must support required anti-abuse verification.');
requireText(fn, "PROFESSIONAL_APPLICATION_ALLOWED_ORIGINS", 'Edge Function must use an explicit origin allowlist.');
requireText(fn, "THERAPIST_LICENSE_LOCATION_REQUIRED", 'Therapist payload must be validated server-side.');
requireText(fn, "INFLUENCER_PLATFORM_REQUIRED", 'Influencer payload must be validated server-side.');
requireText(fn, "PROFESSIONAL_ORGANIZATION_REQUIRED", 'Professional payload must be validated server-side.');
requireText(fn, "cleanUrlMap", 'Application URLs/platform maps must be sanitized server-side.');
requireText(fn, ".select('id, application_type, status, created_at')", 'Application response must not return private email/phone/details.');

if (/select\([^)]*(email|phone|details)/i.test(fn)) {
  failures.push('Edge Function response selection must not expose application email, phone, or details.');
}

if (failures.length) {
  console.error('\nProfessional application safety blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Professional application route, intake, anti-abuse and response boundaries are staged safely.');
