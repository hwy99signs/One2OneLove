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
]) {
  if (!subscription.includes(binding) && !premium.includes(binding)) {
    failures.push(`membership UI: missing locale-aware pricing binding ${binding}.`);
  }
}

if (!subscription.includes("const language = LOCALES[currentLanguage] ? currentLanguage : 'en';")) {
  failures.push('Subscription.jsx: selected One2OneLove language must resolve through the active locale map.');
}
if (!subscription.includes('const locale = LOCALES[language] || LOCALES.en;')) {
  failures.push('Subscription.jsx: selected One2OneLove language must resolve to an explicit locale.');
}
if (!subscription.includes('localizeFeatureTerms(getMembershipCopy(language).subscription, FEATURE_TERMS[language] || [])')) {
  failures.push('Subscription.jsx: translated membership copy must pass through localized product-feature naming.');
}
if (!subscription.includes("t.thenPrice.replace('$5.99', standardPrice)")) {
  failures.push('Subscription.jsx: ongoing approved price must be localized inside the existing translated sentence.');
}
if (subscription.includes('const t = getMembershipCopy(currentLanguage).subscription;')) {
  failures.push('Subscription.jsx: do not bypass the feature-term localization layer.');
}

if (!premium.includes('const locale = LOCALES[language] || LOCALES.en;')) {
  failures.push('PremiumFeatures.jsx: selected One2OneLove language must resolve to an explicit locale.');
}
if (!premium.includes('localizeFeatureTerms(COPY[language], FEATURE_TERMS[language] || [])')) {
  failures.push('PremiumFeatures.jsx: translated membership copy must pass through localized product-feature naming.');
}

const expectedSubscriptionTerms = {
  es: ['Notas de Amor', 'Nota de Amor', 'Comunidad en Vivo'],
  fr: ['Mots d’Amour', 'Mot d’Amour', 'Communauté en Direct'],
  it: ['Note d’Amore', 'Nota d’Amore', 'Community dal Vivo'],
  de: ['Liebesnotizen', 'Liebesnotiz', 'Live-Community'],
};
for (const [language, terms] of Object.entries(expectedSubscriptionTerms)) {
  if (!subscription.includes(`${language}: [`)) {
    failures.push(`Subscription.jsx: missing ${language} feature-term localization map.`);
    continue;
  }
  for (const term of terms) {
    if (!subscription.includes(term)) failures.push(`Subscription.jsx: ${language} feature-term map is missing ${term}.`);
  }
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

console.log('✅ Membership pricing and feature naming follow the five active One2OneLove languages without changing approved USD prices.');
