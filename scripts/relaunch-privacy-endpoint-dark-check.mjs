import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const fn = read('supabase/functions/privacy-request/index.ts');
const manageFn = read('supabase/functions/manage-privacy-requests/index.ts');
const reviewService = read('src/lib/privacyReviewService.js');
const reviewPage = read('src/pages/PrivacyAdmin.jsx');
const legacyPageAlias = read('src/pages/PrivacyRequests.jsx');
const router = read('src/pages/index.jsx');

requireText(fn, "Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'", 'Privacy member endpoint must have a server-side activation gate.');
requireText(fn, "return json(request, { error: 'REQUESTS_NOT_ENABLED' }, 503)", 'Disabled privacy member endpoint must fail closed with REQUESTS_NOT_ENABLED.');

const gateIndex = fn.indexOf("Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'");
const listIndex = fn.indexOf("if (action === 'list')");
const authIndex = fn.indexOf('serviceClient.auth.getUser(token)');
if (gateIndex < 0 || listIndex < 0 || gateIndex > listIndex) failures.push('Privacy activation gate must execute before request-history/list handling.');
if (gateIndex < 0 || authIndex < 0 || gateIndex > authIndex) failures.push('Privacy activation gate must execute before member-data/authenticated queue access.');

requireText(fn, "new Set(['data_export', 'account_deletion'])", 'Member privacy intake must expose only reviewed export/deletion request types.');
forbidText(fn, 'admin.deleteUser', 'Privacy member endpoint must not directly delete auth users.');
forbidText(fn, 'auth.admin', 'Privacy member endpoint must not use privileged auth-administration APIs.');

requireText(manageFn, "Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'", 'Privacy staff endpoint must use the same explicit server activation gate.');
requireText(manageFn, "return json(request, { success: true, enabled: false, eligible: false, requests: [] })", 'Disabled staff review endpoint must return a no-data dark response.');
const manageGateIndex = manageFn.indexOf("Deno.env.get('PRIVACY_REQUESTS_ENABLED') !== 'true'");
const manageAuthIndex = manageFn.indexOf('callerClient.auth.getUser()');
const manageServiceIndex = manageFn.indexOf('const serviceClient = createClient(supabaseUrl, serviceRoleKey');
if (manageGateIndex < 0 || manageAuthIndex < 0 || manageGateIndex > manageAuthIndex) failures.push('Staff privacy activation gate must execute before reviewer authentication/data handling.');
if (manageGateIndex < 0 || manageServiceIndex < 0 || manageGateIndex > manageServiceIndex) failures.push('Staff privacy activation gate must execute before service-role queue access.');
requireText(manageFn, 'PRIVACY_FULFILLMENT_NOT_AVAILABLE', 'Even when review is enabled, staff endpoint must reject fulfillment semantics.');
forbidText(manageFn, 'admin.deleteUser', 'Privacy staff endpoint must not directly delete auth users.');
forbidText(manageFn, 'auth.admin', 'Privacy staff endpoint must not use privileged auth-administration APIs.');

requireText(reviewService, "export const PRIVACY_REVIEW_ENABLED = import.meta.env.VITE_PRIVACY_REQUESTS_ENABLED === 'true'", 'Privacy staff browser service must default off with the privacy rollout flag.');
requireText(reviewPage, 'if (!PRIVACY_REVIEW_ENABLED)', 'Privacy staff page must render a staged/dark state when the browser flag is off.');

const alias = legacyPageAlias.trim();
if (!alias.endsWith("export { default } from './PrivacyCenter';")) failures.push('Legacy PrivacyRequests filename must resolve to the canonical PrivacyCenter page.');
forbidText(legacyPageAlias, 'data_correction', 'Legacy privacy page must not revive the obsolete data-correction workflow.');
forbidText(legacyPageAlias, 'listMyPrivacyRequests', 'Legacy privacy page must not revive direct-table history logic.');
forbidText(legacyPageAlias, 'cancelPrivacyRequest', 'Legacy privacy page must not revive direct-table cancellation logic.');

requireText(router, '["/PrivacyCenter", PrivacyCenter]', 'Canonical /PrivacyCenter route must remain wired.');
requireText(router, '["/PrivacyAdmin", PrivacyAdmin]', 'Private review console must remain routed only for server-authorized reviewers once enabled.');
forbidText(router, '["/PrivacyRequests", PrivacyRequests]', 'Obsolete /PrivacyRequests route must remain absent.');
forbidText(router, 'import PrivacyRequests from "./PrivacyRequests"', 'Router must not import obsolete PrivacyRequests implementation.');
forbidText(router, "import PrivacyRequests from './PrivacyRequests'", 'Router must not import obsolete PrivacyRequests implementation.');

if (failures.length) {
  console.error('\nPrivacy endpoint dark-mode / canonical-route blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Privacy endpoint dark-mode preflight passed: both member and staff endpoints stay data-dark while disabled, /PrivacyCenter remains canonical, and review cannot become fulfillment.');
