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
const consentEndpoint = read('supabase/functions/manage-love-note-sms-consent/index.ts');
const twilioWebhook = read('supabase/functions/twilio-love-note-sms-webhook/index.ts');
const migration = read('supabase/migrations/20260820154500_love_note_sms_compliance.sql');
const client = read('src/lib/loveNoteInvitationService.js');
const consentClient = read('src/lib/smsConsentService.js');
const consentPage = read('src/pages/SmsConsent.jsx');
const routes = read('src/pages/index.jsx');
const legalPending = read('src/pages/LegalPolicyPending.jsx');
const legalDraft = read('docs/SMS_MESSAGING_LEGAL_DRAFT_20260820.md');
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

requireText(migration, /DEVELOPMENT MIGRATION ONLY[\s\S]*DO NOT APPLY TO PRODUCTION/i, 'SMS compliance schema must remain explicitly development-only until later production approval.');
requireText(migration, /create table if not exists public\.love_note_sms_consents/, 'SMS compliance migration must stage a dedicated consent-evidence table.');
requireText(migration, /alter table public\.love_note_sms_consents enable row level security/, 'SMS consent table must have RLS enabled.');
requireText(migration, /revoke all on table public\.love_note_sms_consents from public, anon, authenticated/, 'SMS consent evidence must not be browser-readable/writable.');
forbidText(migration, /phone_number|phone_last4|recipient_contact\s+text|ip_address/i, 'SMS consent evidence must not store raw/partial phone or IP fields.');
requireText(migration, /program_version[\s\S]*disclosure_version[\s\S]*terms_version[\s\S]*privacy_version/, 'Consent evidence must bind the accepted program/disclosure/legal versions.');
requireText(migration, /delivery_language[\s\S]*\('en', 'es', 'fr', 'it', 'de'\)/, 'SMS delivery language must be restricted to the five active O2OL languages.');

