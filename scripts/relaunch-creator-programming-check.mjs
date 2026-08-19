import fs from 'node:fs';

const failures = [];
const serviceFile = 'src/lib/creatorProgrammingService.js';
const pageFile = 'src/pages/CreatorProgramming.jsx';
const routesFile = 'src/pages/index.jsx';
const migrationFile = 'supabase/migrations/20260819_creator_programming_calendar.sql';
const bookingFunctionFile = 'supabase/functions/book-creator-programming-slot/index.ts';
const listingFunctionFile = 'supabase/functions/list-creator-programming/index.ts';
const statusFunctionFile = 'supabase/functions/current-creator-programming/index.ts';

const read = (file) => fs.readFileSync(file, 'utf8');
const service = read(serviceFile);
const page = read(pageFile);
const routes = read(routesFile);
const migration = read(migrationFile);
const bookingFunction = read(bookingFunctionFile);
const listingFunction = read(listingFunctionFile);
const statusFunction = read(statusFunctionFile);

for (const required of [
  "VITE_CREATOR_PROGRAMMING_ENABLED === 'true'",
  "booking_tier: 'free'",
  "policy_acknowledged: policyAcknowledged === true",
  "supabase.functions.invoke('book-creator-programming-slot'",
  "supabase.functions.invoke('list-creator-programming'",
  "supabase.functions.invoke('current-creator-programming'",
  'export const getGlobalProgrammingStatus = async () =>',
  "if (to) query = query.lt('starts_at', to);",
  "if (from) query = query.gt('ends_at', from);",
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing staged creator-programming guard ${required}.`);
}

for (const required of [
  'const HOURS = Array.from({ length: 24 }',
  'up to 2 free creator slots per day',
  'Future paid slots are prepared in the system but are not active.',
  '{t.notice}',
  'const [policyAcknowledged, setPolicyAcknowledged] = useState(false);',
  'const overlaps = (slot, starts, ends)',
  'schedule.filter((slot) => overlaps(slot, hourStart, hourEnd))',
  'const selectedSlotConflict = useMemo(',
  'schedule.some((slot) => overlaps(slot, selectedWindow.starts, selectedWindow.ends))',
  'const freeSlotsUsed = useMemo(',
  "slot.creator_local_date === date",
  '{freeSlotsUsed}/2 {t.freeUsed}',
  '{t.conflictWarning}',
  'selectedSlotConflict || freeSlotsUsed >= 2',
  '!title.trim() || !startTime || !policyAcknowledged || selectedSlotConflict || freeSlotsUsed >= 2 || !selectedWindow',
  'policyAcknowledged });',
  'checked={policyAcknowledged}',
  'setPolicyAcknowledged(event.target.checked)',
  '<span>{t.policyLabel}</span>',
  'setPolicyAcknowledged(false);',
  'toast.error(t.loadError)',
  'toast.success(t.bookedSuccess)',
  'toast.error(t.bookError)',
  'toast.error(t.cancelError)',
]) {
  if (!page.includes(required)) failures.push(`${pageFile}: missing approved calendar behavior/copy ${required}.`);
}

for (const forbidden of [
  "toast.error(error?.message || 'Unable to load creator programming.')",
  "toast.success('Creator programming slot booked.')",
  "toast.error(error?.message || 'Unable to book this programming slot.')",
  "toast.error(error?.message || 'Unable to cancel this programming slot.')",
]) {
  if (page.includes(forbidden)) failures.push(`${pageFile}: hard-coded English runtime feedback remains (${forbidden}).`);
}

for (const language of ['en', 'es', 'fr', 'it', 'de']) {
  const blockPattern = new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`);
  const match = page.match(blockPattern);
  if (!match) {
    failures.push(`${pageFile}: missing ${language} creator-programming copy block.`);
    continue;
  }
  for (const key of ['policyLabel', 'freeUsed', 'conflictWarning']) {
    if (!new RegExp(`\\b${key}:\\s*`).test(match[1])) failures.push(`${pageFile}: ${language} is missing ${key}.`);
  }
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
  'policy_version text not null',
  'policy_acknowledged_at timestamptz not null',
  'booked_count >= 2',
  'creator_programming_slots_no_room_overlap',
  'alter table public.creator_programming_slots enable row level security;',
  'revoke all on table public.creator_programming_slots from anon, authenticated;',
  'grant update (status, updated_at) on table public.creator_programming_slots to authenticated;',
  'drop constraint if exists room_messages_room_slug_allowed;',
  'add constraint room_messages_room_slug_allowed',
  "'global-relationship-room',\n    'vent-room'",
  "'global-relationship-room','vent-room'",
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing database safeguard ${required}.`);
}

for (const required of [
  "Deno.env.get('CREATOR_PROGRAMMING_ENABLED') !== 'true'",
  "const CREATOR_PROGRAMMING_POLICY_VERSION = 'creator-programming-v1'",
  'FREE_DAILY_LIMIT = 2',
  "creator?.user_type !== 'influencer'",
  "body?.policy_acknowledged === true",
  "return json(request, { error: 'POLICY_ACK_REQUIRED' }, 400)",
  'policy_version: CREATOR_PROGRAMMING_POLICY_VERSION',
  'policy_acknowledged_at: new Date().toISOString()',
  "bookingTier !== 'free'",
  "String(insertError.message || '').includes('CREATOR_DAILY_FREE_LIMIT_REACHED')",
  "return json(request, { error: 'DAILY_FREE_LIMIT_REACHED' }, 409)",
  "return json(request, { error: 'SLOT_CONFLICT' }, 409)",
]) {
  if (!bookingFunction.includes(required)) failures.push(`${bookingFunctionFile}: missing backend booking safeguard ${required}.`);
}

for (const required of [
  ".lt('starts_at', to.toISOString())",
  ".gt('ends_at', requestedFrom.toISOString())",
  'Return every booking that overlaps the requested calendar window',
]) {
  if (!listingFunction.includes(required)) failures.push(`${listingFunctionFile}: missing overlap-window schedule behavior ${required}.`);
}

for (const [file, source] of [
  [listingFunctionFile, listingFunction],
  [statusFunctionFile, statusFunction],
]) {
  for (const forbidden of ["select('*')", 'creator_user_id', 'replay_url', 'booking_tier', 'price_cents', 'payment_status', 'policy_version', 'policy_acknowledged_at']) {
    const publicSelection = source.match(/const publicFields = '([^']+)'/)?.[1]
      || source.split('.select(')[1]?.split(')')[0]
      || '';
    if (publicSelection.includes(forbidden)) failures.push(`${file}: public programming payload exposes forbidden field ${forbidden}.`);
  }
}

for (const required of [
  "const GLOBAL_ROOM = 'global-relationship-room'",
  "return json(request, { success: true, enabled: false, current: null, next: null })",
  "const publicFields = 'id,room_slug,title,description,starts_at,ends_at,content_mode'",
  'current: publicSlot(currentRows?.[0] || null)',
  'next: publicSlot(nextRows?.[0] || null)',
]) {
  if (!statusFunction.includes(required)) failures.push(`${statusFunctionFile}: missing privacy-safe now/next behavior ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove creator programming check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Creator programming remains feature-gated, multilingual, policy-acknowledged, overlap-accurate, conflict-aware, two-free-slots/day limited, Global-Room compatible, privacy-minimized and paid-slot disabled.');
