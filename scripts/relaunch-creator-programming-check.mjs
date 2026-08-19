import fs from 'node:fs';

const failures = [];
const serviceFile = 'src/lib/creatorProgrammingService.js';
const pageFile = 'src/pages/CreatorProgramming.jsx';
const routesFile = 'src/pages/index.jsx';
const migrationFile = 'supabase/migrations/20260819_creator_programming_calendar.sql';
const bookingFunctionFile = 'supabase/functions/book-creator-programming-slot/index.ts';
const listingFunctionFile = 'supabase/functions/list-creator-programming/index.ts';

const read = (file) => fs.readFileSync(file, 'utf8');
const service = read(serviceFile);
const page = read(pageFile);
const routes = read(routesFile);
const migration = read(migrationFile);
const bookingFunction = read(bookingFunctionFile);
const listingFunction = read(listingFunctionFile);

for (const required of [
  "VITE_CREATOR_PROGRAMMING_ENABLED === 'true'",
  "booking_tier: 'free'",
  "supabase.functions.invoke('book-creator-programming-slot'",
  "supabase.functions.invoke('list-creator-programming'",
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing staged creator-programming guard ${required}.`);
}

for (const required of [
  'const HOURS = Array.from({ length: 24 }',
  'up to 2 free creator slots per day',
  'Future paid slots are prepared in the system but are not active.',
  '{t.notice}',
]) {
  if (!page.includes(required)) failures.push(`${pageFile}: missing approved calendar behavior/copy ${required}.`);
}

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  const languageBlock = new RegExp(`\\n\\s{2}${language}:\\s*\\{`);
  if (!languageBlock.test(page)) failures.push(`${pageFile}: missing ${language} creator-programming copy block.`);
}

for (const required of [
  'import CreatorProgramming from "./CreatorProgramming";',
  '["/CreatorProgramming", CreatorProgramming]',
]) {
  if (!routes.includes(required)) failures.push(`${routesFile}: missing creator-programming route binding ${required}.`);
}

for (const required of [
  "check (room_slug in ('global-relationship-room'))",
  "check (booking_tier in ('free','paid'))",
  'booked_count >= 2',
  'creator_programming_slots_no_room_overlap',
  'alter table public.creator_programming_slots enable row level security;',
  'revoke all on table public.creator_programming_slots from anon, authenticated;',
  'grant update (status, updated_at) on table public.creator_programming_slots to authenticated;',
  "'global-relationship-room','vent-room'",
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing database safeguard ${required}.`);
}

for (const required of [
  "Deno.env.get('CREATOR_PROGRAMMING_ENABLED') !== 'true'",
  'FREE_DAILY_LIMIT = 2',
  "creator?.user_type !== 'influencer'",
  "bookingTier !== 'free'",
  "return json(request, { error: 'SLOT_CONFLICT' }, 409)",
]) {
  if (!bookingFunction.includes(required)) failures.push(`${bookingFunctionFile}: missing backend booking safeguard ${required}.`);
}

for (const forbidden of [
  "select('*')",
  'creator_user_id,title,description',
  'replay_url',
]) {
  const selectionLine = listingFunction.split(".select(")[1]?.split(')')[0] || '';
  if (selectionLine.includes(forbidden)) failures.push(`${listingFunctionFile}: public schedule selection exposes forbidden field ${forbidden}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove creator programming check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Creator programming remains feature-gated, multilingual, two-free-slots/day limited, overlap-protected and paid-slot disabled.');
