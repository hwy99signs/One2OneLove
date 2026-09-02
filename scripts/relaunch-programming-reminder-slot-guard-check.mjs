import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260819_programming_reminder_slot_guard.sql';
const source = fs.readFileSync(migrationFile, 'utf8');

for (const required of [
  'before insert or update of slot_id, remind_at, status',
  'from public.creator_programming_slots',
  'for share;',
  "if new.status <> 'active' then",
  "if slot_status <> 'booked' then",
  'if slot_starts_at <= now() then',
  'if new.remind_at > slot_starts_at then',
  'revoke all on function public.enforce_active_programming_reminder_slot_validity() from public, anon, authenticated;',
]) {
  if (!source.includes(required)) {
    failures.push(`${migrationFile}: missing database reminder validity safeguard ${required}.`);
  }
}

for (const requiredError of [
  'PROGRAMMING_REMINDER_SLOT_NOT_FOUND',
  'PROGRAMMING_REMINDER_SLOT_NOT_BOOKED',
  'PROGRAMMING_REMINDER_SLOT_ALREADY_STARTED',
  'PROGRAMMING_REMINDER_TIME_AFTER_START',
]) {
  if (!source.includes(requiredError)) {
    failures.push(`${migrationFile}: missing explicit validity error ${requiredError}.`);
  }
}

if (failures.length) {
  console.error('\n⛔ One2OneLove programming reminder slot guard check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Active programming reminders are database-bound to booked future slots with valid reminder times.');
