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
 * Entitlement says whether a feature is free or paid once released. It does NOT mean an
 * older prototype is launch-ready. Route/readiness gates separately keep staged features
 * unavailable until their privacy/data/real-functionality review is complete.
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
  support_library: 'free',

  // Reviewed relaunch paid foundation.
  relationship_coach: 'membership',
  ai_content_creator: 'membership',
  relationship_goals: 'membership',

  // Paid roadmap entitlements. These remain staged even for members until their own
  // relaunch review is complete.
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
  'Member profile and privacy-safe community discovery',
  'Accepted member connections and private text chat',
]);

// These are the reviewed premium capabilities intended to form the first relaunch
// membership release after billing/AI/data activation is tested.
export const MEMBERSHIP_FEATURE_HIGHLIGHTS = Object.freeze([
  'AI Relationship Coach',
  'AI Content Creator for romantic messages and ideas',
  'Relationship Goals and progress tracking',
]);

// Roadmap only: paid entitlement has been decided, but product availability has not.
export const STAGED_MEMBERSHIP_FEATURE_HIGHLIGHTS = Object.freeze([
  'Couples Calendar, milestones and anniversary tools',
  'Shared Journals and Memory Lane',
  'Couples Dashboard and deeper relationship insights',
  'Couple activities, cooperative games and communication practice',
  'Meditation and advanced relationship quizzes',
  'Love Note scheduling and AI personalization',
]);

export const getFeatureEntitlement = (featureName) => {
  if (!featureName) return 'free';
  return FEATURE_ENTITLEMENTS[featureName] || 'membership';
};

export const formatMembershipPrice = (amount, locale = 'en-US') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: MEMBERSHIP_PRICING.currency,
    minimumFractionDigits: 2,
  }).format(amount);