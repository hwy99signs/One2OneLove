import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const activeLanguages = ['en', 'es', 'fr', 'it', 'de'];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function requireText(content, text, label) {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
}

function rejectText(content, text, label) {
  if (content.includes(text)) failures.push(`Unsafe ${label}: ${text}`);
}

function requireLanguages(file) {
  const content = read(file);
  for (const language of activeLanguages) requireText(content, `${language}:`, `${language} translation in ${file}`);
  return content;
}

const signIn = requireLanguages('src/pages/SignIn.jsx');
requireText(signIn, 'getAuthUiTranslation', 'safe localized sign-in messaging');
requireText(signIn, 'autoComplete="email"', 'sign-in email autocomplete');
requireText(signIn, 'autoComplete="current-password"', 'sign-in password autocomplete');
requireText(signIn, 'authT.invalidCredentials', 'generic credential failure message');
rejectText(signIn, 'error.message', 'raw sign-in backend error disclosure');
rejectText(signIn, 'console.log', 'sign-in debug logging');

const signUp = requireLanguages('src/pages/SignUp.jsx');
requireText(signUp, 'RegularUserForm', 'regular account signup flow');

const regularUser = requireLanguages('src/components/signup/RegularUserForm.jsx');
requireText(regularUser, 'getAuthUiTranslation', 'safe localized registration messaging');
requireText(regularUser, 'minLength={8}', 'registration password minimum');
requireText(regularUser, 'createPageUrl("TermsOfService")', 'Terms of Service consent');
requireText(regularUser, 'createPageUrl("PrivacyPolicy")', 'Privacy Policy consent');
rejectText(regularUser, 'error.message', 'raw registration backend error disclosure');
rejectText(regularUser, 'console.log', 'registration debug logging');

const verificationDialog = requireLanguages('src/components/signup/EmailVerificationDialog.jsx');
requireText(verificationDialog, 'requiresVerification', 'verification-aware signup result handling');

const influencer = requireLanguages('src/pages/InfluencerSignup.jsx');
requireText(influencer, 'minLength={8}', 'influencer password minimum');
requireText(influencer, 'autoComplete="new-password"', 'influencer real password input');
requireText(influencer, 'to="/TermsOfService"', 'influencer Terms consent');
requireText(influencer, 'to="/PrivacyPolicy"', 'influencer Privacy consent');
rejectText(influencer, '123456', 'placeholder influencer verification code');
rejectText(influencer, 'tempPassword', 'temporary influencer password');
rejectText(influencer, 'emailVerificationCode', 'fake influencer email verification state');
rejectText(influencer, 'phoneVerificationCode', 'fake influencer phone verification state');
rejectText(influencer, 'error.message', 'raw influencer backend error disclosure');
rejectText(influencer, 'result.error', 'raw influencer registration error disclosure');
const influencerService = read('src/lib/influencerService.js');
requireText(influencerService, "status: 'pending'", 'pending influencer moderation status');

const professional = requireLanguages('src/pages/ProfessionalSignup.jsx');
requireText(professional, 'minLength={8}', 'professional password minimum');
requireText(professional, 'autoComplete="new-password"', 'professional real password input');
requireText(professional, 'to="/TermsOfService"', 'professional Terms consent');
requireText(professional, 'to="/PrivacyPolicy"', 'professional Privacy consent');
rejectText(professional, '123456', 'placeholder professional verification code');
rejectText(professional, 'tempPassword', 'temporary professional password');
rejectText(professional, 'emailVerificationCode', 'fake professional email verification state');
rejectText(professional, 'phoneVerificationCode', 'fake professional phone verification state');
rejectText(professional, 'error.message', 'raw professional backend error disclosure');
rejectText(professional, 'result.error', 'raw professional registration error disclosure');
const professionalService = read('src/lib/professionalService.js');
requireText(professionalService, "status: 'pending'", 'pending professional moderation status');

const influencerDetails = requireLanguages('src/components/signup/InfluencerSignupForm.jsx');
requireText(influencerDetails, 'At least one platform link is required', 'influencer platform-link guidance');
const professionalDetails = requireLanguages('src/components/signup/OtherUserSignupForm.jsx');
requireText(professionalDetails, 'application will be reviewed', 'professional moderation disclosure');
const profilePhoto = requireLanguages('src/components/signup/ProfilePhotoUpload.jsx');
rejectText(profilePhoto, 'alert(', 'blocking profile-photo browser alert');
requireText(profilePhoto, 'role="alert"', 'accessible profile-photo validation');

const subscription = requireLanguages('src/pages/Subscription.jsx');
requireText(subscription, 'createBillingPortalSession', 'Stripe-hosted billing management');
requireText(subscription, 'getPaymentHistory', 'verified payment history read');
rejectText(subscription, '1-on-1 Expert Consultation', 'unsupported expert consultation promise');
rejectText(subscription, 'Premium Support (24/7)', 'unsupported 24/7 premium support promise');

