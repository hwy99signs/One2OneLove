// Which member writes need Terms + Disclaimer acceptance (owner, 2026-11-01).
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const SAVE_PREFIXES = [
  '/api/memories', '/api/media/memories/',
  '/api/journals',
  '/api/milestones', '/api/media/milestones/',
  '/api/goals',
  '/api/calendar-events',
  '/api/date-ideas',
];
const SAVE_EXACT = new Set([
  '/api/stories',
  '/api/love-notes/sent',
  '/api/love-notes/send-sms',
  '/api/love-notes/scheduled',
]);

export function isConsentProtectedSave(method, pathname) {
  if (!WRITE_METHODS.has(String(method || '').toUpperCase())) return false;
  const path = String(pathname || '');
  if (SAVE_EXACT.has(path)) return true;
  return SAVE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : prefix + '/'));
}

