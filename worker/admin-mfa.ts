// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const COOKIE_NAME = '__Host-o2ol_admin_mfa';
const MFA_TTL_SECONDS = 5 * 60;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

async function getSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    method: 'GET',
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && active ? { user, session: active } : null;
}

async function adminIdentity(env, userId) {
  return withDb(env, async (db) => {
    const result = await db.query(
      `SELECT id,email,name,role,COALESCE(banned,false) AS banned
         FROM neon_auth."user"
        WHERE id=$1::uuid`,
      [userId],
    );
    const row = result.rows[0] || null;
    return row && row.role === 'admin' && !row.banned ? row : null;
  });
}

function cookieValue(request, name) {
  const cookie = request.headers.get('cookie') || '';
  for (const piece of cookie.split(';')) {
    const index = piece.indexOf('=');
    if (index < 0) continue;
    const key = piece.slice(0, index).trim();
    if (key === name) return piece.slice(index + 1).trim();
  }
  return null;
}

function base64UrlFromBytes(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function bytesFromBase64Url(value) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, ch => ch.charCodeAt(0));
  } catch {
    return null;
  }
}

function base64UrlText(text) {
  return base64UrlFromBytes(new TextEncoder().encode(text));
}

function textFromBase64Url(value) {
  const bytes = bytesFromBase64Url(value);
  if (!bytes) return null;
  try { return new TextDecoder().decode(bytes); } catch { return null; }
}

async function hmacKey(env) {
  const material = env?.HYPERDRIVE?.connectionString;
  if (!material) throw new Error('Admin MFA signing material is unavailable.');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(material),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(value, env) {
  const key = await hmacKey(env);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`o2ol-admin-mfa:v1:${value}`),
  );
  return base64UrlFromBytes(new Uint8Array(signature));
}

function sessionKey(auth) {
  return String(auth?.session?.id || auth?.session?.token || '');
}

async function createMfaToken(auth, env) {
  const expiresAt = Math.floor(Date.now() / 1000) + MFA_TTL_SECONDS;
  const payload = base64UrlText(JSON.stringify({
    v: 1,
    uid: auth.user.id,
    sid: sessionKey(auth),
    exp: expiresAt,
  }));
  const signature = await sign(payload, env);
  return { token: `${payload}.${signature}`, expiresAt };
}

async function readMfaToken(request, env, auth) {
  const token = cookieValue(request, COOKIE_NAME);
  if (!token) return null;
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  const expected = await sign(payloadPart, env);
  const actualBytes = bytesFromBase64Url(signaturePart);
  const expectedBytes = bytesFromBase64Url(expected);
  if (!actualBytes || !expectedBytes || actualBytes.length !== expectedBytes.length) return null;
  let mismatch = 0;
  for (let i = 0; i < actualBytes.length; i += 1) mismatch |= actualBytes[i] ^ expectedBytes[i];
  if (mismatch !== 0) return null;

  const decoded = textFromBase64Url(payloadPart);
  if (!decoded) return null;
  let payload;
  try { payload = JSON.parse(decoded); } catch { return null; }
  if (payload?.v !== 1 || payload?.uid !== auth.user.id || payload?.sid !== sessionKey(auth)) return null;
  if (!Number.isFinite(payload?.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function mfaCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${MFA_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

function clearMfaCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function maskedEmail(email) {
  const [local = '', domain = ''] = String(email || '').split('@');
  if (!domain) return 'your admin email';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

async function betterAuthOtp(request, env, path, body) {
  const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' });
  const cookie = request.headers.get('cookie');
  const origin = request.headers.get('origin');
  if (cookie) headers.set('cookie', cookie);
  if (origin) headers.set('origin', origin);
  return fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

export async function adminMfaStatus(request, env) {
  const auth = await getSession(request, env);
  if (!auth) return { response: fail('Authentication required.', 401, 'unauthorized') };
  const admin = await adminIdentity(env, auth.user.id);
  if (!admin) return { response: fail('Administrator access required.', 403, 'forbidden') };
  const token = await readMfaToken(request, env, auth);
  return { auth, admin, verified: Boolean(token), expiresAt: token?.exp || null };
}

export async function enforceAdminMfa(request, env) {
  const status = await adminMfaStatus(request, env);
  if (status.response) return status.response;
  if (!status.verified) {
    return fail('Administrator verification required.', 428, 'mfa_required');
  }
  return null;
}

export async function handleAdminMfaRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/admin/mfa')) return null;

  if (url.pathname === '/api/admin/mfa/end' && request.method === 'POST') {
    return json({ ok: true, verified: false, reason: 'idle_timeout' }, 200, { 'set-cookie': clearMfaCookie() });
  }

  const status = await adminMfaStatus(request, env);
  if (status.response) return status.response;
  const { auth, admin } = status;

  if (url.pathname === '/api/admin/mfa/status' && request.method === 'GET') {
    return json({
      ok: true,
      verified: status.verified,
      expiresAt: status.expiresAt,
      idleTimeoutSeconds: MFA_TTL_SECONDS,
      email: maskedEmail(admin.email),
    });
  }

  if (url.pathname === '/api/admin/mfa/touch' && request.method === 'POST') {
    if (!status.verified) return fail('Administrator verification required.', 428, 'mfa_required');
    const issued = await createMfaToken(auth, env);
    return json({
      ok: true,
      verified: true,
      expiresAt: issued.expiresAt,
      idleTimeoutSeconds: MFA_TTL_SECONDS,
    }, 200, { 'set-cookie': mfaCookie(issued.token) });
  }

  if (url.pathname === '/api/admin/mfa/request' && request.method === 'POST') {
    if (status.verified) {
      return json({
        ok: true,
        sent: false,
        alreadyVerified: true,
        expiresAt: status.expiresAt,
        idleTimeoutSeconds: MFA_TTL_SECONDS,
        email: maskedEmail(admin.email),
      });
    }
    const upstream = await betterAuthOtp(request, env, '/email-otp/send-verification-otp', {
      email: admin.email,
      type: 'sign-in',
    });
    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => null);
      return fail(payload?.message || payload?.error?.message || 'Unable to send the administrator verification code.', upstream.status || 502, 'mfa_send_failed');
    }
    return json({ ok: true, sent: true, email: maskedEmail(admin.email) });
  }

  if (url.pathname === '/api/admin/mfa/verify' && request.method === 'POST') {
    const payload = await request.json().catch(() => null);
    const otp = String(payload?.otp || '').trim();
    if (!/^\d{6}$/.test(otp)) return fail('Enter the 6-digit verification code.', 400, 'invalid_otp');

    const upstream = await betterAuthOtp(request, env, '/email-otp/check-verification-otp', {
      email: admin.email,
      type: 'sign-in',
      otp,
    });
    if (!upstream.ok) {
      const result = await upstream.json().catch(() => null);
      return fail(result?.message || result?.error?.message || 'The verification code is invalid or expired.', 400, 'invalid_otp');
    }

    const issued = await createMfaToken(auth, env);
    return json({
      ok: true,
      verified: true,
      expiresAt: issued.expiresAt,
      idleTimeoutSeconds: MFA_TTL_SECONDS,
      email: maskedEmail(admin.email),
    }, 200, { 'set-cookie': mfaCookie(issued.token) });
  }

  return fail('Admin MFA route not found.', 404, 'not_found');
}
