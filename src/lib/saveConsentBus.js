// Bridge between apiRequest and the Terms + Disclaimer dialog (owner, 2026-11-01).
// No imports here, so apiClient can use it without a circular dependency.
export const SAVE_CONSENT_VERSION = '2026-11-01-terms-disclaimer-v1';
let handler = null;
let pending = null;

export function registerSaveConsentHandler(fn) {
  handler = typeof fn === 'function' ? fn : null;
  return () => { if (handler === fn) handler = null; };
}

// Resolves true once the member accepts, false if they decline or no dialog is mounted.
export function requestSaveConsent() {
  if (!handler) return Promise.resolve(false);
  if (!pending) pending = Promise.resolve(handler()).then(Boolean).catch(() => false).finally(() => { pending = null; });
  return pending;
}
