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
