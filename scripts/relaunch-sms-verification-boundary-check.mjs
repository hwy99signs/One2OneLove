import fs from 'node:fs';

const failures = [];
const read = (file) => fs.readFileSync(file, 'utf8');

const migration = read('supabase/migrations/20260821235500_love_note_sms_verified_consent_guard.sql');
const consent = read('supabase/functions/manage-love-note-sms-consent/index.ts');
const webhook = read('supabase/functions/twilio-love-note-sms-webhook/index.ts');
const helper = read('supabase/functions/_shared/loveNoteSms.ts');
const page = read('src/pages/SmsConsent.jsx');

for (const required of [
  "status in ('pending_verification', 'active', 'revoked')",
  "status = 'active' and verified_at is not null",
  "alter column status set default 'pending_verification'",
  "set status = 'pending_verification'",
  'DEVELOPMENT MIGRATION ONLY',
]) {
  if (!migration.includes(required)) failures.push(`SMS verification migration missing: ${required}`);
}

for (const required of [
  "status: 'pending_verification'",
  'verified_at: null',
  'verification_required: true',
]) {
  if (!consent.includes(required)) failures.push(`SMS consent endpoint missing non-authorizing capture safeguard: ${required}`);
}
if (consent.includes("status: 'active'")) {
  failures.push('Website SMS consent capture must never directly create active consent.');
}

for (const required of [
  "optOutType === 'STOP'",
  "status: 'revoked'",
  "status: 'active'",
  'verified_at: now',
  'if (!existing?.id) return emptyTwiml(200)',
]) {
  if (!webhook.includes(required)) failures.push(`Signed Twilio consent synchronization missing: ${required}`);
}

if (!helper.includes(".eq('status', 'active')")) {
  failures.push('SMS send helper must continue to accept only active consent records.');
}
if (!page.includes('This does not activate SMS delivery by itself.')) {
  failures.push('SMS consent UI must state that web capture alone does not activate delivery.');
}

if (failures.length) {
  console.error('\nSMS verified-consent boundary blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('SMS verified-consent boundary passed: web opt-in remains pending, active consent requires verified number control, signed Twilio START can verify a known number, and sending still requires active consent.');
