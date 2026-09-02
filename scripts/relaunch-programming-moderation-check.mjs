import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260819_programming_moderation.sql';
const reportFunctionFile = 'supabase/functions/report-programming/index.ts';
const moderationFunctionFile = 'supabase/functions/moderate-programming/index.ts';
const serviceFile = 'src/lib/programmingModerationService.js';
const reportButtonFile = 'src/components/programming/ProgrammingReportButton.jsx';
const consoleFile = 'src/pages/ProgrammingModerationAdmin.jsx';
const cancellationFile = 'supabase/migrations/20260819_programming_reminder_cancellation.sql';
const routesFile = 'src/pages/index.jsx';

const migration = fs.readFileSync(migrationFile, 'utf8');
const reportFunction = fs.readFileSync(reportFunctionFile, 'utf8');
const moderationFunction = fs.readFileSync(moderationFunctionFile, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
const reportButton = fs.readFileSync(reportButtonFile, 'utf8');
const consolePage = fs.readFileSync(consoleFile, 'utf8');
const cancellation = fs.readFileSync(cancellationFile, 'utf8');
const routes = fs.readFileSync(routesFile, 'utf8');

for (const required of [
  'unique (slot_id, reporter_id)',
  "status text not null default 'pending' check (status in ('pending','dismissed','actioned'))",
  'grant select on table public.programming_reports to authenticated;',
  'alter table public.programming_reports enable row level security;',
  'using ((select auth.uid()) = reporter_id);',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing private-report safeguard ${required}.`);
}

for (const required of [
  "Deno.env.get('PROGRAMMING_MODERATION_ENABLED') !== 'true'",
  'const UUID_PATTERN =',
  "if (!UUID_PATTERN.test(slotId)) return json(request, { error: 'SLOT_ID_INVALID' }, 400)",
  'VALID_REASONS',
  ".eq('reporter_id', caller.id)",
  'endsAt.getTime() > Date.now() - (24 * 60 * 60 * 1000)',
  "status: 'pending'",
  "if (insertError.code === '23505')",
]) {
  if (!reportFunction.includes(required)) failures.push(`${reportFunctionFile}: missing member-report safeguard ${required}.`);
}

for (const required of [
  "Deno.env.get('O2OL_PROGRAMMING_ADMIN_USER_IDS')",
  'const UUID_PATTERN =',
  '.filter((value) => UUID_PATTERN.test(value))',
  'allowedAdminIds().has(caller.id)',
  "if (!eligible) return json(request, { error: 'O2OL_PROGRAMMING_ADMIN_REQUIRED' }, 403)",
  "if (!UUID_PATTERN.test(reportId)) return json(request, { error: 'REPORT_ID_INVALID' }, 400)",
  ".eq('status', 'pending')",
  "if (action === 'remove')",
  ".update({ status: 'cancelled', updated_at: new Date().toISOString() })",
  "status: 'actioned'",
  "status: 'dismissed'",
]) {
  if (!moderationFunction.includes(required)) failures.push(`${moderationFunctionFile}: missing allowlisted moderation behavior ${required}.`);
}

for (const forbidden of [
  'reporter_id,reason',
  'reporter_id,slot_id',
  "user_type === 'regular'",
  "user_type === 'professional'",
  "user_type === 'therapist'",
  "user_type === 'influencer'",
]) {
  if (moderationFunction.includes(forbidden)) failures.push(`${moderationFunctionFile}: moderation payload/authority must not depend on unnecessary reporter identity or profile role (${forbidden}).`);
}

for (const required of [
  "VITE_PROGRAMMING_MODERATION_ENABLED === 'true'",
  "supabase.functions.invoke('report-programming'",
  "supabase.functions.invoke('moderate-programming'",
  'getProgrammingModeratorAccess',
  'listPendingProgrammingReports',
  'removeReportedProgramming',
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing moderation client behavior ${required}.`);
}

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(reportButton)) failures.push(`${reportButtonFile}: missing ${language} report-control copy.`);
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(consolePage)) failures.push(`${consoleFile}: missing ${language} moderation-console copy.`);
}

for (const required of [
  'getMyProgrammingReport(slot.id)',
  'PROGRAMMING_REPORT_REASONS.map',
  'reportProgramming({ slotId: slot.id, reason, details })',
  '<Dialog open={open}',
]) {
  if (!reportButton.includes(required)) failures.push(`${reportButtonFile}: missing member programming-report UI behavior ${required}.`);
}

for (const required of [
  'getProgrammingModeratorAccess()',
  'listPendingProgrammingReports()',
  "act(report.id, 'dismiss')",
  "act(report.id, 'remove')",
  'report.creator_programming_slots',
]) {
  if (!consolePage.includes(required)) failures.push(`${consoleFile}: missing moderation-console behavior ${required}.`);
}
if (consolePage.includes('report.reporter_id')) failures.push(`${consoleFile}: moderator UI must not render reporter identity.`);

for (const required of [
  'import ProgrammingModerationAdmin from "./ProgrammingModerationAdmin";',
  'ProgrammingModerationAdmin,',
  '["/ProgrammingModerationAdmin", ProgrammingModerationAdmin]',
]) {
  if (!routes.includes(required)) failures.push(`${routesFile}: missing private programming moderation route ${required}.`);
}

for (const required of [
  "if old.status = 'booked' and new.status <> 'booked' then",
  "and status = 'active';",
]) {
  if (!cancellation.includes(required)) failures.push(`${cancellationFile}: removed programming must continue cancelling still-active member reminders (${required}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove programming moderation check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Programming moderation is private, duplicate-safe, UUID-validated, allowlist-controlled, routed, reporter-minimized and connected to program/reminder removal integrity.');
