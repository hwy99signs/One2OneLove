const VISITOR_KEY = 'o2ol.analytics.visitor';
const SESSION_KEY = 'o2ol.analytics.session';
const SOURCE_KEY = 'o2ol.analytics.source';
const QUEUE_KEY = 'o2ol.analytics.queue';
const QUEUE_MAX = 50;
const QUEUE_TTL_MS = 24 * 60 * 60 * 1000;
const ADMIN_PATHS = new Set(['/admin','/analytics','/adminaccess','/developer']);
const SUPPORTED_LANGUAGES = new Set(['en','es','fr','it','de']);

const FEATURE_BY_ROUTE = {
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
  '/mymatchiq/meet': 'MyMatchIQ',
  '/mymatchiq/assessment': 'MyMatchIQ',
  '/mymatchiq/passport': 'MyMatchIQ',
  '/mymatchiq/bianca': 'MyMatchIQ',
  '/mymatchiq/credits': 'MyMatchIQ',
  '/mymatchiq/actions': 'MyMatchIQ',
  '/mymatchiq/dashboard': 'MyMatchIQ',
  '/mymatchiq/invite': 'MyMatchIQ',
  '/mymatchiq/subscription': 'MyMatchIQ',
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

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'anon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 14);
}

function storageId(storage, key) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const value = randomId();
    storage.setItem(key, value);
    return value;
  } catch {
    return randomId();
  }
}

function visitorId() {
  return storageId(window.localStorage, VISITOR_KEY);
}

function sessionId() {
  return storageId(window.sessionStorage, SESSION_KEY);
}

export function getAnalyticsVisitorId() {
  if (typeof window === 'undefined') return null;
  return visitorId();
}

function safeText(value, max = 160) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max) || null;
}

function normalizedPath(value) {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname || '/';
  } catch {
    return null;
  }
}

export function isAdminAnalyticsSurface(pathname = window.location.pathname) {
  const clean = String(pathname || '').toLowerCase().replace(/\/$/, '') || '/';
  return ADMIN_PATHS.has(clean) || clean.startsWith('/admin/');
}

export function featureForPath(pathname) {
  const clean = String(pathname || '').toLowerCase().replace(/\/$/, '') || '/';
  if (FEATURE_BY_ROUTE[clean]) return FEATURE_BY_ROUTE[clean];
  if (clean.startsWith('/mymatchiq/')) return 'MyMatchIQ';
  return null;
}

function activeLanguage() {
  try {
    const language = String(window.localStorage.getItem('preferredLanguage') || 'en').toLowerCase();
    return SUPPORTED_LANGUAGES.has(language) ? language : 'en';
  } catch {
    return 'en';
  }
}

const TRAFFIC_SOURCES = new Set(['facebook','instagram','threads','tiktok','x','youtube','linkedin','pinterest','direct','other']);

function canonicalTrafficSource(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (['facebook','fb','meta'].includes(raw)) return 'facebook';
  if (['instagram','ig'].includes(raw)) return 'instagram';
  if (raw === 'threads') return 'threads';
  if (raw === 'tiktok' || raw === 'tik_tok') return 'tiktok';
  if (['x','twitter'].includes(raw)) return 'x';
  if (['youtube','yt'].includes(raw)) return 'youtube';
  if (raw === 'linkedin') return 'linkedin';
  if (['pinterest','pin'].includes(raw)) return 'pinterest';
  if (TRAFFIC_SOURCES.has(raw)) return raw;
  return 'other';
}

function sourceFromReferrer() {
  try {
    if (!document.referrer) return 'direct';
    const ref = new URL(document.referrer);
    if (ref.origin === window.location.origin) return 'direct';
    const host = ref.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'facebook';
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
    if (host === 'threads.net' || host.endsWith('.threads.net')) return 'threads';
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
    if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com') || host === 't.co') return 'x';
    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube';
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com') || host === 'lnkd.in') return 'linkedin';
    if (host === 'pinterest.com' || host.endsWith('.pinterest.com') || host === 'pin.it') return 'pinterest';
    return 'other';
  } catch {
    return 'other';
  }
}

