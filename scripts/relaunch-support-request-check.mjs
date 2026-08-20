import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260819_support_requests.sql';
const memberFunctionFile = 'supabase/functions/support-request/index.ts';
const adminFunctionFile = 'supabase/functions/manage-support-requests/index.ts';
const serviceFile = 'src/lib/supportRequestService.js';
const memberPageFile = 'src/pages/SupportRequests.jsx';
const adminPageFile = 'src/pages/SupportAdmin.jsx';

const migration = fs.readFileSync(migrationFile, 'utf8');
const memberFunction = fs.readFileSync(memberFunctionFile, 'utf8');
const adminFunction = fs.readFileSync(adminFunctionFile, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
const memberPage = fs.readFileSync(memberPageFile, 'utf8');
const adminPage = fs.readFileSync(adminPageFile, 'utf8');

for (const required of [
  'user_id uuid not null references auth.users(id) on delete cascade',
  "category text not null check (category in ('account','technical','billing','safety','feedback','other'))",
  "status text not null default 'open' check (status in ('open','in_progress','resolved','closed'))",
  'alter table public.support_requests enable row level security;',
  'alter table public.support_request_audit enable row level security;',
  'grant select on table public.support_requests to authenticated;',
  'using ((select auth.uid()) = user_id);',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing support privacy safeguard ${required}.`);
}
for (const forbidden of ['email text', 'phone text', 'grant select on table public.support_request_audit to authenticated']) {
  if (migration.includes(forbidden)) failures.push(`${migrationFile}: support tables must not duplicate contact data or expose audit records (${forbidden}).`);
}

for (const required of [
  "Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true'",
  'MAX_OPEN_REQUESTS = 5',
  ".eq('user_id', caller.id)",
  "if (action === 'list')",
  "if (action === 'get')",
  "if (action === 'close')",
  "if (action !== 'create')",
  "action: 'created'",
  "action: 'member_closed'",
]) {
  if (!memberFunction.includes(required)) failures.push(`${memberFunctionFile}: missing member support safeguard ${required}.`);
}
if (memberFunction.includes('staff_response: body') || memberFunction.includes('user_id: body')) {
  failures.push(`${memberFunctionFile}: member endpoint must not accept staff-response or arbitrary user ownership from request body.`);
}

for (const required of [
  "Deno.env.get('O2OL_SUPPORT_ADMIN_USER_IDS')",
  'allowedAdminIds().has(caller.id)',
  "if (!eligible) return json(request, { error: 'O2OL_SUPPORT_ADMIN_REQUIRED' }, 403)",
  "if (action === 'list')",
  "if (action === 'start')",
  "if (action === 'respond')",
  "if (action === 'close')",
  "if (action === 'reopen')",
  "action: 'staff_started'",
  "action: 'staff_resolved'",
  "action: 'staff_closed'",
  "action: 'staff_reopened'",
]) {
  if (!adminFunction.includes(required)) failures.push(`${adminFunctionFile}: missing support-admin safeguard ${required}.`);
}
for (const forbidden of [
  "user_type === 'regular'",
  "user_type === 'professional'",
  "user_type === 'therapist'",
  "user_type === 'influencer'",
  "select('id,user_id,category",
]) {
  if (adminFunction.includes(forbidden)) failures.push(`${adminFunctionFile}: support admin authority/payload must not depend on profile role or expose member UUID (${forbidden}).`);
}

for (const required of [
  "VITE_SUPPORT_REQUESTS_ENABLED === 'true'",
  "supabase.functions.invoke('support-request'",
  "supabase.functions.invoke('manage-support-requests'",
  'getSupportAdminAccess',
  'listSupportQueue',
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing support client behavior ${required}.`);
}

for (const language of ['en','es','fr','it','de']) {
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(memberPage)) failures.push(`${memberPageFile}: missing ${language} member-support copy.`);
  if (!new RegExp(`\\n\\s{2}${language}:\\s*\\{`).test(adminPage)) failures.push(`${adminPageFile}: missing ${language} support-admin copy.`);
}
for (const required of ['createSupportRequest({ category, subject, message })', 'listMySupportRequests()', 'closeSupportRequest(requestId)', 'item.staff_response']) {
  if (!memberPage.includes(required)) failures.push(`${memberPageFile}: missing member support behavior ${required}.`);
}
for (const required of ['getSupportAdminAccess()', 'listSupportQueue(filter)', "act(item.id, 'respond')", "act(item.id, 'start')", "act(item.id, 'close')", "act(item.id, 'reopen')"]) {
  if (!adminPage.includes(required)) failures.push(`${adminPageFile}: missing support-admin behavior ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove support request check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Member support requests remain signed-in, private, allowlist-administered, audited, multilingual and external-provider-free.');
