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

const activeLanguages = ['en', 'es', 'fr', 'it', 'de'];

// Verify each launch-critical surface at the canonical file that owns its translations.
// Some pages intentionally import a shared translation module rather than duplicating large
// dictionaries in the component itself.
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
  'src/pages/RoomModerationAudit.jsx',
  'src/pages/RoomOpsDashboard.jsx',
];
for (const file of privateModeratorPages) {
  const content = read(file);
  requireText(content, 'isGlobalRoomModerator', `trusted moderator gate in ${file}`);
  requireText(content, '!moderator', `restricted moderator rendering in ${file}`);
}

const forgotPassword = read('src/pages/ForgotPassword.jsx');
requireText(forgotPassword, 'resetPasswordForEmail', 'real Supabase reset email call');
requireText(forgotPassword, "new URL('/ResetPassword'", 'recovery redirect URL');

const resetPassword = read('src/pages/ResetPassword.jsx');
requireText(resetPassword, "event === 'PASSWORD_RECOVERY'", 'PASSWORD_RECOVERY handling');
requireText(resetPassword, 'updateUser({ password })', 'Supabase password update');

const roomCreatorAccess = read('src/pages/RoomCreatorAccess.jsx');
requireText(roomCreatorAccess, 'getRoomCreatorTranslation', 'creator translation module usage');

const roomService = read('src/lib/globalRelationshipRoomService.js');
requireText(roomService, 'creator_display_name', 'safe public creator display name');

const roomSql = read('supabase-global-relationship-room.sql');
requireText(roomSql, 'relationship_room_no_active_overlap', 'room overlap protection');
requireText(roomSql, 'pg_advisory_xact_lock', 'concurrency-safe daily creator limit');
requireText(roomSql, "moderation_status = 'unreviewed'", 'creator moderation boundary');

const moderationSql = read('supabase-global-room-moderation.sql');
requireText(moderationSql, 'global_room_moderators', 'trusted moderator registry');
requireText(moderationSql, 'global_room_moderation_audit', 'moderation audit trail');

const reportingSql = read('supabase-global-room-reporting.sql');
requireText(reportingSql, 'relationship_room_report_once', 'one report per account/program protection');
requireText(reportingSql, 'users can submit own room reports', 'report ownership RLS');

if (failures.length) {
  console.error('\nO2OL launch verification failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`O2OL launch verification passed (${multilingualSources.length} multilingual surfaces, ${requiredRoutes.length} critical routes, ${privateModeratorPages.length} private moderator gates).`);
