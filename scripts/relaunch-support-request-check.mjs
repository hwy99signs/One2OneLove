import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260819_support_requests.sql';
const memberFunctionFile = 'supabase/functions/support-request/index.ts';
const adminFunctionFile = 'supabase/functions/manage-support-requests/index.ts';
const serviceFile = 'src/lib/supportRequestService.js';
const memberPageFile = 'src/pages/SupportRequests.jsx';
const adminPageFile = 'src/pages/SupportAdmin.jsx';
const helpControlFile = 'src/components/support/HelpCenterSupportControl.jsx';
const helpShellFile = 'src/pages/HelpCenterRelaunchWithSupport.jsx';
const routesFile = 'src/pages/index.jsx';

const migration = fs.readFileSync(migrationFile, 'utf8');
const memberFunction = fs.readFileSync(memberFunctionFile, 'utf8');
const adminFunction = fs.readFileSync(adminFunctionFile, 'utf8');
const service = fs.readFileSync(serviceFile, 'utf8');
const memberPage = fs.readFileSync(memberPageFile, 'utf8');
const adminPage = fs.readFileSync(adminPageFile, 'utf8');
const helpControl = fs.readFileSync(helpControlFile, 'utf8');
const helpShell = fs.readFileSync(helpShellFile, 'utf8');
const routes = fs.readFileSync(routesFile, 'utf8');

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
  'const UUID_PATTERN =',
  'const requireRequestId =',
  "error: 'REQUEST_ID_INVALID'",
  'EMAIL_CONFIRMATION_REQUIRED',
  ".eq('user_id', caller.id)",
  "if (action === 'list')",
  "if (action === 'get')",
  "if (action === 'mark_response_read')",
  "if (action === 'close')",
  "if (action !== 'create')",
  "action: 'created'",
  "action: 'member_closed'",
]) {
  if (!memberFunction.includes(required)) failures.push(`${memberFunctionFile}: missing member support safeguard ${required}.`);
}
const memberGateIndex = memberFunction.indexOf("Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true'");
const memberListIndex = memberFunction.indexOf("if (action === 'list')");
if (memberGateIndex < 0 || memberListIndex < 0 || memberGateIndex > memberListIndex) {
  failures.push(`${memberFunctionFile}: support feature gate must fail closed before member queue reads.`);
}
if (memberFunction.includes('staff_response: body') || memberFunction.includes('user_id: body')) {
  failures.push(`${memberFunctionFile}: member endpoint must not accept staff-response or arbitrary user ownership from request body.`);
}

for (const required of [
  "Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true'",
  "Deno.env.get('O2OL_SUPPORT_ADMIN_USER_IDS')",
  'const UUID_PATTERN =',
  '.filter((value) => UUID_PATTERN.test(value))',
  'EMAIL_CONFIRMATION_REQUIRED',
  'allowedAdminIds().has(caller.id)',
  "if (!eligible) return json(request, { error: 'O2OL_SUPPORT_ADMIN_REQUIRED' }, 403)",
  "if (!UUID_PATTERN.test(requestId)) return json(request, { error: 'REQUEST_ID_INVALID' }, 400)",
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
const adminGateIndex = adminFunction.indexOf("Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true'");
const adminAccessIndex = adminFunction.indexOf("if (action === 'access')");
if (adminGateIndex < 0 || adminAccessIndex < 0 || adminGateIndex > adminAccessIndex) {
  failures.push(`${adminFunctionFile}: support feature gate must fail closed before staff access/queue handling.`);
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
  'markSupportResponseRead',
  'getSupportAdminAccess',
  'listSupportQueue',
]) {
  if (!service.includes(required)) failures.push(`${serviceFile}: missing support client behavior ${required}.`);
}

for (const language of ['en','es','fr','it','de']) {
  const memberBlock = memberPage.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`))?.[1] || '';
  const adminBlock = adminPage.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`))?.[1] || '';
  const helpBlock = helpControl.match(new RegExp(`\\n\\s{2}${language}:\\s*\\{([^\\n]+)`))?.[1] || '';
  if (!memberBlock) failures.push(`${memberPageFile}: missing ${language} member-support copy.`);
  if (!adminBlock) failures.push(`${adminPageFile}: missing ${language} support-admin copy.`);
  if (!helpBlock) failures.push(`${helpControlFile}: missing ${language} Help Center support copy.`);
  for (const key of ['signInButton', 'back', 'boundary', 'safetyNotice']) {
    if (memberBlock && !new RegExp(`\\b${key}:\\s*`).test(memberBlock)) failures.push(`${memberPageFile}: ${language} missing ${key}.`);
  }
  for (const key of ['categories', 'statuses']) {
    if (adminBlock && !new RegExp(`\\b${key}:\\s*`).test(adminBlock)) failures.push(`${adminPageFile}: ${language} missing ${key}.`);
  }
  for (const key of ['title', 'text', 'boundary', 'open', 'signIn']) {
    if (helpBlock && !new RegExp(`\\b${key}:\\s*`).test(helpBlock)) failures.push(`${helpControlFile}: ${language} missing ${key}.`);
  }
}

