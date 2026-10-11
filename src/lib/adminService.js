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

export async function getAdminPresence() {
  return getFreshAdminJson('/api/admin/presence');
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


export async function getGameEconomyAdmin() {
  return getFreshAdminJson('/api/admin/game-economy');
}

export async function grantMemberGameCredit(userId, amountCents, expiryDays, note = '') {
  const response = await fetch('/api/admin/game-credits/grant', {
    method: 'POST',
    credentials: 'include',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ userId, amountCents, expiryDays, note }),
  });
  return parseJson(response);
}

export async function createGamePromotion(promotion) {
  const response = await fetch('/api/admin/game-promotions', {
    method: 'POST',
    credentials: 'include',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(promotion),
  });
  return parseJson(response);
}

export async function deleteGamePromotion(id) {
  const response = await fetch('/api/admin/game-promotions/'+encodeURIComponent(id), {
    method: 'DELETE',
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  return parseJson(response);
}

export async function updateGamePromotion(id, promotion) {
  const response = await fetch('/api/admin/game-promotions/'+encodeURIComponent(id), {
    method: 'PUT',
    credentials: 'include',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(promotion),
  });
  return parseJson(response);
}
