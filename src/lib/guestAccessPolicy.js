// One2OneLove guest-access policy (owner decision, 2026-11-25).
//
// The whole platform is free and open: no signup, no card, no Credit.
// Guests can use every remaining feature — personal features run in
// browser-local guest mode, and Chat Rooms / Communities accept guest
// participation with a display name. The per-use-cost features (AI, SMS)
// were retired rather than gated. Only the admin area stays behind its
// own sign-in + MFA, which is enforced separately (AdminMfaGate / worker
// admin gates), never by this policy.
//
// The historical exports keep their names so existing imports keep
// working; the route set is retained for reference, but the check itself
// now answers "open" for every non-admin route.

// Master switch, retained for emergencies. While true (the permanent
// state), every non-admin route is guest-open.
export const GUEST_BROWSE_ENABLED = true;

// Historical list of routes that were guest-open under the 2026-11-01
// policy. Kept for reference; access no longer depends on membership in
// this set.
export const GUEST_OPEN_ROUTES = new Set([
  '/', '/home', '/catalog', '/featurepricing', '/pricing', '/premiumfeatures',
  '/cooperativegames', '/games', '/pests', '/poolpingpong', '/scrabluko', '/ithoughtso',
  '/scratchgame', '/likeminded', '/whatshouldtheydo', '/whatshouldtheydoglobalpreview', '/leaderboard',
  '/o2olstudio', '/o2olstudio/episodes', '/onair', '/podcasts', '/podcast', '/podcastssupport',
  '/articlessupport', '/blog', '/lgbtqsupport', '/couplesupport', '/counselingsupport',
  '/influencerssupport', '/meditation', '/coupleactivities', '/communicationpractice',
  '/dateideas', '/lovenotes',
  '/lovelanguagequiz', '/relationshipquizzes',
]);

export function normalizeRoute(pathname) {
  return String(pathname || '/').split(/[?#]/)[0].toLowerCase().replace(/\/$/, '') || '/';
}

export function isGuestOpenRoute(pathname) {
  if (!GUEST_BROWSE_ENABLED) return false;
  const route = normalizeRoute(pathname);
  if (route === '/admin' || route.startsWith('/admin/') || route === '/adminaccess') return false;
  return true;
}

// Feature-level check used by pages that render inside an open route.
export function isGuestBrowseEnabled() {
  return GUEST_BROWSE_ENABLED;
}
