// Click-label completeness for interaction analytics.
//
// Every recorded click must reach the admin dashboard with a usable name.
// The client (src/lib/interactionAnalytics.js) derives a label at capture
// time; this module is the SERVER-SIDE backstop used at ingest so that even
// an old or minimal client can never create a nameless row. Derivation only
// ever uses facts stored with the event itself (destination, route,
// control type) — it never guesses what a specific control said.
//
// FEATURE_BY_ROUTE mirrors src/lib/interactionAnalytics.js FEATURE_BY_ROUTE.
// Keep the two maps in sync when routes are added.

export const FEATURE_BY_ROUTE = {
  '/': 'Home',
  '/home': 'Home',
  '/aboutus': 'About Us',
  '/signin': 'Sign In',
  '/login': 'Sign In',
  '/signup': 'Sign Up',
  '/forgotpassword': 'Forgot Password',
  '/helpcenter': 'Help Center',
  '/contactus': 'Contact Us',
  '/privacypolicy': 'Privacy Policy',
  '/termsofservice': 'Terms of Service',
  '/tiktokpost': 'TikTok Post',
  '/credit': 'Credit Wallet',
  '/memorylane': 'Memory Lane',
  '/lovenotes': 'Love Notes',
  '/sendcredits': 'Love Notes',
  '/couplesupport': 'Relationship Support',
  '/lovelanguagequiz': 'Love Language Quiz',
  '/dateideas': 'Date Ideas',
  '/profile': 'Member Profile',
  '/invite': 'Invite & Share',
  '/podcastssupport': 'Podcasts',
  '/articlessupport': 'Articles',
  '/relationshipquizzes': 'Relationship Quizzes',
  '/anniversarytracker': 'Anniversary Tracker',
  '/dashboard': 'Member Profile',
  '/community': 'Community Chat',
  '/relationshipmilestones': 'Relationship Milestones',
  '/relationshipgoals': 'Relationship Goals',
  '/communicationpractice': 'Communication Practice',
  '/couplesprofile': 'Couples Profile',
  '/coupleactivities': 'Couple Activities',
  '/cooperativegames': 'Relationship Games',
  '/whatshouldtheydo': 'What Should They Do?',
  '/games': 'What Should They Do?',
  '/scratchgame': 'Scratch Game',
  '/likeminded': 'Like Minded?',
  '/sharedjournals': 'Shared Journals',
  '/couplesdashboard': 'Couples Dashboard',
  '/couplescalendar': 'Couples Calendar',
  '/lgbtqsupport': 'LGBTQ+ Support',
  '/chat': 'Community Chat',
  '/subscription': 'Subscription / Billing',
  '/paymentsuccess': 'Subscription / Billing',
  '/payment-success': 'Subscription / Billing',
  '/verifyphone': 'Account Verification',
  '/reviews': 'Reviews',
  '/leavereview': 'Reviews',
  '/suggestions': 'Suggestions',
  '/professionals': 'Professionals',
  '/professionalsignup': 'Professional Onboarding',
  '/therapistsignup': 'Professional Onboarding',
  '/influencersignup': 'Professional Onboarding',
  '/o2olstudio': 'O2OL Studio',
  '/mymatchiq': 'MyMatchIQ',
  '/winacruise': 'Win A Cruise',
  '/counselingsupport': 'Relationship Support',
  '/influencerssupport': 'Professionals',
  '/aicontentcreator': 'AI Content Creator',
  '/relationshipcoach': 'Relationship Coach',
  '/meditation': 'Relationship Support',
  '/leaderboard': 'Gamification',
  '/achievements': 'Gamification',
  '/premiumfeatures': 'Subscription / Billing',
  '/findfriends': 'Find Friends',
  '/friendrequests': 'Find Friends',
  '/blog': 'Articles',
};

function cleanText(value, max = 160) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
}

function cleanRoutePath(value) {
  const text = String(value || '').split('?')[0].split('#')[0].trim();
  if (!text.startsWith('/')) return null;
  return (text.toLowerCase().replace(/\/$/, '') || '/');
}

export function featureForRoutePath(pathname) {
  const clean = cleanRoutePath(pathname);
  if (!clean) return null;
  if (FEATURE_BY_ROUTE[clean]) return FEATURE_BY_ROUTE[clean];
  if (clean.startsWith('/mymatchiq/')) return 'MyMatchIQ';
  return null;
}