for (const required of [
  'createSupportRequest({ category, subject, message })',
  'listMySupportRequests()',
  'markSupportResponseRead(item.id)',
  'closeSupportRequest(requestId)',
  'item.staff_response',
  "navigate('/SignIn?returnTo=%2FSupportRequests')",
  "navigate('/HelpCenter')",
  "category === 'safety'",
  '{t.safetyNotice}',
  '{t.boundary}',
]) {
  if (!memberPage.includes(required)) failures.push(`${memberPageFile}: missing member support behavior ${required}.`);
}

for (const required of [
  'getSupportAdminAccess()',
  'listSupportQueue(filter)',
  "act(item.id, 'respond')",
  "act(item.id, 'start')",
  "act(item.id, 'close')",
  "act(item.id, 'reopen')",
  't.categories[item.category] || item.category',
  't.statuses[item.status] || item.status',
]) {
  if (!adminPage.includes(required)) failures.push(`${adminPageFile}: missing support-admin behavior ${required}.`);
}
if (adminPage.includes('>{item.category}</span>') || adminPage.includes('>{item.status}</span>')) {
  failures.push(`${adminPageFile}: staff queue must not render raw category/status enums as the primary label.`);
}

for (const required of [
  'if (!SUPPORT_REQUESTS_ENABLED) return null;',
  "? '/SupportRequests'",
  ": '/SignIn?returnTo=%2FSupportRequests'",
  '{t.boundary}',
]) {
  if (!helpControl.includes(required)) failures.push(`${helpControlFile}: missing feature-gated Help Center support behavior ${required}.`);
}
for (const forbidden of ['mailto:', 'sms:', 'tel:', '/ContactUs']) {
  if (helpControl.includes(forbidden)) failures.push(`${helpControlFile}: Help Center support must not revive an unverified external/contact delivery path (${forbidden}).`);
}

for (const required of [
  "import HelpCenterRelaunch from './HelpCenterRelaunch'",
  "import HelpCenterSupportControl from '@/components/support/HelpCenterSupportControl'",
  '<HelpCenterRelaunch />',
  '<HelpCenterSupportControl languageCode={currentLanguage} />',
]) {
  if (!helpShell.includes(required)) failures.push(`${helpShellFile}: missing reviewed Help + member-support composition ${required}.`);
}

for (const required of [
  'import SupportRequests from "./SupportRequests";',
  'import SupportAdmin from "./SupportAdmin";',
  'import HelpCenter from "./HelpCenterRelaunchWithSupport";',
  '["/SupportRequests", SupportRequests]',
  '["/SupportAdmin", SupportAdmin]',
  '["/HelpCenter", HelpCenter]',
]) {
  if (!routes.includes(required)) failures.push(`${routesFile}: missing private support/help route ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove support request check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Member support requests remain feature-gated, confirmed-account-only, UUID-validated, private, discoverable through reviewed Help, allowlist-administered, audited, multilingual, non-emergency and external-provider-free.');
