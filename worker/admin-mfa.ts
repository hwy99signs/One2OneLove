// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const COOKIE_NAME = '__Host-o2ol_admin_mfa';
const MFA_TTL_SECONDS = 12 * 60 * 60;

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
  const endpoint = env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { cookie, accept: 'application/json' },
    });
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      const user = payload?.user ?? payload?.data?.user ?? null;
      const active = payload?.session ?? payload?.data?.session ?? null;
      return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
    }
    if (![429,500,502,503,504].includes(response.status) || attempt === 2) return null;
    await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
  }
  return null;
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

async function createMfaToken(auth, env) {
  const expiresAt = Math.floor(Date.now() / 1000) + MFA_TTL_SECONDS;
  const payload = base64UrlText(JSON.stringify({
    v: 2,
    uid: auth.user.id,
    exp: expiresAt,
  }));
  const signature = await sign(payload, env);
  return { token: `${payload}.${signature}`, expiresAt };
}

async function readSignedMfaPayload(request, env) {
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
  if (payload?.v !== 2 || !payload?.uid) return null;
  if (!Number.isFinite(payload?.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function readMfaToken(request, env, auth) {
  const persistent = await readPersistentMfaToken(request, env);
  if (persistent?.payload?.uid === auth.user.id) return persistent.payload;

  const payload = await readSignedMfaPayload(request, env);
  if (!payload || payload.uid !== auth.user.id) return null;
  return payload;
}

export async function getVerifiedAdminMfaIdentity(request, env) {
  const persistent = await readPersistentMfaToken(request, env);
  if (persistent) return persistent;

  // Temporary compatibility for Admin sessions issued before the persistent
  // database-backed token rollout. A successful touch converts these to v3.
  const payload = await readSignedMfaPayload(request, env);
  if (!payload) return null;
  const admin = await adminIdentity(env, payload.uid);
  if (!admin) return null;
  return { admin, payload };
}

function mfaCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${MFA_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

function clearMfaCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}


// Lazy-ensure DDL tolerance (2026-10-08): on the preview database the
// connecting role does not own the pre-existing tables, so an ensure DDL
// statement against an object that is already in shape can fail with 42501
// (must be owner). The full DDL set is pre-applied by the table owner via
// preview-schema-preapply.sql; here, skip ONLY the benign already-in-shape
// codes (42501 insufficient_privilege, 42701 duplicate_column, 42P07
// duplicate_table) per statement and continue. Any other error still throws,
// and the DML that follows surfaces a genuinely missing object loudly.
const TOLERATED_DDL_CODES = new Set(['42501', '42701', '42P07']);
async function ensureDdl(db, sql) {
  try { await db.query(sql); }
  catch (err) { if (!TOLERATED_DDL_CODES.has(err?.code)) throw err; }
}

async function ensureAdminMfaSessionTable(env) {
  return withDb(env, async (db) => {
    await ensureDdl(db, `
      CREATE TABLE IF NOT EXISTS public.admin_mfa_sessions (
        token_hash text PRIMARY KEY,
        admin_user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        last_seen_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await ensureDdl(db, `CREATE INDEX IF NOT EXISTS idx_admin_mfa_sessions_user_expiry ON public.admin_mfa_sessions(admin_user_id,expires_at)`);
    await db.query(`DELETE FROM public.admin_mfa_sessions WHERE expires_at <= now()`);
  });
}

function randomOpaqueToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlFromBytes(bytes);
}

async function sha256Text(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return base64UrlFromBytes(new Uint8Array(digest));
}

async function createPersistentMfaToken(auth, env) {
  await ensureAdminMfaSessionTable(env);
  const raw = randomOpaqueToken();
  const hash = await sha256Text(raw);
  const expiresAt = Math.floor(Date.now() / 1000) + MFA_TTL_SECONDS;
  await withDb(env, async (db) => {
    await db.query(
      `INSERT INTO public.admin_mfa_sessions(token_hash,admin_user_id,expires_at,last_seen_at)
       VALUES($1,$2::uuid,to_timestamp($3),now())`,
      [hash, auth.user.id, expiresAt],
    );
  });
  return { token: `db.${raw}`, expiresAt };
}

async function readPersistentMfaToken(request, env) {
  const token = cookieValue(request, COOKIE_NAME);
  if (!token || !token.startsWith('db.')) return null;
  const raw = token.slice(3);
  if (!raw) return null;
  await ensureAdminMfaSessionTable(env);
  const hash = await sha256Text(raw);
  return withDb(env, async (db) => {
    const result = await db.query(
      `UPDATE public.admin_mfa_sessions s
          SET last_seen_at=now()
         FROM neon_auth."user" u
        WHERE s.token_hash=$1
          AND s.admin_user_id=u.id
          AND s.expires_at>now()
          AND u.role='admin'
          AND COALESCE(u.banned,false)=false
        RETURNING s.admin_user_id,s.expires_at,u.email,u.name,u.role,COALESCE(u.banned,false) AS banned`,
      [hash],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      admin: { id:row.admin_user_id,email:row.email,name:row.name,role:row.role,banned:row.banned },
      payload: { v:3, uid:row.admin_user_id, exp:Math.floor(new Date(row.expires_at).getTime()/1000) },
    };
  });
}

async function revokePersistentMfaToken(request, env) {
  const token = cookieValue(request, COOKIE_NAME);
  if (!token || !token.startsWith('db.')) return;
  const raw = token.slice(3);
  if (!raw) return;
  const hash = await sha256Text(raw);
  await ensureAdminMfaSessionTable(env);
  await withDb(env, async (db) => {
    await db.query('DELETE FROM public.admin_mfa_sessions WHERE token_hash=$1', [hash]);
  });
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
  if (auth) {
    const admin = await adminIdentity(env, auth.user.id);
    if (!admin) return { response: fail('Administrator access required.', 403, 'forbidden') };
    const token = await readMfaToken(request, env, auth);
    return { auth, admin, verified: Boolean(token), expiresAt: token?.exp || null };
  }

  // A valid signed, HttpOnly Admin MFA cookie remains authoritative for the
  // 12-hour Admin session even if Better Auth briefly returns a transient 401
  // during a refresh. This prevents random dashboard logouts without weakening
  // the Admin boundary: the token is signed, host-only, Secure, SameSite=Strict,
  // time-limited, and its UID must still belong to an active admin in the DB.
  const fallback = await getVerifiedAdminMfaIdentity(request, env);
  if (fallback) {
    return {
      auth: { user: fallback.admin, session: { adminMfaFallback: true } },
      admin: fallback.admin,
      verified: true,
      expiresAt: fallback.payload.exp,
      fallback: true,
    };
  }

  return { response: fail('Authentication required.', 401, 'unauthorized') };
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
    await revokePersistentMfaToken(request, env).catch(() => undefined);
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
      sessionTtlSeconds: MFA_TTL_SECONDS,
      email: maskedEmail(admin.email),
    });
  }

  if (url.pathname === '/api/admin/mfa/touch' && request.method === 'POST') {
    if (!status.verified) return fail('Administrator verification required.', 428, 'mfa_required');
    const issued = await createPersistentMfaToken(auth, env);
    return json({
      ok: true,
      verified: true,
      expiresAt: issued.expiresAt,
      sessionTtlSeconds: MFA_TTL_SECONDS,
    }, 200, { 'set-cookie': mfaCookie(issued.token) });
  }

  if (url.pathname === '/api/admin/mfa/request' && request.method === 'POST') {
    if (status.verified) {
      return json({
        ok: true,
        sent: false,
        alreadyVerified: true,
        expiresAt: status.expiresAt,
        sessionTtlSeconds: MFA_TTL_SECONDS,
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

    const issued = await createPersistentMfaToken(auth, env);
    return json({
      ok: true,
      verified: true,
      expiresAt: issued.expiresAt,
      sessionTtlSeconds: MFA_TTL_SECONDS,
      email: maskedEmail(admin.email),
    }, 200, { 'set-cookie': mfaCookie(issued.token) });
  }

  return fail('Admin MFA route not found.', 404, 'not_found');
}
