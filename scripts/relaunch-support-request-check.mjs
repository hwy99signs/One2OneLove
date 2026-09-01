import fs from 'node:fs';

const failures = [];
const read = (file) => fs.readFileSync(file, 'utf8');
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const migrationFile = 'supabase/migrations/20260819_support_requests.sql';
const auditMigrationFile = 'supabase/migrations/20260831012000_support_request_audit_integrity.sql';
const memberFunctionFile = 'supabase/functions/support-request/index.ts';
const adminFunctionFile = 'supabase/functions/manage-support-requests/index.ts';
const serviceFile = 'src/lib/supportRequestService.js';
const memberPageFile = 'src/pages/SupportRequests.jsx';
const adminPageFile = 'src/pages/SupportAdmin.jsx';
const helpControlFile = 'src/components/support/HelpCenterSupportControl.jsx';
const helpShellFile = 'src/pages/HelpCenterRelaunchWithSupport.jsx';
const routesFile = 'src/pages/index.jsx';

const migration = read(migrationFile);
const auditMigration = read(auditMigrationFile);
const memberFunction = read(memberFunctionFile);
const adminFunction = read(adminFunctionFile);
const service = read(serviceFile);
const memberPage = read(memberPageFile);
const adminPage = read(adminPageFile);
const helpControl = read(helpControlFile);
const helpShell = read(helpShellFile);
const routes = read(routesFile);

for (const required of [
  'user_id uuid not null references auth.users(id) on delete cascade',
  "category text not null check (category in ('account','technical','billing','safety','feedback','other'))",
  "status text not null default 'open' check (status in ('open','in_progress','resolved','closed'))",
  'alter table public.support_requests enable row level security;',
  'alter table public.support_request_audit enable row level security;',
  'using ((select auth.uid()) = user_id);',
]) requireText(migration, required, `${migrationFile}: missing support privacy safeguard ${required}.`);
for (const forbidden of ['email text', 'phone text', 'grant select on table public.support_request_audit to authenticated']) {
  forbidText(migration, forbidden, `${migrationFile}: support tables must not duplicate contact data or expose audit records (${forbidden}).`);
}

for (const required of [
  'revoke select on table public.support_requests from authenticated;',
  'grant select (',
  'member_response_read_at',
  'last_actor_user_id',
  'last_actor_kind',
  'references auth.users(id) on delete set null',
  'create trigger support_requests_audit_lifecycle',
]) requireText(auditMigration, required, `${auditMigrationFile}: missing final support audit/privacy safeguard ${required}.`);
const grantBlock = auditMigration.match(/grant select \(([\s\S]*?)\) on table public\.support_requests to authenticated;/i)?.[1] || '';
for (const privateField of ['last_actor_user_id', 'last_actor_kind']) {
  if (grantBlock.includes(privateField)) failures.push(`${auditMigrationFile}: authenticated column grant must not expose ${privateField}.`);
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
  'last_actor_user_id: caller.id',
  "last_actor_kind: 'member'",
]) requireText(memberFunction, required, `${memberFunctionFile}: missing member support safeguard ${required}.`);
const memberGateIndex = memberFunction.indexOf("Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true'");
const memberListIndex = memberFunction.indexOf("if (action === 'list')");
if (memberGateIndex < 0 || memberListIndex < 0 || memberGateIndex > memberListIndex) failures.push(`${memberFunctionFile}: support feature gate must fail closed before member queue reads.`);
for (const forbidden of ["staff_response: body", "user_id: body", ".from('support_request_audit')"]) forbidText(memberFunction, forbidden, `${memberFunctionFile}: member endpoint violates atomic/ownership boundary (${forbidden}).`);

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
  'last_actor_user_id: caller.id',
  "last_actor_kind: 'staff'",
]) requireText(adminFunction, required, `${adminFunctionFile}: missing support-admin safeguard ${required}.`);
const adminGateIndex = adminFunction.indexOf("Deno.env.get('SUPPORT_REQUESTS_ENABLED') !== 'true'");
const adminAccessIndex = adminFunction.indexOf("if (action === 'access')");
if (adminGateIndex < 0 || adminAccessIndex < 0 || adminGateIndex > adminAccessIndex) failures.push(`${adminFunctionFile}: support feature gate must fail closed before staff access/queue handling.`);
for (const forbidden of ["user_type === 'regular'", "user_type === 'professional'", "user_type === 'therapist'", "user_type === 'influencer'", "select('id,user_id,category", ".from('support_request_audit')", 'last_actor_user_id,', 'last_actor_kind,']) {
  forbidText(adminFunction, forbidden, `${adminFunctionFile}: support admin authority/payload must not expose member/actor identity or duplicate audit writes (${forbidden}).`);
}

