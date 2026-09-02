import fs from 'node:fs';

const failures = [];
const pageFile = 'src/pages/ProgrammingSchedule.jsx';
const routesFile = 'src/pages/index.jsx';
const communityFile = 'src/pages/LiveCommunity.jsx';
const linkFile = 'src/components/programming/ProgrammingScheduleLink.jsx';

const page = fs.readFileSync(pageFile, 'utf8');
const routes = fs.readFileSync(routesFile, 'utf8');
const community = fs.readFileSync(communityFile, 'utf8');
const link = fs.readFileSync(linkFile, 'utf8');

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(page)) {
    failures.push(`${pageFile}: missing ${language} member schedule copy.`);
  }
}

for (const required of [
  'CREATOR_PROGRAMMING_ENABLED',
  'listPublishedProgramming({ from, to })',
  'ProgrammingReminderButton',
  "slot.program_source === 'o2ol' ? t.o2ol : t.creator",
  "slot.content_mode === 'replay' ? t.replay : t.live",
  "navigate('/LiveRoom?room=global-relationship-room')",
  'const liveNow = start <= now && end > now;',
  'addDays(weekStart, 7)',
]) {
  if (!page.includes(required)) failures.push(`${pageFile}: missing member programming behavior ${required}.`);
}

for (const forbidden of [
  'creator_user_id',
  'replay_url',
  'price_cents',
  'payment_status',
  'policy_version',
  'policy_acknowledged_at',
]) {
  if (page.includes(forbidden)) failures.push(`${pageFile}: member schedule must not consume private programming field ${forbidden}.`);
}

for (const required of [
  'import ProgrammingSchedule from "./ProgrammingSchedule";',
  '["/ProgrammingSchedule", ProgrammingSchedule]',
]) {
  if (!routes.includes(required)) failures.push(`${routesFile}: missing member programming schedule route ${required}.`);
}

for (const required of [
  'import ProgrammingScheduleLink from "@/components/programming/ProgrammingScheduleLink";',
  '<ProgrammingScheduleLink className="border-violet-200 bg-white text-violet-700 hover:bg-violet-50" />',
]) {
  if (!community.includes(required)) failures.push(`${communityFile}: missing Community programming schedule entry ${required}.`);
}

for (const required of [
  'CREATOR_PROGRAMMING_ENABLED',
  'if (!CREATOR_PROGRAMMING_ENABLED || !isAuthenticated) return null;',
  "navigate('/ProgrammingSchedule')",
]) {
  if (!link.includes(required)) failures.push(`${linkFile}: missing schedule-link gate/navigation ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove member programming schedule check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Member programming schedule is multilingual, feature-gated, discoverable from Community, reminder-ready and limited to privacy-safe programming metadata.');
