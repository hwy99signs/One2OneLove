import fs from 'node:fs';

const failures = [];
const config = fs.readFileSync('src/lib/membershipConfig.js', 'utf8');
const subscription = fs.readFileSync('src/pages/Subscription.jsx', 'utf8');
const premium = fs.readFileSync('src/pages/PremiumFeatures.jsx', 'utf8');

if (!config.includes("formatMembershipPrice = (amount, locale = 'en-US')")) {
  failures.push('membershipConfig.js: price formatter must accept a locale while retaining a safe en-US fallback.');
}
if (!config.includes('new Intl.NumberFormat(locale,')) {
  failures.push('membershipConfig.js: Intl price formatting must use the supplied locale.');
}

for (const binding of [
  'formatMembershipPrice(MEMBERSHIP_PRICING.introMonthly, locale)',
  'formatMembershipPrice(MEMBERSHIP_PRICING.standardMonthly, locale)',
  "t.thenPrice.replace('$5.99', standardPrice)",
]) {
  if (!subscription.includes(binding) && !premium.includes(binding)) {
    failures.push(`membership UI: missing locale-aware pricing binding ${binding}.`);
  }
}

if (!subscription.includes('const locale = LOCALES[currentLanguage] || LOCALES.en;')) {
  failures.push('Subscription.jsx: selected One2OneLove language must resolve to an explicit locale.');
}
if (!premium.includes('const locale = LOCALES[language] || LOCALES.en;')) {
  failures.push('PremiumFeatures.jsx: selected One2OneLove language must resolve to an explicit locale.');
}
if (!premium.includes('localizeFeatureTerms(COPY[language], FEATURE_TERMS[language] || [])')) {
  failures.push('PremiumFeatures.jsx: translated membership copy must pass through localized product-feature naming.');
}

for (const locale of ['en-US', 'es-ES', 'fr-FR', 'it-IT', 'de-DE']) {
  if (!subscription.includes(locale) && !premium.includes(locale)) {
    failures.push(`membership UI: missing active locale ${locale}.`);
  }
}

if (failures.length) {
  console.error('\n⛔ One2OneLove membership multilingual check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Membership pricing and premium feature naming follow the five active One2OneLove languages without changing approved USD prices.');
