const VISITOR_KEY = 'o2ol.analytics.visitor';
const SESSION_KEY = 'o2ol.analytics.session';
const SOURCE_KEY = 'o2ol.analytics.source';
const ADMIN_PATHS = new Set(['/admin','/analytics','/adminaccess']);
const SUPPORTED_LANGUAGES = new Set(['en','es','fr','it','de']);

const FEATURE_BY_ROUTE = {
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

function send(payload) {
  if (isAdminAnalyticsSurface()) return;
  const body = {
    visitorId: visitorId(),
    sessionId: sessionId(),
    language: activeLanguage(),
    trafficSource: trafficSource(),
    ...payload,
  };

  fetch('/api/interaction-events', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
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

    // Deliberately do not read textContent, input values, form fields, messages,
    // or query strings. Only stable control metadata is recorded.
    const controlKey =
      safeText(control.getAttribute('data-analytics-id')) ||
      safeText(control.getAttribute('aria-label')) ||
      safeText(control.getAttribute('title')) ||
      safeText(control.getAttribute('name')) ||
      safeText(control.id);

    send({
      eventType: 'click',
      route: currentRoute,
      feature: featureForPath(sameSiteDestination || currentRoute),
      controlType: safeText(control.tagName?.toLowerCase(), 40),
      controlKey,
      destination: sameSiteDestination || (externalDestination ? 'external:' + externalDestination : null),
    });
  }, true);
}
