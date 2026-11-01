// One2OneLove launch guest-access policy (owner decision, 2026-11-01).
//
// Rule: anything a visitor can try once, that stores nothing personal, costs
// nothing and is worth sharing stays open WITHOUT an account. Anything that
// saves personal data, involves other people, costs money (AI, SMS, Credit)
// or needs an inviter's personal link requires a free account.
//
// This replaces the temporary preview-hostname-only switch. The same rules
// apply on the preview and on one2onelove.com so the preview shows exactly
// what launches. Server APIs remain the authority for every protected action.

// Master switch. Set to false to return to the 2026-10-11 "site locked behind
// sign-up" behavior everywhere without touching individual pages.
export const GUEST_BROWSE_ENABLED = true;

// Free without signup: games, What Should They Do? voting, Studio videos,
// podcasts, articles/support reading, quizzes (short result), browsing Date
// Ideas and Love Note templates, invite landing pages, homepage and catalog.
export const GUEST_OPEN_ROUTES = new Set([
  '/', '/home', '/catalog', '/featurepricing', '/pricing', '/premiumfeatures',
  // Games (all permanently free)
  '/cooperativegames', '/games', '/pests', '/poolpingpong', '/scrabluko', '/ithoughtso',
  '/scratchgame', '/likeminded', '/whatshouldtheydo', '/whatshouldtheydoglobalpreview', '/leaderboard',
  // Watch and listen (Studio and podcasts are free forever)
  '/o2olstudio', '/o2olstudio/episodes', '/onair', '/podcasts', '/podcast', '/podcastssupport',
  // Read and learn
  '/articlessupport', '/blog', '/lgbtqsupport', '/couplesupport', '/counselingsupport',
  '/influencerssupport', '/meditation', '/coupleactivities', '/communicationpractice',
  // Browse (saving, sending and custom items require an account)
  '/dateideas', '/lovenotes',
  // Quizzes: take it and see a short result; full saved reports need an account
  '/lovelanguagequiz', '/relationshipquizzes',
]);

export function normalizeRoute(pathname) {
  return String(pathname || '/').split(/[?#]/)[0].toLowerCase().replace(/\/$/, '') || '/';
}

export function isGuestOpenRoute(pathname) {
  if (!GUEST_BROWSE_ENABLED) return false;
  const route = normalizeRoute(pathname);
  return GUEST_OPEN_ROUTES.has(route) || route.startsWith('/i/');
}

// Feature-level check used by pages that render inside an open route.
export function isGuestBrowseEnabled() {
  return GUEST_BROWSE_ENABLED;
}
