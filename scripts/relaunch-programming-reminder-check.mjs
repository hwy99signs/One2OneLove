import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260819_programming_reminders.sql';
const actionFunctionFile = 'supabase/functions/programming-reminder/index.ts';
const dispatchFunctionFile = 'supabase/functions/dispatch-programming-reminders/index.ts';
const serviceFile = 'src/lib/programmingReminderService.js';
const buttonFile = 'src/components/programming/ProgrammingReminderButton.jsx';
const liveRoomFile = 'src/pages/LiveRoom.jsx';

const read = (file) => fs.readFileSync(file, 'utf8');
const migration = read(migrationFile);
const actionFunction = read(actionFunctionFile);
const dispatcher = read(dispatchFunctionFile);
const service = read(serviceFile);
const button = read(buttonFile);
const liveRoom = read(liveRoomFile);

for (const required of [
  "status text not null default 'active' check (status in ('active','processing','sent','cancelled'))",
  'reminder_id uuid not null unique',
  "notification_type text not null default 'programming_reminder'",
  'program_title text not null',
  "program_source text not null check (program_source in ('creator','o2ol'))",
  "content_mode text not null check (content_mode in ('live','replay'))",
  'starts_at timestamptz not null',
  'grant select on table public.programming_reminders to authenticated;',
  'grant select on table public.programming_notifications to authenticated;',
  'grant update (read_at) on table public.programming_notifications to authenticated;',
  'alter table public.programming_reminders enable row level security;',
  'alter table public.programming_notifications enable row level security;',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing reminder privacy/idempotency safeguard ${required}.`);
}

for (const forbidden of [
  'title text not null',
  'body text not null',
  'recipient_email',
  'recipient_phone',
]) {
  if (migration.includes(forbidden)) failures.push(`${migrationFile}: language-neutral/private reminder storage contains forbidden field ${forbidden}.`);
}

for (const required of [
  "Deno.env.get('PROGRAMMING_REMINDERS_ENABLED') !== 'true'",
  "const action = clean(body?.action, 20) || 'status'",
  "if (action === 'status')",
  "if (action === 'cancel')",
  "if (action !== 'set')",
  ".eq('user_id', caller.id)",
  ".eq('status', 'booked')",
  'const remindAt = desiredReminder > now ? desiredReminder : now',
  "status: 'active'",
]) {
  if (!actionFunction.includes(required)) failures.push(`${actionFunctionFile}: missing member reminder safeguard ${required}.`);
}

for (const required of [
  "Deno.env.get('PROGRAMMING_REMINDERS_ENABLED') !== 'true'",
  "Deno.env.get('PROGRAMMING_REMINDER_DISPATCH_SECRET')",
  "request.headers.get('x-o2ol-programming-reminder-secret')",
  "status: 'processing'",
  "status: 'active'",
  "status: 'sent'",
  "status: 'cancelled'",
  "notification_type: 'programming_reminder'",
  'reminder_id: claimed.id',
  "notificationError.code !== '23505'",
  "action_path: '/LiveRoom?room=global-relationship-room'",
]) {
  if (!dispatcher.includes(required)) failures.push(`${dispatchFunctionFile}: missing dispatcher safety/idempotency behavior ${required}.`);
}
if (dispatcher.includes('fetch(')) {
  failures.push(`${dispatchFunctionFile}: programming reminder dispatcher must remain in-app only and must not call external providers.`);
}

for (const required of [
  "VITE_PROGRAMMING_REMINDERS_ENABLED === 'true'",
  "supabase.functions.invoke('programming-reminder'",
  "select('id,reminder_id,slot_id,notification_type,program_title,program_source,content_mode,starts_at,action_path,read_at,created_at')",
  ".update({ read_at: new Date().toISOString() })",
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing private reminder client behavior ${required}.`);
}

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(button)) {
    failures.push(`${buttonFile}: missing ${language} reminder-button copy.`);
  }
}
for (const required of [
  'PROGRAMMING_REMINDERS_ENABLED',
  'getProgrammingReminderStatus(slot.id)',
  'setProgrammingReminder(slot.id)',
  'cancelProgrammingReminder(slot.id)',
  "reminder?.status === 'active' || reminder?.status === 'processing'",
  "reminder?.status === 'sent'",
]) {
  if (!button.includes(required)) failures.push(`${buttonFile}: missing reminder-button state behavior ${required}.`);
}

for (const required of [
  "import ProgrammingReminderButton from '@/components/programming/ProgrammingReminderButton';",
  '!live ? <ProgrammingReminderButton slot={slot} /> : null',
]) {
  if (!liveRoom.includes(required)) failures.push(`${liveRoomFile}: missing Up-next reminder integration ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove programming reminder check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Programming reminders remain feature-gated, private, language-neutral in storage, localized in UI, idempotent, in-app only and tied to the Up-next program.');
