export const MEMBERSHIP_PRICING = Object.freeze({
  planKey: 'membership',
  pricingVersion: 'launch_2026',
  currency: 'USD',
  introMonthly: 1.99,
  introMonths: 6,
  standardMonthly: 5.99,
});

export const paymentsEnabled = () => import.meta.env.VITE_PAYMENTS_ENABLED === 'true';
export const membershipGatingEnabled = () => import.meta.env.VITE_MEMBERSHIP_GATING_ENABLED === 'true';

export const ACTIVE_MEMBERSHIP_STATUSES = new Set(['trialing', 'active']);

/**
 * Approved relaunch product boundary.
 *
 * `free` means no paid membership is required. Individual pages may still require a
 * confirmed One2OneLove account for privacy/security reasons.
 *
 * `membership` means the feature becomes paid only when
 * VITE_MEMBERSHIP_GATING_ENABLED=true. The gate stays OFF during controlled beta build
 * and Stripe test preparation, so development cannot accidentally lock users out.
 */
export const FEATURE_ENTITLEMENTS = Object.freeze({
  // Acquisition + community foundation
  love_notes: 'free',
  love_note_browse: 'free',
  love_note_send: 'free',
  love_note_reveal: 'free',
  love_note_reply: 'free',
  saved_love_notes: 'free',
  live_community: 'free',
  live_room: 'free',
  member_profile: 'free',
  find_friends: 'free',
  friend_requests: 'free',
  pairwise_text_chat: 'free',
  invite_people: 'free',

  // Selected engagement tools kept free to create habit before asking for payment.
  love_language_quiz: 'free',
  date_ideas: 'free',
  couple_profile: 'free',
  support_library: 'free',

  // Paid retention / AI / couple tools
  relationship_coach: 'membership',
  ai_content_creator: 'membership',
  relationship_goals: 'membership',
  couples_calendar: 'membership',
  shared_journals: 'membership',
  memory_lane: 'membership',
  relationship_milestones: 'membership',
  anniversary_tracker: 'membership',
  couples_dashboard: 'membership',
  couple_activities: 'membership',
  cooperative_games: 'membership',
  communication_practice: 'membership',
  meditation: 'membership',
  advanced_relationship_quizzes: 'membership',
  premium_features: 'membership',
  love_note_scheduling: 'membership',
  love_note_ai_personalization: 'membership',
});

export const FREE_FEATURE_HIGHLIGHTS = Object.freeze([
  '365 Love Notes: browse, write, send, reveal, reply and save',
  'Core Live Community rooms and participation',
  'Love Language Quiz',
  'Date Ideas',
  'Member profile and community discovery',
  'Friend requests and private text chat',
]);

export const MEMBERSHIP_FEATURE_HIGHLIGHTS = Object.freeze([
  'AI Relationship Coach',
  'AI-assisted romantic content creation',
  'Relationship Goals and progress tools',
  'Couples Calendar and milestone planning',
  'Shared Journals and Memory Lane',
  'Couples Dashboard and deeper relationship insights',
  'Couple activities, cooperative games and communication practice',
  'Love Note scheduling and AI personalization',
]);

export const getFeatureEntitlement = (featureName) => {
  if (!featureName) return 'free';
  return FEATURE_ENTITLEMENTS[featureName] || 'membership';
};

export const formatMembershipPrice = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: MEMBERSHIP_PRICING.currency,
    minimumFractionDigits: 2,
  }).format(amount);
