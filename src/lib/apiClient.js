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

export async function getAuthSession() {
  const payload = await apiRequest('/api/auth/get-session');
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  return user?.emailVerified === true && session ? { user, session } : null;
}

export async function getAuthSessionWithRetry(attempts = 3, delayMs = 250) {
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const auth = await getAuthSession();
      if (auth) return auth;
      lastError = null;
    } catch (error) {
      lastError = error;
      if (error?.status === 429 && attempt < attempts - 1) {
        await wait(Math.min(Math.max(error.retryAfterMs || delayMs * 2, 500), 2500));
        continue;
      }
    }

    if (attempt < attempts - 1) {
      await wait(delayMs * (attempt + 1));
    }
  }

  if (lastError?.status === 401) return null;
  if (lastError) throw lastError;
  return null;
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
  // is already being committed. Do not hammer get-session after a successful
  // credential check; that created unnecessary 429s on launch QA.
  if (directUser?.emailVerified === true) {
    return { user: directUser, session: directSession || { pending: true } };
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

export async function getGuestPreviewStatus() {
  const payload = await apiRequest('/api/guest-preview/status');
  return payload?.guestPreview || null;
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
