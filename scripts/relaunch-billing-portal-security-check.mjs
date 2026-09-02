import fs from 'node:fs';

const failures = [];
const portalFile = 'supabase/functions/create-billing-portal-session/index.ts';
const source = fs.readFileSync(portalFile, 'utf8');

for (const required of [
  "Deno.env.get('PAYMENTS_ENABLED') !== 'true'",
  'const CUSTOMER_ID_PATTERN = /^cus_[A-Za-z0-9]+$/',
  'const PORTAL_CONFIGURATION_ID_PATTERN = /^bpc_[A-Za-z0-9]+$/',
  ".from('member_subscriptions')",
  ".select('stripe_customer_id')",
  "if (membershipError) return json(request, { error: 'BILLING_ACCOUNT_UNAVAILABLE' }, 503)",
  "if (legacyError) return json(request, { error: 'BILLING_ACCOUNT_UNAVAILABLE' }, 503)",
  "if (!CUSTOMER_ID_PATTERN.test(customerId))",
  "if (!PORTAL_CONFIGURATION_ID_PATTERN.test(portalConfigurationId))",
  "fetch('https://api.stripe.com/v1/billing_portal/sessions'",
  "form.set('return_url', `${requireHttpsSiteUrl()}/Subscription`)",
  'const validHttpsUrl = (value: unknown) =>',
  "return url.protocol === 'https:' ? url.toString().slice(0, 2000) : ''",
  'const url = validHttpsUrl(payload?.url)',
  "if (!url) return json(request, { error: 'BILLING_PORTAL_UNAVAILABLE' }, 502)",
]) {
  if (!source.includes(required)) failures.push(`${portalFile}: missing billing-portal safeguard ${required}.`);
}

for (const forbidden of [
  'body?.customer',
  'body?.customerId',
  'payload?.error?.message',
  "return json(request, { url: payload?.url",
  "http:'",
]) {
  if (source.includes(forbidden)) failures.push(`${portalFile}: billing portal must not trust browser/customer identifiers, log provider prose, or accept non-HTTPS return URLs (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove billing portal security check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Billing portal staging remains caller-bound, server-customer-derived, Stripe-ID validated and HTTPS-return-only.');
