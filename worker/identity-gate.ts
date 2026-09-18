// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

let phoneRequirementCache = { value: false, expiresAt: 0 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function isPublicIdentityRoute(request, url) {
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (!path.startsWith('/api/')) return true;
  if (path === '/api/health') return true;
  if (path.startsWith('/api/auth/')) return true;
  if (path.startsWith('/api/launch-signup')) return true;
  if (path === '/api/professional-signup') return true;
  if (path === '/api/billing/webhook') return true;
  if (path === '/api/engagement/waitlist') return true;

  if (method === 'GET' && path === '/api/reviews') return true;
  if (method === 'GET' && path.startsWith('/api/stories')) return true;
  if (method === 'GET' && (path === '/api/contests/leaderboard' || path === '/api/contests/winner')) return true;
  if (method === 'GET' && (path === '/api/engagement/contests/leaderboard' || path === '/api/engagement/contests/winner')) return true;

  return false;
}

async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && active ? { user, session: active } : null;
}

async function phoneVerificationRequired(env) {
  const now = Date.now();
  if (phoneRequirementCache.expiresAt > now) return phoneRequirementCache.value;

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(
      `SELECT COALESCE((plugin_configs->'phoneNumber'->>'enabled')::boolean,false) AS enabled
         FROM neon_auth.project_config
        WHERE name='One2OneLove'
        LIMIT 1`,
    );
    const value = result.rows[0]?.enabled === true;
    phoneRequirementCache = { value, expiresAt: now + 60_000 };
    return value;
  } finally {
    await db.end();
  }
}

export async function enforceLaunchIdentity(request, env, url) {
  if (isPublicIdentityRoute(request, url)) return null;

  const auth = await session(request, env);
  if (!auth) return null;

  if (auth.user.emailVerified !== true) {
    return json({
      ok: false,
      error: { code: 'email_verification_required', message: 'Email verification is required.' },
    }, 401);
  }

  const requirePhone = await phoneVerificationRequired(env);
  if (requirePhone && auth.user.phoneNumberVerified !== true) {
    return json({
      ok: false,
      error: { code: 'phone_verification_required', message: 'Phone verification is required.' },
    }, 428);
  }

  return null;
}
