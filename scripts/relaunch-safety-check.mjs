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
  'supabase/migrations/20260817_love_note_invitations.sql',
  'supabase/functions/send-love-note-invitation/index.ts',
  'supabase/functions/reveal-love-note/index.ts',
];

for (const file of requiredFiles) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const index = exists('src/pages/index.jsx') ? read('src/pages/index.jsx') : '';
check('launch-ready Love Notes send route', index.includes('["/LoveNotes/Send", LoveNoteSendDemo]'), 'Expected /LoveNotes/Send route.');

const legacyLoveNotes = exists('src/pages/LoveNotes.jsx') ? read('src/pages/LoveNotes.jsx') : '';
check('legacy Love Notes local SMS removed', !legacyLoveNotes.includes('sms:'), 'Legacy collection must not expose the note body through sms:.');
check('legacy Love Notes local mailto removed', !legacyLoveNotes.includes('mailto:'), 'Legacy collection must not expose the note body through mailto:.');

const senderFunction = exists('supabase/functions/send-love-note-invitation/index.ts') ? read('supabase/functions/send-love-note-invitation/index.ts') : '';
check('real delivery kill switch exists', senderFunction.includes("LOVE_NOTE_DELIVERY_ENABLED') !== 'true'"), 'Real Love Note delivery must remain gated.');
check('Resend key remains server-side', senderFunction.includes("Deno.env.get('RESEND_API_KEY')"), 'Resend key must be read from Edge Function secrets.');
check('raw note is not inserted into provider copy', !/emailBody:[^\n]*noteContent|sms:[^\n]*noteContent/.test(senderFunction), 'Invitation provider copy must not contain note_content.');

const authContext = exists('src/contexts/AuthContext.jsx') ? read('src/contexts/AuthContext.jsx') : '';
const hasUnconfirmedBypass = /allowing sign in anyway|allowing sign in|allowing access/i.test(authContext);
check('AuthContext email-confirmation bypass removed', !hasUnconfirmedBypass, hasUnconfirmedBypass ? 'BLOCKER: AuthContext still contains an unconfirmed-email bypass.' : 'No known bypass phrase found.');

const signIn = exists('src/pages/SignIn.jsx') ? read('src/pages/SignIn.jsx') : '';
check('Sign In confirms authenticated email', signIn.includes('email_confirmed_at'), 'Defense-in-depth check should remain at the sign-in boundary.');

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
