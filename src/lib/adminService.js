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

async function getFreshAdminJson(path) {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${path}${separator}_adminFresh=${Date.now()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'cache-control': 'no-cache',
    },
  });
  return parseJson(response);
}

export async function getAdminDashboard(registryRange) {
  const query = registryRange ? `?registryRange=${encodeURIComponent(registryRange)}` : '';
  return getFreshAdminJson(`/api/admin/dashboard${query}`);
}

export async function getAdminAnalytics() {
  return getFreshAdminJson('/api/admin/analytics');
}


export async function manageMemberAccount(memberId, action, reason = '') {
  const response = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}/${encodeURIComponent(action)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return parseJson(response);
}


export async function manageMemberAccountsBulk(memberIds, action, reason = '') {
  const response = await fetch('/api/admin/members/bulk', {
    method: 'POST',
    credentials: 'include',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ memberIds, action, reason }),
  });
  return parseJson(response);
}


export async function grantMemberAccessTime(memberId, unit, amount = 1) {
  const response = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}/access`, {
    method: 'POST',
    credentials: 'include',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ unit, amount }),
  });
  return parseJson(response);
}


export async function changeMemberTier(memberId, plan) {
  const response = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}/tier`, {
    method: 'POST',
    credentials: 'include',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  return parseJson(response);
}