function trafficSource() {
  try {
    const existing = window.sessionStorage.getItem(SOURCE_KEY);
    if (existing && TRAFFIC_SOURCES.has(existing)) return existing;
    const params = new URLSearchParams(window.location.search || '');
    const source = canonicalTrafficSource(params.get('utm_source')) || sourceFromReferrer();
    window.sessionStorage.setItem(SOURCE_KEY, source);
    return source;
  } catch {
    return sourceFromReferrer();
  }
}

// Delivery with a durable retry queue. Analytics used to be fire-and-forget:
// when the ingest endpoint was unreachable (e.g. the 2026-10-07 database
// outage), every event in that window was lost permanently. Failed sends now
// persist in localStorage (bounded, 24h TTL) and flush on install, when the
// browser comes back online, and when the tab becomes visible again. Only
// transient failures are queued (network errors, 429, 5xx) — a 4xx means the
// event itself is invalid and retrying it would never succeed.
function loadQueue() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - QUEUE_TTL_MS;
    return parsed.filter((item) => item && item.body && Number(item.t) > cutoff);
  } catch {
    return [];
  }
}

function saveQueue(items) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-QUEUE_MAX)));
  } catch {}
}

function enqueue(body) {
  const items = loadQueue();
  items.push({ t: Date.now(), body });
  saveQueue(items);
}

let flushingQueue = false;

