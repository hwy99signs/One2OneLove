import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260819_programming_reminder_cancellation.sql';
const dispatcherFile = 'supabase/functions/dispatch-programming-reminders/index.ts';

const migration = fs.readFileSync(migrationFile, 'utf8');
const dispatcher = fs.readFileSync(dispatcherFile, 'utf8');

for (const required of [
  'after update of status on public.creator_programming_slots',
  "if old.status = 'booked' and new.status <> 'booked' then",
  'update public.programming_reminders',
  "and status = 'active';",
  'when (old.status is distinct from new.status)',
  'revoke all on function public.cancel_active_programming_reminders_for_closed_slot() from public, anon, authenticated;',
]) {
  if (!migration.includes(required)) {
    failures.push(`${migrationFile}: missing cancellation safeguard ${required}.`);
  }
}

for (const forbidden of [
  "status in ('active','processing')",
  "status = 'processing';",
  "status = 'sent';",
]) {
  if (migration.includes(forbidden)) {
    failures.push(`${migrationFile}: cancellation trigger must not rewrite dispatcher-owned/sent reminder state (${forbidden}).`);
  }
}

for (const required of [
  ".select('id,program_source,title,starts_at,ends_at,content_mode,status')",
  "slot.status !== 'booked'",
  "status: 'cancelled'",
]) {
  if (!dispatcher.includes(required)) {
    failures.push(`${dispatcherFile}: dispatcher must continue re-checking the programming slot after claim (${required}).`);
  }
}

if (failures.length) {
  console.error('\n⛔ One2OneLove programming reminder cancellation check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Cancelled/completed programming proactively cancels only active reminders; processing reminders remain safely dispatcher-controlled.');