const tierCard = requireLanguages('src/components/subscriptions/TierCard.jsx');
requireText(tierCard, 'handleSubscriptionCheckout', 'server-authoritative tier action');
rejectText(tierCard, 'window.location.reload', 'forced subscription reload success assumption');

const stripeClient = read('src/lib/stripeService.js');
requireText(stripeClient, "body: { planName }", 'server-authoritative checkout payload');
requireText(stripeClient, "create-billing-portal", 'Stripe billing portal client path');
rejectText(stripeClient, "subscription_plan: 'Basic'", 'client-side plan mutation');
rejectText(stripeClient, 'userId:', 'client-supplied billing user ID');
rejectText(stripeClient, 'priceId:', 'client-supplied Stripe price ID');

const checkoutFunction = read('supabase/functions/create-checkout-session/index.ts');
requireText(checkoutFunction, "new Set(['Premiere', 'Exclusive'])", 'paid plan allowlist');
requireText(checkoutFunction, 'ctx.supabaseAdmin', 'trusted checkout account writes');
requireText(checkoutFunction, 'subscription_data', 'Stripe subscription metadata');
rejectText(checkoutFunction, 'payload.priceId', 'client-controlled checkout price');
rejectText(checkoutFunction, 'payload.userId', 'client-controlled checkout user');

const billingPortalFunction = read('supabase/functions/create-billing-portal/index.ts');
requireText(billingPortalFunction, 'billingPortal.sessions.create', 'Stripe-hosted billing portal creation');
requireText(billingPortalFunction, 'ctx.supabaseAdmin', 'trusted billing-profile lookup');

const webhookFunction = read('supabase/functions/stripe-webhook/index.ts');
requireText(webhookFunction, 'stripe.webhooks.constructEvent', 'Stripe webhook signature verification');
requireText(webhookFunction, "new Set(['Premiere', 'Exclusive'])", 'webhook paid plan allowlist');
requireText(webhookFunction, "subscription_plan: 'Basic'", 'verified webhook downgrade to Basic');
requireText(webhookFunction, "onConflict: 'stripe_invoice_id'", 'idempotent invoice history');

const partnerSecurity = read('supabase-partner-profile-security.sql');
requireText(partnerSecurity, 'influencers can update own pending profile', 'pending-only influencer updates');
requireText(partnerSecurity, 'professionals can update own pending profile', 'pending-only professional updates');
requireText(partnerSecurity, 'revoke all on table public.influencer_profiles from anon, authenticated', 'partner least privilege reset');

const accountSecurity = read('supabase-account-core-security.sql');
requireText(accountSecurity, 'protect_user_managed_fields', 'account billing protection trigger');
requireText(accountSecurity, "new.subscription_plan := 'Basic'", 'safe new-account Basic default');
requireText(accountSecurity, 'new.subscription_plan := old.subscription_plan', 'client subscription mutation protection');
requireText(accountSecurity, 'revoke all on table public.payment_history from anon', 'anonymous payment history lock');

const legacyApiSecurity = read('supabase-legacy-api-security.sql');
requireText(legacyApiSecurity, 'auth.uid() <> p_user_id', 'legacy user-bound RPC authorization');
requireText(legacyApiSecurity, 'from public, anon, authenticated', 'billing mutation RPC authenticated revoke');
requireText(legacyApiSecurity, 'to service_role', 'billing mutation service-role grant');

const paymentIdempotency = read('supabase-payment-webhook-idempotency.sql');
requireText(paymentIdempotency, 'payment_history_stripe_invoice_unique', 'Stripe payment idempotency index');

const profileLock = read('supabase-global-room-creator-profile-lock.sql');
requireText(profileLock, 'creators can update own pending room profile', 'pending-only creator profile update policy');
requireText(profileLock, "status = 'pending'", 'approved creator profile lock');
requireText(profileLock, 'daily_slot_limit = 2', 'creator quota integrity');

const privilegedApiLock = read('supabase-global-room-privilege-lockdown.sql');
requireText(privilegedApiLock, 'revoke all on table public.global_room_moderators', 'moderator registry direct-access lock');
requireText(privilegedApiLock, 'revoke all on table public.global_room_moderation_audit', 'moderation audit direct-access lock');
requireText(privilegedApiLock, "revoke execute on function %s from public, anon", 'privileged RPC anonymous-execution lock');

const cancellations = read('supabase-global-room-cancellations.sql');
requireText(cancellations, 'idx_room_cancellation_one_open_per_slot', 'single open cancellation request constraint');
requireText(cancellations, 'review_global_room_cancellation_request', 'trusted cancellation review RPC');

const remediationWorkflow = read('.github/workflows/o2ol-audit-remediation.yml');
requireText(remediationWorkflow, 'npm audit fix', 'non-force dependency remediation');
rejectText(remediationWorkflow, 'npm audit fix --force', 'forced dependency remediation');
requireText(remediationWorkflow, 'npm run build', 'post-remediation production build');

if (failures.length) {
  console.error('\nO2OL security verification failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('O2OL security verification passed.');
