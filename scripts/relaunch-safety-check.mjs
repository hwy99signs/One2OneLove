import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const results = [];
const check = (name, pass, detail, level = 'error') => {
  results.push({ name, pass: Boolean(pass), detail, level });
};

const requiredFiles = [
  'src/pages/LoveNotesHub.jsx',
  'src/pages/LoveNotesCollectionRelaunch.jsx',
  'src/pages/LoveNoteSendDemo.jsx',
  'src/pages/LoveNoteReveal.jsx',
  'src/lib/loveNoteInvitationService.js',
  'src/pages/ForgotPassword.jsx',
  'src/pages/ResetPassword.jsx',
  'supabase/migrations/20260817_love_note_invitations.sql',
  'supabase/functions/send-love-note-invitation/index.ts',
  'supabase/functions/reveal-love-note/index.ts',
];

for (const file of requiredFiles) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const index = exists('src/pages/index.jsx') ? read('src/pages/index.jsx') : '';
check('launch-ready Love Notes send route', index.includes('["/LoveNotes/Send", LoveNoteSendDemo]'), 'Expected /LoveNotes/Send route.');
check('password reset completion route exists', index.includes('["/ResetPassword", ResetPassword]'), 'Expected /ResetPassword route.');

const legacyLoveNotes = exists('src/pages/LoveNotes.jsx') ? read('src/pages/LoveNotes.jsx') : '';
check('legacy Love Notes local SMS removed', !legacyLoveNotes.includes('sms:'), 'Legacy collection must not expose the note body through sms:.');
check('legacy Love Notes local mailto removed', !legacyLoveNotes.includes('mailto:'), 'Legacy collection must not expose the note body through mailto:.');

const senderFunction = exists('supabase/functions/send-love-note-invitation/index.ts') ? read('supabase/functions/send-love-note-invitation/index.ts') : '';
check('real delivery kill switch exists', senderFunction.includes("LOVE_NOTE_DELIVERY_ENABLED') !== 'true'"), 'Real Love Note delivery must remain gated.');
check('SMS has independent kill switch', senderFunction.includes("LOVE_NOTE_SMS_ENABLED') !== 'true'"), 'Email activation must not implicitly activate paid SMS delivery.');
check('Love Note send requires verified account', senderFunction.includes('EMAIL_NOT_CONFIRMED'), 'The server-side sender path must reject unconfirmed accounts.');
check('Resend key remains server-side', senderFunction.includes("Deno.env.get('RESEND_API_KEY')"), 'Resend key must be read from Edge Function secrets.');
check('raw note is not inserted into provider copy', !/emailBody:[^\n]*noteContent|sms:[^\n]*noteContent/.test(senderFunction), 'Invitation provider copy must not contain note_content.');

const revealFunction = exists('supabase/functions/reveal-love-note/index.ts') ? read('supabase/functions/reveal-love-note/index.ts') : '';
check('Love Note reveal requires verified account', revealFunction.includes('EMAIL_NOT_CONFIRMED'), 'The server-side reveal path must reject unconfirmed accounts.');
check('email reveal binds invited address', revealFunction.includes('accountEmail !== invitedEmail'), 'Email invitations must be claimed by the verified email address that received them.');

const authContext = exists('src/contexts/AuthContext.jsx') ? read('src/contexts/AuthContext.jsx') : '';
const hasUnconfirmedBypass = /allowing sign in anyway|allowing sign in|allowing access/i.test(authContext);
check('AuthContext email-confirmation bypass removed', !hasUnconfirmedBypass, hasUnconfirmedBypass ? 'BLOCKER: AuthContext still contains an unconfirmed-email bypass.' : 'No known bypass phrase found.');

const signIn = exists('src/pages/SignIn.jsx') ? read('src/pages/SignIn.jsx') : '';
check('Sign In confirms authenticated email', signIn.includes('email_confirmed_at'), 'Defense-in-depth check should remain at the sign-in boundary.');

const forgotPassword = exists('src/pages/ForgotPassword.jsx') ? read('src/pages/ForgotPassword.jsx') : '';
check('Forgot Password uses Supabase reset email', forgotPassword.includes('resetPasswordForEmail'), 'Forgot Password must not simulate a successful reset email.');
check('Forgot Password does not simulate provider success', !forgotPassword.includes('setTimeout(resolve => setTimeout') && !/simulate the API call/i.test(forgotPassword), 'Password reset must not present a fake success state.');

const resetPassword = exists('src/pages/ResetPassword.jsx') ? read('src/pages/ResetPassword.jsx') : '';
check('Reset Password updates through Supabase Auth', resetPassword.includes('supabase.auth.updateUser({ password })'), 'Reset page must update the authenticated recovery session through Supabase Auth.');
check('Reset Password requires a recovery session', resetPassword.includes('supabase.auth.getSession()') && resetPassword.includes('PASSWORD_RECOVERY'), 'Reset page should reject invalid/expired links rather than expose an unauthenticated password form.');

const professionalSignupFiles = [
  'src/pages/TherapistSignup.jsx',
  'src/pages/InfluencerSignup.jsx',
  'src/pages/ProfessionalSignup.jsx',
];
for (const file of professionalSignupFiles) {
  const source = exists(file) ? read(file) : '';
  const containsMockVerification = source.includes('123456') || /Use code:/i.test(source);
  check(
    `${path.basename(file)} has no mock verification code`,
    !containsMockVerification,
    containsMockVerification
      ? 'LAUNCH BLOCKER: this application page still displays/accepts a hard-coded verification code.'
      : 'No hard-coded verification code found.'
  );
}

const presence = exists('src/lib/roomPresenceService.js') ? read('src/lib/roomPresenceService.js') : '';
const tracksRawPresenceIdentity = /channel\.track\(\{[\s\S]{0,200}(user_id|name:)/.test(presence);
check('Live Room presence does not broadcast account identity', !tracksRawPresenceIdentity, 'Presence should carry only aggregate-count metadata, not member IDs or names.');
check('Live Room presence key is pseudonymous', presence.includes('SHA-256') && presence.includes('one2onelove-room-presence:'), 'Use a deterministic one-way key instead of broadcasting the account UUID.');

const home = exists('src/pages/Home.jsx') ? read('src/pages/Home.jsx') : '';
const homeMayImplyLiveHumans = /ROOM OPEN|People are talking now|SALA ABIERTA|SALON OUVERT|STANZA APERTA|RAUM OFFEN/.test(home);
check('homepage demo avoids fake live-human status', !homeMayImplyLiveHumans, homeMayImplyLiveHumans ? 'VISUAL REVIEW: homepage still contains static copy that can look like live human activity.' : 'No known fake-live status phrases found.', 'warning');

const invitationMigration = exists('supabase/migrations/20260817_love_note_invitations.sql') ? read('supabase/migrations/20260817_love_note_invitations.sql') : '';
check('Love Note raw tokens are not stored', invitationMigration.includes('token_hash') && !invitationMigration.includes('raw_token'), 'Only a token hash should be persisted.');

console.log('\nOne2OneLove relaunch safety check\n');
for (const result of results) {
  const icon = result.pass ? '✅' : result.level === 'warning' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
}

const errors = results.filter((item) => !item.pass && item.level === 'error');
const warnings = results.filter((item) => !item.pass && item.level === 'warning');
console.log(`\n${results.length} checks · ${errors.length} blocker(s) · ${warnings.length} warning(s)\n`);

process.exitCode = errors.length ? 1 : 0;
