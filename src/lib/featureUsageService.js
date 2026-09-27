export function trackFeatureAction(feature, detail) {
  const route = String(detail || '').trim().slice(0, 300);
  if (!feature || !route) return Promise.resolve();
  return fetch('/api/feature-usage', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ feature, eventType: 'action', route }),
  }).then(() => undefined).catch(() => undefined);
}
