import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const fn = read('supabase/functions/privacy-request/index.ts');
const legacyPageAlias = read('src/pages/PrivacyRequests.jsx');
const router = read('src/pages/index.jsx');

requireText(fn, "Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'", 'Privacy member endpoint must have a server-side activation gate.');
requireText(fn, "return json(request, { error: 'REQUESTS_NOT_ENABLED' }, 503)", 'Disabled privacy endpoint must fail closed with REQUESTS_NOT_ENABLED.');

const gateIndex = fn.indexOf("Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'");
const listIndex = fn.indexOf("if (action === 'list')");
const authIndex = fn.indexOf('serviceClient.auth.getUser(token)');
if (gateIndex < 0 || listIndex < 0 || gateIndex > listIndex) {
  failures.push('Privacy activation gate must execute before request-history/list handling.');
}
if (gateIndex < 0 || authIndex < 0 || gateIndex > authIndex) {
  failures.push('Privacy activation gate must execute before member-data/authenticated queue access.');
}

requireText(fn, "new Set(['data_export', 'account_deletion'])", 'Member privacy intake must expose only reviewed export/deletion request types.');
forbidText(fn, 'admin.deleteUser', 'Privacy member endpoint must not directly delete auth users.');
forbidText(fn, 'auth.admin', 'Privacy member endpoint must not use privileged auth-administration APIs.');

const alias = legacyPageAlias.trim();
if (!alias.endsWith("export { default } from './PrivacyCenter';")) {
  failures.push('Legacy PrivacyRequests filename must resolve to the canonical PrivacyCenter page.');
}
forbidText(legacyPageAlias, 'data_correction', 'Legacy privacy page must not revive the obsolete data-correction workflow.');
forbidText(legacyPageAlias, 'listMyPrivacyRequests', 'Legacy privacy page must not revive direct-table history logic.');
forbidText(legacyPageAlias, 'cancelPrivacyRequest', 'Legacy privacy page must not revive direct-table cancellation logic.');

requireText(router, '["/PrivacyCenter", PrivacyCenter]', 'Canonical /PrivacyCenter route must remain wired.');
forbidText(router, '["/PrivacyRequests", PrivacyRequests]', 'Obsolete /PrivacyRequests route must remain absent.');
forbidText(router, 'import PrivacyRequests from "./PrivacyRequests"', 'Router must not import obsolete PrivacyRequests implementation.');
forbidText(router, "import PrivacyRequests from './PrivacyRequests'", 'Router must not import obsolete PrivacyRequests implementation.');

if (failures.length) {
  console.error('\nPrivacy endpoint dark-mode / canonical-route blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Privacy endpoint dark-mode preflight passed: disabled means no history/intake access, /PrivacyCenter is canonical, and obsolete privacy UI cannot reappear.');
