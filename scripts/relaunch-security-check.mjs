import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const required = [
  'supabase/migrations/20260817_community_member_policy_hardening.sql',
  'supabase/migrations/20260817_community_content_hardening.sql',
  'supabase/migrations/20260817_buddy_request_hardening.sql',
  'supabase/migrations/20260817_member_subscriptions.sql',
  'supabase/migrations/20260817_billing_history_hardening.sql',
  'supabase/functions/create-checkout-session/index.ts',
  'supabase/functions/create-billing-portal-session/index.ts',
  'supabase/functions/stripe-webhook/index.ts',
  'src/lib/membershipConfig.js',
  'supabase/migrations/20260817_conversation_hardening.sql',
  'supabase/migrations/20260817_message_insert_hardening.sql',
];
for (const file of required) check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');

const communityMembership = exists(required[0]) ? read(required[0]) : '';
check('community join cannot self-assign admin', communityMembership.includes("role = 'member'") && communityMembership.includes('ensure_community_creator_membership'), 'Creator admin must be server-created; normal self-join is member-only.');
check('community approval cannot be bypassed on join', communityMembership.includes("status = case when c.requires_approval then 'pending' else 'active' end"), 'Join status must follow community approval setting.');
check('community moderator role escalation is blocked', communityMembership.includes('Moderators cannot change member roles') && communityMembership.includes('Community membership identity fields are immutable'), 'Moderator/admin boundaries and row identity must be protected.');

const communityContent = exists(required[1]) ? read(required[1]) : '';
check('community post identity is server-derived', communityContent.includes('new.author_id := auth.uid()'), 'Post/comment author identity must not trust browser input.');
check('community post moderation and counts are protected', communityContent.includes("new.is_pinned := false") && communityContent.includes("new.moderation_status := 'approved'") && communityContent.includes('Protected post routing/moderation/count fields'), 'Members must not self-pin/approve or rewrite counters.');
check('community posting respects allow_member_posts', communityContent.includes('c.allow_member_posts = true or public.is_community_moderator_or_admin'), 'Disabled member posting must be enforced by the database.');

const buddyMigration = exists(required[2]) ? read(required[2]) : '';
const buddyService = exists('src/lib/buddyService.js') ? read('src/lib/buddyService.js') : '';
check('buddy request insert is auth-derived pending', buddyMigration.includes('new.from_user_id := auth.uid()') && buddyMigration.includes("new.status := 'pending'"), 'Browser cannot forge sender or pre-accept a request.');
check('buddy response transition is recipient-only', buddyMigration.includes('Only the request recipient may accept or reject') && buddyMigration.includes("new.status not in ('accepted', 'rejected')"), 'Only pending -> accepted/rejected is allowed by recipient.');
check('buddy client derives actor from Auth', buddyService.includes('requireAuthenticatedUser') && buddyService.includes('expectedUserId !== user.id'), 'Caller-supplied actor IDs must not be trusted.');
check('buddy client uses safe member directory', buddyService.includes(".from('member_directory')") && !buddyService.includes(".from('users')"), 'Buddy discovery must not read private users rows.');

const membershipMigration = exists(required[3]) ? read(required[3]) : '';
check('membership state is browser-private', membershipMigration.includes('revoke all on table public.member_subscriptions from anon, authenticated'), 'Stripe identifiers and state must be server-managed.');
check('membership has safe own projection', membershipMigration.includes('public.my_membership') && membershipMigration.includes('where user_id = auth.uid()'), 'Browser reads only own sanitized membership state.');
check('membership tracks schedule reconciliation', membershipMigration.includes("'reconciliation_required'"), 'Intro-to-standard pricing failures must not be silently ignored.');

const billingHistory = exists(required[4]) ? read(required[4]) : '';
check('billing history is read-only to browser', billingHistory.includes('revoke all on table public.payment_history from anon, authenticated') && billingHistory.includes('grant select on table public.payment_history to authenticated'), 'Browser must not write payment audit records.');
check('invoice history is idempotent', billingHistory.includes('payment_history_stripe_invoice_uidx'), 'Stripe invoice redelivery must not create duplicate payment rows.');

