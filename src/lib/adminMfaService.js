async function parse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Administrator verification failed.');
    error.status = response.status;
    error.code = payload?.error?.code || 'admin_mfa_failed';
    throw error;
  }
  return payload;
}

export async function getAdminMfaStatus() {
  return parse(await fetch('/api/admin/mfa/status', {
    credentials: 'include',
    headers: { accept: 'application/json' },
  }));
}

export async function requestAdminMfaCode() {
  return parse(await fetch('/api/admin/mfa/request', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({}),
  }));
}

export async function verifyAdminMfaCode(otp) {
  return parse(await fetch('/api/admin/mfa/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ otp }),
  }));
}

export async function touchAdminMfa() {
  return parse(await fetch('/api/admin/mfa/touch', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({}),
  }));
}

export async function endAdminMfa() {
  return parse(await fetch('/api/admin/mfa/end', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({}),
  }));
}
