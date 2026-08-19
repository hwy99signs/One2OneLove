import fs from 'node:fs';

const failures = [];
const pageFile = 'src/pages/ProgrammingSchedule.jsx';
const routesFile = 'src/pages/index.jsx';

const page = fs.readFileSync(pageFile, 'utf8');
const routes = fs.readFileSync(routesFile, 'utf8');

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

if (failures.length) {
  console.error('\n⛔ One2OneLove member programming schedule check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Member programming schedule is multilingual, feature-gated, reminder-ready and limited to privacy-safe programming metadata.');
