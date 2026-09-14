async function parseJson(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Unable to load the admin dashboard.');
    error.status = response.status;
    error.code = payload?.error?.code || 'admin_request_failed';
    throw error;
  }
  return payload;
}

export async function getAdminDashboard() {
  const response = await fetch('/api/admin/dashboard', {
    method: 'GET',
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  return parseJson(response);
}

export async function getAdminAnalytics() {
  const response = await fetch('/api/admin/analytics', {
    method: 'GET',
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  return parseJson(response);
}
