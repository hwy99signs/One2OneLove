const JSON_HEADERS = { 'content-type': 'application/json' };

function extractError(payload, fallback) {
  return payload?.error?.message || payload?.message || payload?.error || fallback;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response) {
  const raw = response.headers.get('retry-after');
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now());
  return null;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, rawBody, ...rest } = options;
  const requestHeaders = new Headers(headers);
  let requestBody = rawBody;

  if (body !== undefined) {
    requestHeaders.set('content-type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: requestHeaders,
    body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : requestBody,
    ...rest,
  });

  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else if (response.status !== 204) {
    payload = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const fallback = response.status === 429
      ? 'Too many sign-in requests were sent too quickly. Please wait a moment and try again.'
      : `Request failed (${response.status})`;
    const error = new Error(extractError(payload, fallback));
    error.status = response.status;
    error.payload = payload;
    error.retryAfterMs = retryAfterMs(response);
    throw error;
  }

  return payload;
}

// Fire-and-forget JSON POST that survives page teardown (tab close, app
// switch, navigation away). Used for "leave" signals that must still be
// delivered while the page is being destroyed, where a normal fetch would
// be aborted. Prefers navigator.sendBeacon; falls back to a keepalive
// fetch. Same-origin, so the session cookie rides along either way.
// Returns true when a delivery channel accepted the payload.
export function beaconJson(path, body = {}) {
  const payload = JSON.stringify(body);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(path, blob)) return true;
    }
  } catch {
    // sendBeacon unavailable or rejected — fall through to keepalive fetch.
  }
  try {
    fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      credentials: 'include',
      keepalive: true,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export async function getAuthSession() {
  const payload = await apiRequest('/api/auth/get-session');
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  return user?.emailVerified === true && session ? { user, session } : null;
}

// Tri-state session read (2026-10-12 phantom-logout repair).
// 'authenticated' — the checker answered with a live session.
// 'signed_out'    — the checker ANSWERED: a completed empty read or a
//                   401. Only this state may sign a member out.
// 'unknown'       — the checker could not answer (429 rate limit,
//                   5xx, network). Unknown must NEVER sign a member
//                   out: during the 2026-10-12 rate-limit storms the
//                   old binary read turned "too busy" into "logged
//                   out" on every tab return and reload.
export async function getAuthSessionState(attempts = 3, delayMs = 250) {
  let lastError = null;
  let definitive = false;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const auth = await getAuthSession();
      if (auth) return { state: 'authenticated', auth };
      // A completed read with no session is the server speaking
      // clearly. Remember it, but keep retrying briefly: upstream
      // session hydration can race and answer empty for a moment.
      definitive = true;
      lastError = null;
    } catch (error) {
      lastError = error;
      if (error?.status === 401) definitive = true;
      if (error?.status === 429 && attempt < attempts - 1) {
        await wait(Math.min(Math.max(error.retryAfterMs || delayMs * 2, 500), 2500));
        continue;
      }
    }

    if (attempt < attempts - 1) {
      await wait(delayMs * (attempt + 1));
    }
  }

  if (definitive) return { state: 'signed_out' };
  return { state: 'unknown', error: lastError };
}

export async function getAuthSessionWithRetry(attempts = 3, delayMs = 250) {
  const result = await getAuthSessionState(attempts, delayMs);
  if (result.state === 'authenticated') return result.auth;
  if (result.state === 'signed_out') return null;
  throw result.error || Object.assign(new Error('Session check is temporarily unavailable.'), { status: 429 });
}

export async function signInWithEmail(email, password) {
  let payload;
  try {
    payload = await apiRequest('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: String(email || '').trim(), password },
    });
  } catch (error) {
    // A prior accepted sign-in can establish the cookie just before the provider
    // rate-limits a repeated click. Recover that valid session instead of showing
    // a false login failure.
    if (error?.status === 429) {
      await wait(Math.min(Math.max(error.retryAfterMs || 750, 500), 2000));
      const existing = await getAuthSessionWithRetry(2, 750).catch(() => null);
      if (existing) return existing;
    }
    throw error;
  }

  const directUser = payload?.user ?? payload?.data?.user ?? null;
  const directSession = payload?.session ?? payload?.data?.session ?? null;

  // Better Auth commonly returns the verified user immediately while the cookie
  // is already being committed. When the response carries no session of its
  // own, confirm the login against the cookie ONCE before declaring it
  // durable (2026-10-12): a sign-in that exists only in page state is a
  // logout waiting for the next tab switch. If the confirmation read is
  // merely inconclusive (rate limit, network), accept the credential
  // result — the session state machine now preserves through unknowns.
  if (directUser?.emailVerified === true) {
    if (directSession) return { user: directUser, session: directSession };
    const confirmed = await getAuthSessionWithRetry(2, 400).catch(() => undefined);
    if (confirmed?.user) return confirmed;
    if (confirmed === null) {
      throw new Error('Your sign-in could not be completed. Please try again.');
    }
    return { user: directUser, session: { pending: true } };
  }

  // Unverified accounts intentionally receive no usable session. One short
  // session check distinguishes that case from a slow cookie commit.
  await wait(250);
  return getAuthSessionWithRetry(2, 500);
}

export async function signOutAuth() {
  try {
    await apiRequest('/api/auth/sign-out', { method: 'POST', body: {} });
  } catch (error) {
    if (error.status !== 401) throw error;
  }
  return true;
}

export async function sendEmailVerificationOtp(email) {
  return apiRequest('/api/auth/email-otp/send-verification-otp', {
    method: 'POST',
    body: { email, type: 'email-verification' },
  });
}

export async function verifyEmailOtp(email, otp) {
  return apiRequest('/api/auth/email-otp/verify-email', {
    method: 'POST',
    body: { email, otp },
  });
}

export async function requestPasswordReset(email, redirectTo) {
  return apiRequest('/api/auth/request-password-reset', {
    method: 'POST',
    body: { email, redirectTo },
  });
}

export async function resetPassword(newPassword, token) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: { newPassword, token },
  });
}

export async function getProfile() {
  const payload = await apiRequest('/api/profile');
  return payload?.profile || null;
}

export async function updateProfile(fields) {
  const payload = await apiRequest('/api/profile', {
    method: 'PATCH',
    body: fields,
  });
  return payload?.profile || null;
}

export function readableApiError(error, fallback = 'Something went wrong. Please try again.') {
  return error?.message || fallback;
}
