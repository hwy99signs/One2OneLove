import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const read = (relativePath) => {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
};

const requireText = (content, text, label) => {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

const rejectText = (content, text, label) => {
  if (content.includes(text)) failures.push(`Unsafe ${label}: ${text}`);
};

const requireAnyText = (content, options, label) => {
  if (!options.some((text) => content.includes(text))) {
    failures.push(`Missing ${label}: expected one of ${options.join(', ')}`);
  }
};

const activeLanguages = ['en', 'es', 'fr', 'it', 'de'];

const multilingualSources = [
  ['SignIn', 'src/pages/SignIn.jsx'],
  ['SignUp', 'src/pages/SignUp.jsx'],
  ['RegularUserForm', 'src/components/signup/RegularUserForm.jsx'],
  ['EmailVerificationDialog', 'src/components/signup/EmailVerificationDialog.jsx'],
  ['InfluencerSignup', 'src/pages/InfluencerSignup.jsx'],
  ['ProfessionalSignup', 'src/pages/ProfessionalSignup.jsx'],
  ['InfluencerSignupForm', 'src/components/signup/InfluencerSignupForm.jsx'],
  ['OtherUserSignupForm', 'src/components/signup/OtherUserSignupForm.jsx'],
  ['ProfilePhotoUpload', 'src/components/signup/ProfilePhotoUpload.jsx'],
  ['ForgotPassword', 'src/pages/ForgotPassword.jsx'],
  ['ResetPassword', 'src/pages/ResetPassword.jsx'],
  ['GlobalRelationshipRoom', 'src/pages/GlobalRelationshipRoom.jsx'],
  ['RoomCreatorAccess', 'src/lib/roomCreatorTranslations.js'],
  ['RoomModeration', 'src/pages/RoomModeration.jsx'],
  ['RoomReplayManager', 'src/pages/RoomReplayManager.jsx'],
  ['RoomProgramManager', 'src/pages/RoomProgramManager.jsx'],
  ['RoomOfficialScheduler', 'src/pages/RoomOfficialScheduler.jsx'],
  ['RoomReportQueue', 'src/pages/RoomReportQueue.jsx'],
  ['RoomCancellationQueue', 'src/pages/RoomCancellationQueue.jsx'],
  ['RoomModerationAudit', 'src/pages/RoomModerationAudit.jsx'],
  ['RoomOpsDashboard', 'src/pages/RoomOpsDashboard.jsx'],
  ['DailyQuestion', 'src/pages/DailyQuestion.jsx'],
  ['MarriageMatters', 'src/pages/MarriageMatters.jsx'],
  ['RelationshipLibrary', 'src/pages/RelationshipLibrary.jsx'],
  ['CouplesChallenges', 'src/pages/CouplesChallenges.jsx'],
  ['DateNight', 'src/pages/DateNight.jsx'],
  ['RelationshipReset', 'src/pages/RelationshipReset.jsx'],
  ['RelationshipResetPromo', 'src/components/home/RelationshipResetPromo.jsx'],
  ['O2OLShow', 'src/pages/O2OLShow.jsx'],
  ['HomeFeatures', 'src/components/home/FeaturesGrid.jsx'],
  ['NotFound', 'src/pages/NotFound.jsx'],
  ['ProgramReportButton', 'src/components/global-room/ProgramReportButton.jsx'],
];

for (const [surface, file] of multilingualSources) {
  const content = read(file);
  for (const language of activeLanguages) {
    requireText(content, `${language}:`, `${language} translation for ${surface} in ${file}`);
  }
}

const router = read('src/pages/index.jsx');
const requiredRoutes = [
  '/SignIn',
  '/SignUp',
  '/InfluencerSignup',
  '/ProfessionalSignup',
  '/ForgotPassword',
  '/ResetPassword',
  '/GlobalRelationshipRoom',
  '/RoomCreatorAccess',
  '/RoomModeration',
  '/RoomReplayManager',
  '/RoomProgramManager',
  '/RoomOfficialScheduler',
  '/RoomReportQueue',
  '/RoomCancellationQueue',
  '/RoomModerationAudit',
  '/RoomOpsDashboard',
  '/DailyQuestion',
  '/MarriageMatters',
  '/RelationshipLibrary',
  '/CouplesChallenges',
  '/DateNight',
  '/RelationshipReset',
  '/O2OLShow',
];
for (const route of requiredRoutes) requireText(router, `path="${route}"`, `route ${route}`);
requireText(router, 'path="*"', 'NotFound catch-all route');
requireText(router, 'return pageName || \'NotFound\'', 'NotFound current-page fallback');

const privateModeratorPages = [
  'src/pages/RoomModeration.jsx',
  'src/pages/RoomReplayManager.jsx',
  'src/pages/RoomProgramManager.jsx',
  'src/pages/RoomOfficialScheduler.jsx',
  'src/pages/RoomReportQueue.jsx',
  'src/pages/RoomCancellationQueue.jsx',
  'src/pages/RoomModerationAudit.jsx',
  'src/pages/RoomOpsDashboard.jsx',
];
for (const file of privateModeratorPages) {
  const content = read(file);
  requireText(content, 'isGlobalRoomModerator', `trusted moderator gate in ${file}`);
  requireAnyText(content, ['accessQuery.data.isModerator', 'accessQuery.data?.isModerator', 'data?.isModerator'], `moderator authorization result in ${file}`);
  requireAnyText(content, ['!moderator', '!isModerator'], `restricted moderator rendering in ${file}`);
  if (!file.endsWith('/RoomOpsDashboard.jsx')) {
    requireText(content, '/RoomOpsDashboard', `operations navigation in ${file}`);
  }
}

const authContext = read('src/contexts/AuthContext.jsx');
requireText(authContext, 'signInWithPassword', 'real Supabase password sign-in');
requireText(authContext, 'supabase.auth.signUp', 'real Supabase account registration');
requireText(authContext, 'onAuthStateChange', 'Supabase auth-state subscription');

const signIn = read('src/pages/SignIn.jsx');
requireText(signIn, 'getAuthUiTranslation', 'localized safe sign-in status messaging');
requireText(signIn, 'autoComplete="email"', 'sign-in email autocomplete');
requireText(signIn, 'autoComplete="current-password"', 'sign-in password autocomplete');
requireText(signIn, 'authT.invalidCredentials', 'safe sign-in failure messaging');
requireText(signIn, 'navigate(createPageUrl("Profile"), { replace: true })', 'post-sign-in profile navigation');

const signUp = read('src/pages/SignUp.jsx');
requireText(signUp, 'useLanguage', 'localized account type selection');
requireText(signUp, '<RegularUserForm', 'regular account registration flow');

const regularSignup = read('src/components/signup/RegularUserForm.jsx');
requireText(regularSignup, 'getAuthUiTranslation', 'localized account creation status messaging');
requireText(regularSignup, 'register({', 'real account registration call');
requireText(regularSignup, 'minLength={8}', 'registration password minimum');
requireText(regularSignup, 'createPageUrl("TermsOfService")', 'Terms of Service consent link');
requireText(regularSignup, 'createPageUrl("PrivacyPolicy")', 'Privacy Policy consent link');
requireText(regularSignup, 'result.user?.email_verified', 'verification-aware post-registration handling');

const verificationDialog = read('src/components/signup/EmailVerificationDialog.jsx');
requireText(verificationDialog, 'requiresVerification', 'verification-aware account success dialog');
requireText(verificationDialog, 't.steps.map', 'localized verification steps');

const influencerSignup = read('src/pages/InfluencerSignup.jsx');
requireText(influencerSignup, 'registerInfluencer', 'real influencer registration call');
requireText(influencerSignup, 'minLength={8}', 'influencer password minimum');
requireText(influencerSignup, 'to="/TermsOfService"', 'influencer Terms consent');
requireText(influencerSignup, 'to="/PrivacyPolicy"', 'influencer Privacy consent');
rejectText(influencerSignup, '123456', 'influencer placeholder verification code');
rejectText(influencerSignup, 'tempPassword', 'influencer temporary password');

const professionalSignup = read('src/pages/ProfessionalSignup.jsx');
requireText(professionalSignup, 'registerProfessional', 'real professional registration call');
requireText(professionalSignup, 'minLength={8}', 'professional password minimum');
requireText(professionalSignup, 'to="/TermsOfService"', 'professional Terms consent');
requireText(professionalSignup, 'to="/PrivacyPolicy"', 'professional Privacy consent');
rejectText(professionalSignup, '123456', 'professional placeholder verification code');
rejectText(professionalSignup, 'tempPassword', 'professional temporary password');

const influencerService = read('src/lib/influencerService.js');
requireText(influencerService, "status: 'pending'", 'pending influencer moderation status');
const professionalService = read('src/lib/professionalService.js');
requireText(professionalService, "status: 'pending'", 'pending professional moderation status');

const forgotPassword = read('src/pages/ForgotPassword.jsx');
requireText(forgotPassword, 'resetPasswordForEmail', 'real Supabase reset email call');
requireText(forgotPassword, "new URL('/ResetPassword'", 'recovery redirect URL');

const resetPassword = read('src/pages/ResetPassword.jsx');
requireText(resetPassword, "event === 'PASSWORD_RECOVERY'", 'PASSWORD_RECOVERY handling');
requireText(resetPassword, 'updateUser({ password })', 'Supabase password update');

const roomCreatorAccess = read('src/pages/RoomCreatorAccess.jsx');
requireText(roomCreatorAccess, 'getRoomCreatorTranslation', 'creator translation module usage');
requireText(roomCreatorAccess, 'profileLoadFailed', 'creator profile failure state');
requireText(roomCreatorAccess, 'min={minimumStartTime}', 'creator booking minimum start time');
requireText(roomCreatorAccess, 'submitGlobalRoomCancellationRequest', 'creator cancellation request submission');
requireText(roomCreatorAccess, 'cancellationPending', 'creator cancellation review state');

const publicRoom = read('src/pages/GlobalRelationshipRoom.jsx');
requireText(publicRoom, 'hasError={scheduleUnavailable}', 'public schedule backend failure state');

const scheduleViewer = read('src/components/global-room/RoomScheduleViewer.jsx');
requireText(scheduleViewer, 'role="alert"', 'public schedule alert state');
requireText(scheduleViewer, 'dateTime={slot.scheduled_start}', 'semantic public schedule time');
requireText(scheduleViewer, '<ProgramReportButton slotId={slot.id}', 'viewer reporting wired into public schedule');

const reportQueue = read('src/pages/RoomReportQueue.jsx');
requireText(reportQueue, 't.reasons[report.reason]', 'localized viewer report reasons');

const auditPage = read('src/pages/RoomModerationAudit.jsx');
requireText(auditPage, 'report_reviewed', 'localized report review audit decision');
requireText(auditPage, 'report_actioned', 'localized report action audit decision');
requireText(auditPage, 'report_dismissed', 'localized report dismissal audit decision');
requireText(auditPage, 'cancellation_approved', 'localized cancellation approval audit decision');
requireText(auditPage, 'cancellation_denied', 'localized cancellation denial audit decision');

const roomService = read('src/lib/globalRelationshipRoomService.js');
requireText(roomService, 'creator_display_name', 'safe public creator display name');

const cancellationService = read('src/lib/globalRoomCancellationService.js');
requireText(cancellationService, 'get_global_room_cancellation_queue', 'moderator cancellation queue RPC');
requireText(cancellationService, 'review_global_room_cancellation_request', 'moderator cancellation review RPC');
requireText(cancellationService, 'relationship_room_cancellation_requests', 'creator cancellation request table use');

const dailyQuestion = read('src/pages/DailyQuestion.jsx');
requireText(dailyQuestion, 'useLanguage', 'Daily Question language integration');

const marriageMatters = read('src/pages/MarriageMatters.jsx');
requireText(marriageMatters, 'useLanguage', 'Marriage Matters language integration');

const relationshipLibrary = read('src/pages/RelationshipLibrary.jsx');
requireText(relationshipLibrary, '/CommunicationPractice', 'Relationship Library communication path');
requireText(relationshipLibrary, '/MarriageMatters', 'Relationship Library marriage path');
requireText(relationshipLibrary, '/GlobalRelationshipRoom', 'Relationship Library programming path');

const couplesChallenges = read('src/pages/CouplesChallenges.jsx');
requireText(couplesChallenges, 'localStorage', 'local-only Couples Challenges progress');
requireText(couplesChallenges, 'o2ol-couples-challenge-', 'weekly challenge storage namespace');

const dateNight = read('src/pages/DateNight.jsx');
requireText(dateNight, 'budgets:', 'Date Night budget selection');
requireText(dateNight, 'times:', 'Date Night time selection');
requireText(dateNight, 'plans:', 'Date Night plan library');

const relationshipReset = read('src/pages/RelationshipReset.jsx');
requireText(relationshipReset, 'o2ol-relationship-reset-', 'Relationship Reset local-only storage namespace');
requireText(relationshipReset, 'localStorage', 'Relationship Reset browser-only completion');
requireText(relationshipReset, 'One2OneLove does not receive your answers', 'Relationship Reset privacy disclosure');

const resetPromo = read('src/components/home/RelationshipResetPromo.jsx');
requireText(resetPromo, '/RelationshipReset', 'homepage Relationship Reset route');

const o2olShow = read('src/pages/O2OLShow.jsx');
requireText(o2olShow, 'O2OL', 'O2OL Show host identity');
requireText(o2olShow, 'AMORA', 'AMORA host identity');
requireText(o2olShow, '/GlobalRelationshipRoom', 'O2OL Show Global Room connection');

const homeFeatures = read('src/components/home/FeaturesGrid.jsx');
requireText(homeFeatures, '/RelationshipLibrary', 'homepage Relationship Library discovery');
requireText(homeFeatures, '/CouplesChallenges', 'homepage Couples Challenges discovery');
requireText(homeFeatures, '/DateNight', 'homepage Date Night discovery');
requireText(homeFeatures, '/O2OLShow', 'homepage O2OL Show discovery');

const roomSql = read('supabase-global-relationship-room.sql');
requireText(roomSql, 'relationship_room_no_active_overlap', 'room overlap protection');
requireText(roomSql, 'pg_advisory_xact_lock', 'concurrency-safe daily creator limit');
requireText(roomSql, "moderation_status = 'unreviewed'", 'creator moderation boundary');

const creatorProfileLockSql = read('supabase-global-room-creator-profile-lock.sql');
requireText(creatorProfileLockSql, 'creators can update own pending room profile', 'pending-only creator profile update policy');
requireText(creatorProfileLockSql, "status = 'pending'", 'approved creator profile lock');
requireText(creatorProfileLockSql, 'daily_slot_limit = 2', 'creator quota integrity on profile updates');

const moderationSql = read('supabase-global-room-moderation.sql');
requireText(moderationSql, 'global_room_moderators', 'trusted moderator registry');
requireText(moderationSql, 'global_room_moderation_audit', 'moderation audit trail');

const reportingSql = read('supabase-global-room-reporting.sql');
requireText(reportingSql, 'relationship_room_report_once', 'one report per account/program protection');
requireText(reportingSql, 'users can submit own room reports', 'report ownership RLS');

const cancellationSql = read('supabase-global-room-cancellations.sql');
requireText(cancellationSql, 'idx_room_cancellation_one_open_per_slot', 'one open cancellation per program');
requireText(cancellationSql, 'creators can submit own room cancellation requests', 'creator cancellation ownership policy');
requireText(cancellationSql, 'review_global_room_cancellation_request', 'trusted cancellation review function');
requireText(cancellationSql, "'cancellation_' || p_decision", 'cancellation moderation audit trail');

const opsCancellationSql = read('supabase-global-room-ops-cancellations.sql');
requireText(opsCancellationSql, "'open_cancellations'", 'cancellation operations metric');
const opsService = read('src/lib/globalRoomOpsService.js');
requireText(opsService, 'openCancellations', 'cancellation metric client mapping');
const opsDashboard = read('src/pages/RoomOpsDashboard.jsx');
requireText(opsDashboard, '/RoomCancellationQueue', 'cancellation queue operations link');
requireText(opsDashboard, 's.openCancellations', 'cancellation operations metric rendering');

if (failures.length) {
  console.error('\nO2OL launch verification failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`O2OL launch verification passed (${multilingualSources.length} multilingual surfaces, ${requiredRoutes.length} critical routes, ${privateModeratorPages.length} private moderator gates).`);
