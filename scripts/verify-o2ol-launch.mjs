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

const requireAnyText = (content, options, label) => {
  if (!options.some((text) => content.includes(text))) {
    failures.push(`Missing ${label}: expected one of ${options.join(', ')}`);
  }
};

const activeLanguages = ['en', 'es', 'fr', 'it', 'de'];

const multilingualSources = [
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
  '/ResetPassword',
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
