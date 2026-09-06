const CONFIGURED_API_BASE = import.meta.env.VITE_O2OL_API_URL || '';

export const ONE2ONE_API_BASE = CONFIGURED_API_BASE.replace(/\/$/, '');

async function parseResponse(response) {
  const type = response.headers.get('content-type') || '';
  let payload = null;
  if (type.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    payload = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.code = payload?.error?.code || null;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('content-type') && typeof options.body !== 'string') {
    headers.set('content-type', 'application/json');
  }

  const body = options.body && typeof options.body !== 'string'
    ? JSON.stringify(options.body)
    : options.body;

  const response = await fetch(`${ONE2ONE_API_BASE}${path}`, {
    ...options,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export const authApi = {
  async getSession() {
    return apiRequest('/api/auth/get-session', { method: 'GET' });
  },
  async signIn(email, password) {
    return apiRequest('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email, password },
    });
  },
  async signUp(email, password, name) {
    return apiRequest('/api/auth/sign-up/email', {
      method: 'POST',
      body: { email, password, name },
    });
  },
  async signOut() {
    return apiRequest('/api/auth/sign-out', { method: 'POST', body: {} });
  },
  async requestPasswordReset(email, redirectTo) {
    return apiRequest('/api/auth/request-password-reset', {
      method: 'POST',
      body: { email, redirectTo },
    });
  },
};

export const profileApi = {
  async get() {
    const data = await apiRequest('/api/profile');
    return data?.profile || null;
  },
  async update(updates) {
    const data = await apiRequest('/api/profile', { method: 'PATCH', body: updates });
    return data?.profile || null;
  },
};

export const specialistProfileApi = {
  async get(type) {
    const data = await apiRequest(`/api/profiles/${type}`);
    return data?.profile || null;
  },
  async save(type, payload) {
    const data = await apiRequest(`/api/onboarding/${type}`, { method: 'POST', body: payload });
    return data?.profile || null;
  },
  async update(type, payload) {
    const data = await apiRequest(`/api/profiles/${type}`, { method: 'PATCH', body: payload });
    return data?.profile || null;
  },
};

export const loveNotesApi = {
  async listSent() {
    const data = await apiRequest('/api/love-notes/sent');
    return data?.notes || [];
  },
  async recordSent(payload) {
    const data = await apiRequest('/api/love-notes/sent', { method: 'POST', body: payload });
    return data?.note || null;
  },
  async listScheduled() {
    const data = await apiRequest('/api/love-notes/scheduled');
    return data?.notes || [];
  },
  async schedule(payload) {
    const data = await apiRequest('/api/love-notes/scheduled', { method: 'POST', body: payload });
    return data?.note || null;
  },
  async cancelScheduled(id) {
    const data = await apiRequest(`/api/love-notes/scheduled/${id}/cancel`, { method: 'PATCH', body: {} });
    return data?.note || null;
  },
};

export const one2OneLogoUrl = `${ONE2ONE_API_BASE}/api/assets/brand/logo`;