function deliver(body, requeueOnFailure) {
  fetch('/api/interaction-events', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((response) => {
    if (!response.ok && (response.status === 429 || response.status >= 500) && requeueOnFailure) {
      enqueue(body);
    }
  }).catch(() => {
    if (requeueOnFailure) enqueue(body);
  });
}

function flushQueue() {
  if (flushingQueue || typeof window === 'undefined') return;
  const items = loadQueue();
  if (!items.length) return;
  flushingQueue = true;
  saveQueue([]);
  for (const item of items) deliver(item.body, true);
  flushingQueue = false;
}

function send(payload) {
  if (isAdminAnalyticsSurface()) return;
  const body = {
    visitorId: visitorId(),
    sessionId: sessionId(),
    language: activeLanguage(),
    trafficSource: trafficSource(),
    ...payload,
  };

  deliver(body, true);
}

// Human-readable name for a route with no feature mapping, e.g.
// '/signin' -> 'Signin', '/' -> 'Home'. Mirrors worker/click-labels.js.
export function prettifyRoute(pathname) {
  const clean = String(pathname || '').toLowerCase().replace(/\/$/, '') || '/';
  if (clean === '/') return 'Home';
  const last = clean.split('/').filter(Boolean).pop() || '';
  const words = last.replace(/[-_]+/g, ' ').trim();
  if (!words) return 'Home';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const CONTROL_TYPE_NAMES = {
  a: 'link', button: 'button', summary: 'expander', label: 'label',
  input: 'input', select: 'dropdown', textarea: 'text field',
};

export function controlTypeName(controlType) {
  const base = String(controlType || '').toLowerCase().split(':')[0].split('[')[0].trim();
  return CONTROL_TYPE_NAMES[base] || base || 'control';
}

// Derive a usable name for a clicked control, in priority order:
// (a) explicit analytics id, (b) visible text (or the value of a submit /
// button input, or the alt of an image inside the control), (c) aria-label /
// title / name / id, (d) a destination-derived name, (e) a route +
// control-type fallback ("Community Chat — button"). A click always has a
// route, so this ALWAYS returns a name — a click can no longer be recorded
// nameless. Pure: the DOM handler builds the descriptor; tests reuse this.
export function deriveClickControlKey(descriptor = {}) {
  const {
    analyticsId, text, imageAlt, ariaLabel, title, name, id,
    destination, route, controlType,
  } = descriptor;
  const destinationName = destination
    ? (featureForPath(destination) || prettifyRoute(destination))
    : null;
  const candidates = [
    safeText(analyticsId),
    safeText(text),
    safeText(imageAlt),
    safeText(ariaLabel),
    safeText(title),
    safeText(name),
    safeText(id),
    destinationName,
  ];
  for (const candidate of candidates) {
    if (candidate) return candidate;
  }
  const place = featureForPath(route) || prettifyRoute(route);
  return safeText(`${place} — ${controlTypeName(controlType)}`, 160);
}

export function trackPageView(pathname) {
  if (isAdminAnalyticsSurface(pathname)) return;
  const route = normalizedPath(pathname) || String(pathname || '/').slice(0, 300);
  send({
    eventType: 'page_view',
    route,
    feature: featureForPath(route),
  });
}

export function trackFeatureActionEvent(feature, detail) {
  if (isAdminAnalyticsSurface()) return;
  const safeFeature = safeText(feature, 100);
  const actionKey = safeText(detail, 160);
  if (!safeFeature || !actionKey) return;
  const route = normalizedPath(window.location.pathname) || '/';
  send({
    eventType: 'action',
    route,
    feature: safeFeature,
    controlType: 'feature_action',
    controlKey: actionKey,
  });
}

export function installClickAnalytics() {
  if (typeof document === 'undefined' || document.documentElement.dataset.o2olClickAnalytics === 'on') return;
  document.documentElement.dataset.o2olClickAnalytics = 'on';

  flushQueue();
  window.addEventListener('online', flushQueue);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flushQueue();
  });

  document.addEventListener('click', (event) => {
    if (isAdminAnalyticsSurface()) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    let control = target.closest('a,button,[role="button"],[role="link"],input[type="button"],input[type="submit"],summary,label,[data-analytics-id],[tabindex]');
    if (!control) {
      let node = target;
      for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
        try {
          if (window.getComputedStyle(node).cursor === 'pointer') {
            control = node;
            break;
          }
        } catch {}
      }
    }
    if (!control) return;

    const currentRoute = window.location.pathname || '/';
    const explicitDestination = safeText(control.getAttribute('data-analytics-destination'), 300);
    const href = control instanceof HTMLAnchorElement ? control.href : control.getAttribute('href');
    const sameSiteDestination = explicitDestination
      ? normalizedPath(explicitDestination)
      : (href ? normalizedPath(href) : null);
    const externalDestination = !explicitDestination && href && !sameSiteDestination ? (() => {
      try { return new URL(href, window.location.origin).hostname; } catch { return null; }
    })() : null;

    // Label derivation (see deriveClickControlKey). Privacy guard: visible
    // text is read ONLY from the clicked control itself, and never when the
    // control wraps a form field (composers, journal editors, inputs) — so
    // typed user content can never become a "label". Input values, messages
    // and query strings are never read.
    const tagName = control.tagName?.toLowerCase() || '';
    const isButtonInput = control instanceof HTMLInputElement
      && ['submit', 'button', 'reset'].includes(control.type);
    const wrapsFormField = !isButtonInput
      && typeof control.querySelector === 'function'
      && !!control.querySelector('input,textarea,select');
    const visibleText = isButtonInput
      ? safeText(control.value)
      : (wrapsFormField ? null : safeText(control.innerText || control.textContent));
    const imageAlt = wrapsFormField
      ? null
      : safeText(control.querySelector?.('img[alt]')?.getAttribute('alt'));
    const role = safeText(control.getAttribute('role'), 40);
    const controlType = role
      || (tagName === 'input' ? `input:${control.getAttribute('type') || 'text'}` : tagName);

    const controlKey = deriveClickControlKey({
      analyticsId: control.getAttribute('data-analytics-id'),
      text: visibleText,
      imageAlt,
      ariaLabel: control.getAttribute('aria-label'),
      title: control.getAttribute('title'),
      name: control.getAttribute('name'),
      id: control.id,
      destination: sameSiteDestination,
      route: currentRoute,
      controlType,
    });

    send({
      eventType: 'click',
      route: currentRoute,
      feature: featureForPath(sameSiteDestination || currentRoute),
      controlType: safeText(controlType, 40),
      controlKey,
      destination: sameSiteDestination || (externalDestination ? 'external:' + externalDestination : null),
    });
  }, true);
}

let presenceInstalled = false;

// Real-time presence heartbeat (owner-approved 2026-10-09): while a public
// page is open it checks in every ~45 seconds so the Admin dashboard can
// count people who are on the site right now — including quiet readers,
// whom click-based activity windows miss. Admin surfaces never check in.
export function installPresenceHeartbeat() {
  if (typeof window === 'undefined' || presenceInstalled) return;
  presenceInstalled = true;
  const ping = () => {
    try {
      if (isAdminAnalyticsSurface(window.location.pathname)) return;
      fetch('/api/presence/ping', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId: visitorId(), route: normalizedPath(window.location.href) }),
      }).catch(() => {});
    } catch {}
  };
  ping();
  window.setInterval(ping, 45000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ping();
  });
}