// Human-readable name for a route that has no feature mapping, e.g.
// '/signin' -> 'Signin', '/verifyphone' -> 'Verifyphone', '/' -> 'Home'.
export function prettifyRoute(pathname) {
  const clean = cleanRoutePath(pathname);
  if (!clean || clean === '/') return 'Home';
  const last = clean.split('/').filter(Boolean).pop() || '';
  const words = last.replace(/[-_]+/g, ' ').trim();
  if (!words) return 'Home';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const CONTROL_TYPE_NAMES = {
  a: 'link',
  button: 'button',
  summary: 'expander',
  label: 'label',
  input: 'input',
  select: 'dropdown',
  textarea: 'text field',
};

export function controlTypeName(controlType) {
  const raw = String(controlType || '').toLowerCase();
  const base = raw.split(':')[0].split('[')[0].trim();
  return CONTROL_TYPE_NAMES[base] || base || 'control';
}

// Name for a destination the click leads to, from stored facts only:
// an internal path maps to its feature (or a prettified path name);
// 'external:<host>' (the stored form for off-site links) names the host.
export function destinationName(destination) {
  const text = cleanText(destination, 300);
  if (!text) return null;
  if (text.startsWith('external:')) {
    const host = text.slice('external:'.length).trim();
    return host ? `External — ${host}` : null;
  }
  return featureForRoutePath(text) || prettifyRoute(text);
}

// Priority: (d) destination-derived name, then (e) route + control-type
// fallback ("Community Chat — button"). A click always has a route (ingest
// rejects events without one), so this ALWAYS returns a name.
export function deriveClickControlKey({ controlKey, destination, route, controlType } = {}) {
  const existing = cleanText(controlKey, 160);
  if (existing) return existing;
  const fromDestination = destinationName(destination);
  if (fromDestination) return fromDestination;
  const place = featureForRoutePath(route) || prettifyRoute(route);
  return cleanText(`${place} — ${controlTypeName(controlType)}`, 160);
}

// Feature backstop: a click's feature from its destination first, then the
// page it happened on. Returns a candidate display name (or null); the
// caller validates it against TRACKABLE_FEATURES before storing.
export function deriveClickFeature({ feature, destination, route } = {}) {
  const existing = cleanText(feature, 100);
  if (existing) return existing;
  if (destination && !String(destination).startsWith('external:')) {
    const fromDestination = featureForRoutePath(destination);
    if (fromDestination) return fromDestination;
  }
  return featureForRoutePath(route);
}

// ---------------------------------------------------------------------------
// Click identity (owner rule, 2026-10-10): a signed-in member's clicks carry
// their username; "Anonymous" is only for true guests. These helpers are
// pure so ingest, the client tracker mirror, and the tests all share one
// definition of who an event belongs to.

// A username is only ever copied from a real account record or from the
// signed-in member's own client payload — never derived or invented. The
// shape mirrors the signup rule in worker/launch-auth.ts (3–40 chars).
export function cleanAnalyticsUsername(value) {
  const text = String(value || '').trim().replace(/^@+/, '');
  return /^[A-Za-z0-9._-]{3,40}$/.test(text) ? text : null;
}

// Password-visibility toggles are pure local UI state: they navigate
// nowhere, submit nothing, and change no data, so they are not engagement
// clicks. They are identified by label pattern across the site's five
// languages: a show/hide verb together with the word for "password".
// Mirrors src/lib/interactionAnalytics.js — keep the two in sync.
const PASSWORD_WORDS = ['password', 'contraseña', 'contrasena', 'mot de passe', 'passwort'];
const SHOW_HIDE_VERBS = ['show', 'hide', 'mostrar', 'ocultar', 'afficher', 'masquer', 'mostra', 'nascondi', 'anzeigen', 'ausblenden', 'verbergen'];

export function isPasswordVisibilityLabel(label) {
  const text = String(label || '').trim().toLowerCase();
  if (!text) return false;
  return PASSWORD_WORDS.some((word) => text.includes(word))
    && SHOW_HIDE_VERBS.some((verb) => text.includes(verb));
}

// Decide whose event this is. Identity is accepted from exactly two
// server-verified sources:
//   - sessionRow: the caller's own auth session, resolved server-side.
//   - claimedRow: a database row for the member id the client claimed,
//     accepted ONLY when linkVerified — public.visitor_identity_links ties
//     this event's visitor id to that account (written at signup, or at an
//     earlier verified sign-in on this same browser).
// An unverified claim is ignored entirely: the event stays anonymous.
// Admins are dropped (drop: true) on either path, exactly as before —
// admin activity never enters visitor analytics.
// Rows are { userId, role, username }; userId may be null on a session row
// whose account record is missing (role still applies for the admin drop).
export function resolveClickIdentity({ sessionRow = null, claimedRow = null, linkVerified = false, claimedUserId = null, claimedUsername = null } = {}) {
  const anonymous = { drop: false, userId: null, actorType: 'anonymous', username: null };
  const row = sessionRow?.userId
    ? sessionRow
    : (linkVerified && claimedRow?.userId ? claimedRow : null);
  const isAdmin = [sessionRow?.role, row?.role]
    .some((role) => String(role || '').toLowerCase() === 'admin');
  if (isAdmin) return { drop: true, userId: null, actorType: 'anonymous', username: null };
  if (!row) return anonymous;
  // The client-sent username is trusted only for the very account the
  // server verified (the claimed id must be the resolved account's own
  // id) and only when the account record itself has no username stored.
  const claimedName = claimedUserId && claimedUserId === row.userId
    ? cleanAnalyticsUsername(claimedUsername)
    : null;
  return {
    drop: false,
    userId: row.userId,
    actorType: 'registered',
    username: cleanAnalyticsUsername(row.username) || claimedName,
  };
}

// Admin "Recent Click Details" AUDIENCE cell: a member's events show their
// username; a member event without a stored username shows "Member";
// only an event with no member identity at all shows "Anonymous".
// Mirrors src/lib/interactionAnalytics.js — keep the two in sync.
export function clickAudienceLabel(row = {}) {
  const username = cleanAnalyticsUsername(row.username);
  if (username) return `@${username}`;
  if (row.user_id || row.userId || row.actor_type === 'registered' || row.actorType === 'registered') return 'Member';
  return 'Anonymous';
}
