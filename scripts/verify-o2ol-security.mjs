import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const activeLanguages = ['en', 'es', 'fr', 'it', 'de'];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function requireText(content, text, label) {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
}

function rejectText(content, text, label) {
  if (content.includes(text)) failures.push(`Unsafe ${label}: ${text}`);
}

function requireLanguages(file) {
  const content = read(file);
  for (const language of activeLanguages) requireText(content, `${language}:`, `${language} translation in ${file}`);
  return content;
}

const signIn = requireLanguages('src/pages/SignIn.jsx');
requireText(signIn, 'getAuthUiTranslation', 'safe localized sign-in messaging');
requireText(signIn, 'autoComplete="email"', 'sign-in email autocomplete');
requireText(signIn, 'autoComplete="current-password"', 'sign-in password autocomplete');
requireText(signIn, 'authT.invalidCredentials', 'generic credential failure message');
rejectText(signIn, 'error.message', 'raw sign-in backend error disclosure');
rejectText(signIn, 'console.log', 'sign-in debug logging');

const signUp = requireLanguages('src/pages/SignUp.jsx');
requireText(signUp, 'RegularUserForm', 'regular account signup flow');

const regularUser = requireLanguages('src/components/signup/RegularUserForm.jsx');
requireText(regularUser, 'getAuthUiTranslation', 'safe localized registration messaging');
requireText(regularUser, 'minLength={8}', 'registration password minimum');
requireText(regularUser, 'createPageUrl("TermsOfService")', 'Terms of Service consent');
requireText(regularUser, 'createPageUrl("PrivacyPolicy")', 'Privacy Policy consent');
rejectText(regularUser, 'error.message', 'raw registration backend error disclosure');
rejectText(regularUser, 'console.log', 'registration debug logging');

const verificationDialog = requireLanguages('src/components/signup/EmailVerificationDialog.jsx');
requireText(verificationDialog, 'requiresVerification', 'verification-aware signup result handling');

// Influencer/professional application status is enforced in the service layer, not the page.
// These legacy signup pages are being localized separately; the security check should verify
// the actual moderation boundary rather than require duplicated translation dictionaries.
const influencer = read('src/pages/InfluencerSignup.jsx');
rejectText(influencer, 'error.message', 'raw influencer backend error disclosure');
const influencerService = read('src/lib/influencerService.js');
requireText(influencerService, "status: 'pending'", 'pending influencer moderation status');

const professional = read('src/pages/ProfessionalSignup.jsx');
rejectText(professional, 'error.message', 'raw professional backend error disclosure');
const professionalService = read('src/lib/professionalService.js');
requireText(professionalService, "status: 'pending'", 'pending professional moderation status');

const profileLock = read('supabase-global-room-creator-profile-lock.sql');
requireText(profileLock, 'creators can update own pending room profile', 'pending-only creator profile update policy');
requireText(profileLock, "status = 'pending'", 'approved creator profile lock');
requireText(profileLock, 'daily_slot_limit = 2', 'creator quota integrity');

const privilegedApiLock = read('supabase-global-room-privilege-lockdown.sql');
requireText(privilegedApiLock, 'revoke all on table public.global_room_moderators', 'moderator registry direct-access lock');
requireText(privilegedApiLock, 'revoke all on table public.global_room_moderation_audit', 'moderation audit direct-access lock');
requireText(privilegedApiLock, "revoke execute on function %s from public, anon", 'privileged RPC anonymous-execution lock');

const cancellations = read('supabase-global-room-cancellations.sql');
requireText(cancellations, 'idx_room_cancellation_one_open_per_slot', 'single open cancellation request constraint');
requireText(cancellations, 'review_global_room_cancellation_request', 'trusted cancellation review RPC');

const remediationWorkflow = read('.github/workflows/o2ol-audit-remediation.yml');
requireText(remediationWorkflow, 'npm audit fix', 'non-force dependency remediation');
rejectText(remediationWorkflow, 'npm audit fix --force', 'forced dependency remediation');
requireText(remediationWorkflow, 'npm run build', 'post-remediation production build');

if (failures.length) {
  console.error('\nO2OL security verification failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('O2OL security verification passed.');