for (const required of [
  "VITE_SUPPORT_REQUESTS_ENABLED === 'true'",
  "supabase.functions.invoke('support-request'",
  "supabase.functions.invoke('manage-support-requests'",
  'markSupportResponseRead',
  'getSupportAdminAccess',
  'listSupportQueue',
]) requireText(service, required, `${serviceFile}: missing support client behavior ${required}.`);

// Translation objects may be compact one-line entries or expanded blocks. Validate language
// presence and the required nested maps semantically rather than by whitespace formatting.
const languageSlice = (source, language, nextLanguage) => {
  const start = source.indexOf(`  ${language}: {`);
  if (start < 0) return '';
  const end = nextLanguage ? source.indexOf(`  ${nextLanguage}: {`, start + 1) : source.indexOf('\n};', start + 1);
  return source.slice(start, end > start ? end : undefined);
};
const activeLanguages = ['en','es','fr','it','de'];
for (let index = 0; index < activeLanguages.length; index += 1) {
  const language = activeLanguages[index];
  const next = index + 1 < activeLanguages.length ? activeLanguages[index + 1] : 'nl';
  const memberBlock = languageSlice(memberPage, language, next);
  const adminBlock = languageSlice(adminPage, language, next);
  const helpBlock = languageSlice(helpControl, language, next);
  if (!memberBlock) failures.push(`${memberPageFile}: missing ${language} member-support copy.`);
  if (!adminBlock) failures.push(`${adminPageFile}: missing ${language} support-admin copy.`);
  if (!helpBlock) failures.push(`${helpControlFile}: missing ${language} Help Center support copy.`);
  for (const key of ['signInButton', 'back', 'boundary', 'safetyNotice']) if (memberBlock && !new RegExp(`\\b${key}:\\s*`).test(memberBlock)) failures.push(`${memberPageFile}: ${language} missing ${key}.`);
  for (const key of ['categories', 'statuses']) if (adminBlock && !new RegExp(`\\b${key}:\\s*`).test(adminBlock)) failures.push(`${adminPageFile}: ${language} missing ${key}.`);
  for (const key of ['title', 'text', 'boundary', 'open', 'signIn']) if (helpBlock && !new RegExp(`\\b${key}:\\s*`).test(helpBlock)) failures.push(`${helpControlFile}: ${language} missing ${key}.`);
}

for (const required of [
  'createSupportRequest({ category, subject, message })', 'listMySupportRequests()', 'markSupportResponseRead(item.id)', 'closeSupportRequest(requestId)', 'item.staff_response', "navigate('/SignIn?returnTo=%2FSupportRequests')", "navigate('/HelpCenter')", "category === 'safety'", '{t.safetyNotice}', '{t.boundary}',
]) requireText(memberPage, required, `${memberPageFile}: missing member support behavior ${required}.`);

for (const required of [
  'getSupportAdminAccess()', 'listSupportQueue(filter)', "act(item.id, 'respond')", "act(item.id, 'start')", "act(item.id, 'close')", "act(item.id, 'reopen')", 't.categories[item.category] || item.category', 't.statuses[item.status] || item.status',
]) requireText(adminPage, required, `${adminPageFile}: missing support-admin behavior ${required}.`);
if (adminPage.includes('>{item.category}</span>') || adminPage.includes('>{item.status}</span>')) failures.push(`${adminPageFile}: staff queue must not render raw category/status enums as the primary label.`);

for (const required of ['if (!SUPPORT_REQUESTS_ENABLED) return null;', "? '/SupportRequests'", ": '/SignIn?returnTo=%2FSupportRequests'", '{t.boundary}']) requireText(helpControl, required, `${helpControlFile}: missing feature-gated Help Center support behavior ${required}.`);
for (const forbidden of ['mailto:', 'sms:', 'tel:', '/ContactUs']) forbidText(helpControl, forbidden, `${helpControlFile}: Help Center support must not revive an unverified external/contact delivery path (${forbidden}).`);

for (const required of ["import HelpCenterRelaunch from './HelpCenterRelaunch'", "import HelpCenterSupportControl from '@/components/support/HelpCenterSupportControl'", '<HelpCenterRelaunch />', '<HelpCenterSupportControl languageCode={currentLanguage} />']) requireText(helpShell, required, `${helpShellFile}: missing reviewed Help + member-support composition ${required}.`);
for (const required of ['import SupportRequests from "./SupportRequests";', 'import SupportAdmin from "./SupportAdmin";', 'import HelpCenter from "./HelpCenterRelaunchWithSupport";', '["/SupportRequests", SupportRequests]', '["/SupportAdmin", SupportAdmin]', '["/HelpCenter", HelpCenter]']) requireText(routes, required, `${routesFile}: missing private support/help route ${required}.`);

if (failures.length) {
  console.error('\n⛔ One2OneLove support request check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Member support remains feature-gated, confirmed-account-only, private, allowlist-administered, database-atomically audited, multilingual, non-emergency and external-provider-free.');