requireText(consentEndpoint, /DEVELOPMENT ONLY[\s\S]*do not deploy\/enable/i, 'Recipient consent endpoint must remain explicitly development-only.');
requireText(consentEndpoint, /LOVE_NOTE_SMS_CONSENT_CAPTURE_ENABLED/, 'Recipient consent endpoint must fail closed behind its own production switch.');
requireText(consentEndpoint, /consent_checked\s*!==\s*true[\s\S]*owns_number\s*!==\s*true/, 'Recipient endpoint must require explicit consent and number control.');
requireText(consentEndpoint, /consentHashFor\(phone\)/, 'Recipient endpoint must store consent by server-peppered phone hash.');
requireText(consentEndpoint, /program_version:[\s\S]*disclosure_version:[\s\S]*terms_version:[\s\S]*privacy_version:/, 'Recipient endpoint must persist accepted disclosure/legal versions.');
forbidText(consentEndpoint, /console\.(log|error)\([^\n]*phone|phone_last4|ip_address/i, 'Recipient endpoint must not log/store raw phone or IP evidence.');

requireText(twilioWebhook, /DEVELOPMENT ONLY[\s\S]*do not deploy\/configure/i, 'Twilio opt-out webhook must remain explicitly development-only.');
requireText(twilioWebhook, /LOVE_NOTE_SMS_WEBHOOK_ENABLED/, 'Twilio webhook must fail closed behind a dedicated production gate.');
requireText(twilioWebhook, /TWILIO_AUTH_TOKEN/, 'Twilio webhook must use the server-only Auth Token for signature validation.');
requireText(twilioWebhook, /x-twilio-signature/i, 'Twilio webhook must require X-Twilio-Signature.');
requireText(twilioWebhook, /HMAC[\s\S]*SHA-1/, 'Twilio webhook must implement Twilio form-signature HMAC-SHA1 validation.');
requireText(twilioWebhook, /TWILIO_SMS_WEBHOOK_PUBLIC_URL/, 'Twilio signature validation must use the exact configured public HTTPS webhook URL.');
requireText(twilioWebhook, /OptOutType/, 'Twilio webhook must consume Advanced Opt-Out OptOutType rather than guess from arbitrary message text.');
requireText(twilioWebhook, /\['STOP', 'START', 'HELP'\]/, 'Twilio webhook must constrain opt-out event types.');
requireText(twilioWebhook, /status:\s*'revoked'/, 'Twilio STOP must revoke O2OL consent state.');
requireText(twilioWebhook, /status:\s*'active'/, 'Known Twilio START must restore active O2OL consent state.');
requireText(twilioWebhook, /if \(!existing\?\.id\) return emptyTwiml\(200\)/, 'Unknown inbound START must not create fresh O2OL consent.');
forbidText(twilioWebhook, /\.get\(['"]Body['"]\)[\s\S]*\.(insert|update|upsert)/, 'Opt-out webhook must not persist ordinary inbound SMS message bodies.');
forbidText(twilioWebhook, /console\.(log|error)\([^\n]*(From|from|phone)/, 'Twilio webhook must not log raw recipient phone data.');

requireText(client, /LOVE_NOTE_DELIVERY_LANGUAGES = \['en', 'es', 'fr', 'it', 'de'\]/, 'Client invitation payload support must preserve all five active O2OL languages.');
requireText(client, /SMS_PHONE_E164_REQUIRED/, 'Client invitation validation must require an international E.164 SMS destination.');
requireText(client, /delivery_language:\s*validated\.deliveryLanguage/, 'Client invitation payload must send the recipient delivery language.');
requireText(consentClient, /SMS_CONSENT_LANGUAGES = \['en', 'es', 'fr', 'it', 'de'\]/, 'Consent client must preserve all five active O2OL languages.');
requireText(consentClient, /manage-love-note-sms-consent/, 'Consent client must use the dedicated server endpoint rather than browser table writes.');

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  requireText(consentPage, new RegExp(`\\b${language}:\\s*\\{`), `SMS consent page is missing the ${language} language block.`);
}
requireText(consentPage, /useState\(false\)/, 'SMS consent controls must start unchecked.');
requireText(consentPage, /Reply STOP[\s\S]*Reply HELP/, 'English same-screen consent disclosure must include STOP and HELP.');
requireText(consentPage, /Message frequency varies/, 'English same-screen consent disclosure must state message frequency.');
requireText(consentPage, /Message and data rates may apply/, 'English same-screen consent disclosure must state message/data rates may apply.');
requireText(consentPage, /does not include marketing or promotional/, 'SMS consent must not silently grant marketing/promotional SMS permission.');
requireText(consentPage, /not required to use One2OneLove/, 'SMS consent must remain optional for the primary service.');
requireText(consentPage, /to="\/TermsOfService"[\s\S]*to="\/PrivacyPolicy"/, 'Terms and Privacy links must be adjacent to the consent flow.');
requireText(routes, /"\/SmsConsent",\s*SmsConsent/, 'A public SMS consent route must be staged.');
requireText(routes, /"\/LoveNotes\/SmsConsent",\s*SmsConsent/, 'Love Notes must have a canonical SMS consent route.');

requireText(legalPending, /SMS sending remains disabled|El envío de SMS permanece desactivado|L’envoi de SMS reste désactivé/, 'Pending legal page must state that SMS sending remains disabled during final review.');
requireText(legalDraft, /DEVELOPMENT DRAFT — NOT FINAL LEGAL TERMS/, 'SMS legal supplement must remain clearly non-final.');
requireText(legalDraft, /unchecked SMS consent control/, 'SMS legal draft must preserve unchecked optional opt-in.');
requireText(legalDraft, /will not be sold or shared with third parties\/affiliates for their marketing or promotional purposes/, 'SMS privacy draft must include mobile/SMS marketing-sharing restriction for final review.');

requireText(sendDark, /PRODUCTION_DARK|LOVE_NOTE_PRODUCTION_DISABLED/, 'Immediate Love Note production function must remain dark during SMS staging.');
requireText(dispatchDark, /PRODUCTION_DARK|LOVE_NOTE_PRODUCTION_DISABLED/, 'Scheduled Love Note dispatcher must remain dark during SMS staging.');

if (failures.length) {
  console.error('\n⛔ Love Notes SMS compliance preflight failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Love Notes SMS compliance preflight passed: Twilio-specific, recipient-consent-gated, signed-webhook-aware, five-language, browser-private, legal-review-gated, and production-dark.');
