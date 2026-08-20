import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};
const forbidText = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

const helper = read('supabase/functions/_shared/loveNoteSms.ts');
const send = read('supabase/functions/send-love-note-invitation/index.ts');
const dispatcher = read('supabase/functions/dispatch-scheduled-love-notes/index.ts');
const migration = read('supabase/migrations/20260820154500_love_note_sms_compliance.sql');
const client = read('src/lib/loveNoteInvitationService.js');
const sendDark = read('supabase/functions/send-love-note-invitation/production-dark.ts');
const dispatchDark = read('supabase/functions/dispatch-scheduled-love-notes/production-dark.ts');

requireText(helper, /LOVE_NOTE_SMS_COMPLIANCE_READY/, 'SMS helper must fail closed behind the compliance-ready gate.');
requireText(helper, /LOVE_NOTE_SMS_CONSENT_PEPPER/, 'SMS consent matching must use a server-only pepper.');
requireText(helper, /TWILIO_API_KEY_SID/, 'Twilio API Key SID must be server-side configuration.');
requireText(helper, /TWILIO_API_KEY_SECRET/, 'Twilio API Key secret must be server-side configuration.');
requireText(helper, /TWILIO_MESSAGING_SERVICE_SID/, 'Twilio Messaging Service SID is required for centralized A2P/opt-out handling.');
requireText(helper, /O2OL_SMS_RECIPIENT_CONSENT_REQUIRED/, 'SMS helper must reject recipients without prior verifiable consent.');
requireText(helper, /O2OL_SMS_RECIPIENT_OPTED_OUT/, 'SMS helper must distinguish revoked/opted-out recipients.');
requireText(helper, /Reply STOP[\s\S]*HELP/, 'English SMS copy must include STOP and HELP instructions.');
requireText(helper, /Responde STOP[\s\S]*HELP/, 'Spanish SMS copy must include STOP and HELP instructions.');
requireText(helper, /Répondez STOP[\s\S]*HELP/, 'French SMS copy must include STOP and HELP instructions.');
requireText(helper, /Rispondi STOP[\s\S]*HELP/, 'Italian SMS copy must include STOP and HELP instructions.');
requireText(helper, /Antworte STOP[\s\S]*HELP/, 'German SMS copy must include STOP and HELP instructions.');

requireText(send, /requireVerifiedSmsConsent\(serviceClient, recipientContact\)/, 'Immediate SMS send must verify recipient consent before insertion/send.');
requireText(send, /delivery_language:\s*deliveryLanguage/, 'Immediate send must persist the selected delivery language.');
requireText(send, /sendLoveNoteSmsWithTwilio/, 'Immediate send must use the Twilio-specific server adapter.');
forbidText(send, /LOVE_NOTE_SMS_ENDPOINT|LOVE_NOTE_SMS_PROVIDER_KEY/, 'Immediate send must not use the retired arbitrary SMS endpoint/key adapter.');

requireText(dispatcher, /delivery_language/, 'Scheduled dispatch must load the saved recipient delivery language.');
requireText(dispatcher, /requireVerifiedSmsConsent\(serviceClient, recipientContact\)/, 'Scheduled SMS must re-check consent immediately before provider submission.');
requireText(dispatcher, /status:\s*'canceled'/, 'Scheduled SMS must cancel rather than send after consent is missing/revoked.');
requireText(dispatcher, /sendLoveNoteSmsWithTwilio/, 'Scheduled SMS must use the Twilio-specific server adapter.');
forbidText(dispatcher, /LOVE_NOTE_SMS_ENDPOINT|LOVE_NOTE_SMS_PROVIDER_KEY/, 'Scheduled dispatch must not use the retired arbitrary SMS endpoint/key adapter.');

requireText(migration, /DEVELOPMENT MIGRATION ONLY[\s\S]*DO NOT APPLY TO PRODUCTION/i, 'SMS compliance schema must remain explicitly development-only until later approval.');
requireText(migration, /create table if not exists public\.love_note_sms_consents/, 'SMS compliance migration must stage a dedicated consent-evidence table.');
requireText(migration, /alter table public\.love_note_sms_consents enable row level security/, 'SMS consent table must have RLS enabled.');
requireText(migration, /revoke all on table public\.love_note_sms_consents from public, anon, authenticated/, 'SMS consent evidence must not be browser-readable/writable.');
forbidText(migration, /phone_number|recipient_contact\s+text/i, 'SMS consent evidence must not duplicate the raw recipient phone number.');
requireText(migration, /delivery_language[\s\S]*\('en', 'es', 'fr', 'it', 'de'\)/, 'SMS delivery language must be restricted to the five active O2OL languages.');

requireText(client, /LOVE_NOTE_DELIVERY_LANGUAGES = \['en', 'es', 'fr', 'it', 'de'\]/, 'Client payload support must preserve all five active O2OL languages.');
requireText(client, /SMS_PHONE_E164_REQUIRED/, 'Client validation must require an international E.164 SMS destination.');
requireText(client, /delivery_language:\s*validated\.deliveryLanguage/, 'Client payload must send the recipient delivery language.');

requireText(sendDark, /PRODUCTION_DARK|LOVE_NOTE_PRODUCTION_DISABLED/, 'Immediate Love Note production function must remain dark during #9A staging.');
requireText(dispatchDark, /PRODUCTION_DARK|LOVE_NOTE_PRODUCTION_DISABLED/, 'Scheduled Love Note dispatcher must remain dark during #9A staging.');

if (failures.length) {
  console.error('\n⛔ Love Notes SMS compliance preflight failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Love Notes SMS compliance preflight passed: Twilio-specific, consent-gated, five-language, browser-private, and production-dark.');
