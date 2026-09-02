export const AUTH_RETURN_KEY = 'o2ol-return-after-auth';

export const safeAuthReturnTo = (value, fallback = null) => {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (/^[\\/]{2}/.test(value)) return fallback;
  return value;
};

export const storeAuthReturnTo = (value, { durable = false } = {}) => {
  if (typeof window === 'undefined') return null;
  const safe = safeAuthReturnTo(value);
  if (!safe) return null;

  try {
    window.sessionStorage.setItem(AUTH_RETURN_KEY, safe);
    if (durable) window.localStorage.setItem(AUTH_RETURN_KEY, safe);
  } catch (error) {
    console.warn('Unable to store auth return destination:', error);
  }
  return safe;
};

export const loadAuthReturnTo = () => {
  if (typeof window === 'undefined') return null;
  try {
    return safeAuthReturnTo(
      window.sessionStorage.getItem(AUTH_RETURN_KEY)
      || window.localStorage.getItem(AUTH_RETURN_KEY)
    );
  } catch {
    return null;
  }
};

export const clearAuthReturnTo = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(AUTH_RETURN_KEY);
    window.localStorage.removeItem(AUTH_RETURN_KEY);
  } catch (error) {
    console.warn('Unable to clear auth return destination:', error);
  }
};

/**
 * Remove one-time Supabase auth material from the visible URL/history after the client
 * has consumed it. Keep only ordinary application query parameters explicitly allowed
 * by the caller. This reduces accidental token/code exposure via copy/paste, screenshots,
 * browser history, crash reports and referrer-like tooling.
 */
export const scrubAuthMaterialFromUrl = ({ keepQuery = [] } = {}) => {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);
    const allowed = new Set(keepQuery);
    const sensitiveQueryKeys = new Set([
      'code',
      'token',
      'token_hash',
      'access_token',
      'refresh_token',
      'provider_token',
      'provider_refresh_token',
      'error',
      'error_code',
      'error_description',
      'type',
    ]);

    for (const key of [...url.searchParams.keys()]) {
      if (!allowed.has(key) && sensitiveQueryKeys.has(key)) url.searchParams.delete(key);
    }

    // Supabase implicit-flow credentials and recovery/confirmation markers live in the
    // fragment. No application route in the relaunch needs to retain that fragment.
    url.hash = '';

    const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', cleanUrl || '/');
  } catch (error) {
    console.warn('Unable to scrub auth material from URL:', error);
  }
};

export const authUserIsConfirmed = (user) =>
  Boolean(user?.email_confirmed_at || user?.confirmed_at);
