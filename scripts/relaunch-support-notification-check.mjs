import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260819_support_response_read_state.sql';
const memberFunctionFile = 'supabase/functions/support-request/index.ts';
const serviceFile = 'src/lib/supportRequestService.js';
const centerFile = 'src/components/support/SupportNotificationCenter.jsx';
const layoutFile = 'src/pages/LayoutRelaunch.jsx';

const migration = fs.readFileSync(migrationFile, 'utf8');
const memberFunction = fs.readFileSync(memberFunctionFile, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
const center = fs.readFileSync(centerFile, 'utf8');
const layout = fs.readFileSync(layoutFile, 'utf8');

for (const required of [
  'add column if not exists member_response_read_at timestamptz null',
  'create or replace function o2ol_private.reset_support_response_read_state()',
  'security invoker',
  "set search_path = ''",
  'new.member_response_read_at = null;',
  'before update of staff_response, responded_at',
  'revoke all on function o2ol_private.reset_support_response_read_state() from public, anon, authenticated;',
  'execute function o2ol_private.reset_support_response_read_state();',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing support-response read-state safeguard ${required}.`);
}
if (migration.includes('function public.reset_support_response_read_state')) {
  failures.push(`${migrationFile}: support read-state trigger helper must remain outside the public schema.`);
}

for (const required of [
  "if (action === 'mark_response_read')",
  ".eq('user_id', caller.id)",
  ".not('staff_response', 'is', null)",
  'member_response_read_at',
]) {
  if (!memberFunction.includes(required)) failures.push(`${memberFunctionFile}: missing member-owned support read action ${required}.`);
}

for (const required of [
  'export const markSupportResponseRead',
  "action: 'mark_response_read'",
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing support read-state client behavior ${required}.`);
}

for (const language of ['en','es','fr','it','de']) {
  const block = center.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([^\\n]+)`))?.[1] || '';
  if (!block) failures.push(`${centerFile}: missing ${language} support-notification copy.`);
  if (block && !/\bopenSupport:\s*/.test(block)) failures.push(`${centerFile}: ${language} is missing the direct member-support entry label.`);
}
for (const required of [
  "export default function SupportNotificationCenter({ languageCode = 'en' })",
  'listMySupportRequests()',
  '!item.member_response_read_at',
  'markSupportResponseRead(item.id)',
  "navigate('/SupportRequests')",
  'const openSupport = () =>',
  '{t.openSupport}',
  'window.setInterval(() => void load(), 60_000)',
]) {
  if (!center.includes(required)) failures.push(`${centerFile}: missing private/localized support-notification behavior ${required}.`);
}
for (const forbidden of ['fetch(', 'mailto:', 'sms:', 'tel:']) {
  if (center.includes(forbidden)) failures.push(`${centerFile}: support notification center must remain in-app only (${forbidden}).`);
}

for (const required of [
  "import SupportNotificationCenter from '@/components/support/SupportNotificationCenter';",
  '<SupportNotificationCenter languageCode={currentLanguage} />',
]) {
  if (!layout.includes(required)) failures.push(`${layoutFile}: missing relaunch-header support notification integration ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove support notification check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Support response notifications remain private, multilingual, read-state aware, privately-triggered, directly navigable and in-app only.');