const stripeService = exists('src/lib/stripeService.js') ? read('src/lib/stripeService.js') : '';
check('browser cannot write subscription fields', !/\.from\(['\"]users['\"]\)[\s\S]{0,240}\.update\(/.test(stripeService), 'Client billing service must not mutate public.users billing fields.');
check('browser does not choose Stripe price/amount/account', !/priceId|subscriptionPrice|amount:\s*plan|userId:\s*user\.id|email:\s*user\.email/.test(stripeService), 'Checkout request should carry only the server-recognized plan key.');
check('browser billing has activation switch', stripeService.includes('VITE_PAYMENTS_ENABLED'), 'Development previews must not accidentally activate checkout.');
check('browser membership reads safe projection', stripeService.includes(".from('my_membership')"), 'Membership UI should not read private Stripe identifiers.');

const checkout = exists(required[5]) ? read(required[5]) : '';
check('checkout has server payment kill switch', checkout.includes("PAYMENTS_ENABLED') !== 'true'"), 'Deploying checkout must not activate billing.');
check('checkout restricts allowed origins', checkout.includes('PAYMENT_ALLOWED_ORIGINS') && checkout.includes('ORIGIN_NOT_ALLOWED'), 'Checkout browser origin must be explicit.');
check('checkout derives authenticated confirmed user', checkout.includes('userClient.auth.getUser()') && checkout.includes('EMAIL_NOT_CONFIRMED'), 'Browser user ID/email must not determine billing identity.');
check('checkout maps only server price IDs', checkout.includes("Deno.env.get('STRIPE_PRICE_INTRO')") && checkout.includes("Deno.env.get('STRIPE_PRICE_STANDARD')") && !/body\?\.(priceId|amount|userId|email)/.test(checkout), 'Price/customer identity must be server-controlled.');
check('checkout validates approved launch amounts', checkout.includes('INTRO_CENTS = 199') && checkout.includes('STANDARD_CENTS = 599') && checkout.includes('validateLaunchPrices'), 'Misconfigured Stripe prices must fail closed.');

const portal = exists(required[6]) ? read(required[6]) : '';
check('billing portal requires confirmed auth', portal.includes('userClient.auth.getUser()') && portal.includes('EMAIL_NOT_CONFIRMED'), 'Portal must be bound to the signed-in account.');
check('billing portal derives customer server-side', portal.includes(".from('member_subscriptions')") && !/body\?\.customer|customerId\s*=\s*body/.test(portal), 'Browser must not choose a Stripe customer.');
check('billing portal uses Stripe-hosted session', portal.includes('/v1/billing_portal/sessions'), 'Billing management should use a short-lived hosted portal session.');

const webhook = exists(required[7]) ? read(required[7]) : '';
check('webhook verifies Stripe signature on raw body', webhook.includes('verifyStripeSignature') && webhook.includes("request.headers.get('stripe-signature')") && webhook.includes('request.text()'), 'Unsigned/modified webhooks must be rejected.');
check('webhook enforces launch metadata', webhook.includes('o2ol_pricing_version') && webhook.includes('not_launch_membership'), 'New handler must not silently claim unrelated Stripe subscriptions.');
check('webhook schedules six intro months', webhook.includes('INTRO_MONTHS = 6') && webhook.includes("phases[0][duration][interval_count]"), 'Approved intro period must be encoded server-side.');
check('webhook transitions to standard price then releases', webhook.includes("phases[1][items][0][price]") && webhook.includes("end_behavior', 'release'"), 'Standard recurring price transition must be automated.');
check('webhook marks schedule failures for reconciliation', webhook.includes("pricing_transition_status: 'reconciliation_required'"), 'Schedule setup failure must be visible to operators.');
check('webhook supports Stripe redelivery safely', webhook.includes("error?.code === '23505'") && webhook.includes(".eq('stripe_invoice_id', invoiceId)"), 'Payment history should be idempotent.');

const conversationMigration = exists(required[9]) ? read(required[9]) : '';
const messageInsertMigration = exists(required[10]) ? read(required[10]) : '';
check('pairwise conversation creation is caller-bound', conversationMigration.includes('Conversation participants must include the authenticated member') && conversationMigration.includes('least(v_self, v_other)'), 'Authenticated member must be a participant and pair ordering must be canonical.');
check('pairwise unread recalculation is own-user only', conversationMigration.includes('You may recalculate only your own unread count'), 'Members must not rewrite another participant unread state.');
check('pairwise message sender/receiver are database-derived', messageInsertMigration.includes('new.sender_id := v_user1') && messageInsertMigration.includes('new.receiver_id := v_user2'), 'Browser sender/receiver identity must not be trusted.');
check('pairwise replies stay in the same conversation', messageInsertMigration.includes('Reply target must be a visible message in the same conversation'), 'Cross-conversation reply references must fail.');

const membershipConfig = exists(required[8]) ? read(required[8]) : '';
check('frontend pricing matches approved launch price', membershipConfig.includes('introMonthly: 1.99') && membershipConfig.includes('introMonths: 6') && membershipConfig.includes('standardMonthly: 5.99'), 'The relaunch UI must not revive retired tier prices.');
check('approved free acquisition loop is encoded', membershipConfig.includes("love_notes: 'free'") && membershipConfig.includes("live_community: 'free'") && membershipConfig.includes("love_language_quiz: 'free'") && membershipConfig.includes("date_ideas: 'free'"), 'Love Notes, core community and selected engagement tools must remain free.');
check('approved premium retention tools are encoded', membershipConfig.includes("relationship_coach: 'membership'") && membershipConfig.includes("relationship_goals: 'membership'") && membershipConfig.includes("couples_calendar: 'membership'") && membershipConfig.includes("shared_journals: 'membership'"), 'Deeper AI/couple/retention tools must map to membership.');
check('unknown entitlement fails closed to membership', membershipConfig.includes("return FEATURE_ENTITLEMENTS[featureName] || 'membership'"), 'Unmapped features must not accidentally become free.');

const subscriptionPage = exists('src/pages/Subscription.jsx') ? read('src/pages/Subscription.jsx') : '';
const selection = exists('src/components/subscriptions/SubscriptionSelection.jsx') ? read('src/components/subscriptions/SubscriptionSelection.jsx') : '';
const profileSubscription = exists('src/components/profile/SubscriptionCard.jsx') ? read('src/components/profile/SubscriptionCard.jsx') : '';
const premiumPage = exists('src/pages/PremiumFeatures.jsx') ? read('src/pages/PremiumFeatures.jsx') : '';
const featureHook = exists('src/hooks/useFeatureAccess.js') ? read('src/hooks/useFeatureAccess.js') : '';
const routeIndex = exists('src/pages/index.jsx') ? read('src/pages/index.jsx') : '';

check('subscription page has no retired dollar prices', !/19\.99|34\.99/.test(subscriptionPage), 'Retired prices remain in Subscription.jsx.');
check('subscription selector has no retired dollar prices', !/19\.99|34\.99/.test(selection), 'Retired prices remain in SubscriptionSelection.jsx.');
check('profile subscription card has no retired tier model', !/19\.99|34\.99|Premiere|Exclusive/.test(profileSubscription), 'Retired profile tier/pricing logic remains.');
check('premium page no longer unlocks paid tools with gamification', !/unlockPoints|unlockLevel|gamification_points/.test(premiumPage) && !/19\.99|34\.99/.test(premiumPage), 'PremiumFeatures must describe account/membership, not points-based unlocks or retired prices.');
check('membership gate uses approved entitlement map', featureHook.includes('getFeatureEntitlement') && featureHook.includes("entitlement === 'free'") && featureHook.includes('ACTIVE_MEMBERSHIP_STATUSES'), 'Feature gate must enforce the approved free/membership boundary.');
check('membership gate remains activation-controlled', featureHook.includes('membershipGatingEnabled') && membershipConfig.includes('VITE_MEMBERSHIP_GATING_ENABLED'), 'Paid gating must remain independently disabled until controlled rollout.');
check('approved premium routes are wired to FeatureGate', routeIndex.includes('FeatureGate') && routeIndex.includes('"relationship_coach"') && routeIndex.includes('"relationship_goals"') && routeIndex.includes('"couples_calendar"') && routeIndex.includes('"shared_journals"'), 'Premium routes must be ready for the single activation flag.');
check('free acquisition routes are not wrapped as premium', routeIndex.includes('["/LoveNotes", LoveNotes]') && routeIndex.includes('["/Community", Community]') && routeIndex.includes('["/LoveLanguageQuiz", LoveLanguageQuiz]') && routeIndex.includes('["/DateIdeas", DateIdeas]'), 'Acquisition loop routes must stay free.');

const paymentSuccess = exists('src/pages/PaymentSuccess.jsx') ? read('src/pages/PaymentSuccess.jsx') : '';
check('payment return URL is not treated as proof', paymentSuccess.includes('getUserSubscription') && paymentSuccess.includes('webhook') && !/setTimeout\([^)]*navigate/.test(paymentSuccess), 'Payment success must be server-state confirmed.');

console.log('\nOne2OneLove relaunch community/billing security check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
