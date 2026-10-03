const VISITOR_KEY = 'o2ol.analytics.visitor';
const SESSION_KEY = 'o2ol.analytics.session';
const ADMIN_PATHS = new Set(['/admin','/analytics','/adminaccess']);

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

function send(payload) {
  if (isAdminAnalyticsSurface()) return;
  const body = {
    visitorId: visitorId(),
    sessionId: sessionId(),
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
    const href = control instanceof HTMLAnchorElement ? control.href : control.getAttribute('href');
    const sameSiteDestination = href ? normalizedPath(href) : null;
    const externalDestination = href && !sameSiteDestination ? (() => {
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
