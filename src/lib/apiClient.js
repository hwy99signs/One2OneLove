const JSON_HEADERS = { 'content-type': 'application/json' };

function extractError(payload, fallback) {
  return payload?.error?.message || payload?.message || payload?.error || fallback;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const error = new Error(extractError(payload, `Request failed (${response.status})`));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function getAuthSession() {
  const payload = await apiRequest('/api/auth/get-session');
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  return user && session ? { user, session } : null;
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
    }

    if (attempt < attempts - 1) {
      await wait(delayMs * (attempt + 1));
    }
  }

  // Only accept an unauthorized result after every retry has had a chance to
  // recover. This prevents a single transient Worker/Neon auth response from
  // silently signing an active member out while navigating the app.
  if (lastError?.status === 401) return null;
  if (lastError) throw lastError;
  return null;
}

export async function signInWithEmail(email, password) {
  await apiRequest('/api/auth/sign-in/email', {
    method: 'POST',
    body: { email, password },
  });

  // Let the browser persist the auth cookie before the session check.
  return getAuthSessionWithRetry(4, 200);
}

export async function signOutAuth() {
  try {
    await apiRequest('/api/auth/sign-out', { method: 'POST', body: {} });
  } catch (error) {
    // A missing/expired session should never trap a user in the signed-in UI.
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
