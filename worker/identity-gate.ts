// @ts-nocheck
import { Client } from 'pg';
import { requiresApiEntitlement } from './api-entitlements';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

let phoneSchemaCache = { value: false, expiresAt: 0 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function isPublicIdentityRoute(request, url) {
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (!path.startsWith('/api/')) return true;
  if (path === '/api/health') return true;
  if (path.startsWith('/api/assets/')) return true;
  if (method === 'GET' && path === '/api/profile') return true;
  if (path.startsWith('/api/auth/')) return true;
  if (path.startsWith('/api/phone-verification')) return true;
  if (path.startsWith('/api/launch-signup')) return true;
  if (path === '/api/professional-signup') return true;
  if (path.startsWith('/api/suggestions')) return true;
  if (path === '/api/billing/webhook') return true;
  if (path === '/api/engagement/waitlist') return true;

  if (method === 'GET' && path === '/api/reviews') return true;
  if (method === 'GET' && path.startsWith('/api/stories')) return true;
  if (method === 'GET' && (path === '/api/contests/leaderboard' || path === '/api/contests/winner')) return true;
  if (method === 'GET' && (path === '/api/engagement/contests/leaderboard' || path === '/api/engagement/contests/winner')) return true;

  return false;
}

function phoneProviderConfigured(env) {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
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

async function phoneSchemaReady(env) {
  const now = Date.now();
  if (phoneSchemaCache.expiresAt > now) return phoneSchemaCache.value;

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='phone_number'
        )
        AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='phone_number_verified'
        ) AS ready
    `);
    const value = result.rows[0]?.ready === true;
    phoneSchemaCache = { value, expiresAt: now + 60_000 };
    return value;
  } finally {
    await db.end();
  }
}

async function userPhoneVerified(env, userId) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(
      `SELECT COALESCE((to_jsonb(u)->>'phone_number_verified')::boolean,false) AS verified
         FROM public.users u
        WHERE id=$1::uuid
        LIMIT 1`,
      [userId],
    );
    return result.rows[0]?.verified === true;
  } finally {
    await db.end();
  }
}

export async function enforceLaunchIdentity(request, env, url) {
  if (isPublicIdentityRoute(request, url) || requiresApiEntitlement(url.pathname)) return null;

  if (!phoneProviderConfigured(env)) return null;

  if (!(await phoneSchemaReady(env))) {
    return json({
      ok: false,
      error: { code: 'phone_verification_not_ready', message: 'Phone verification is not ready.' },
    }, 503);
  }

  const auth = await session(request, env);
  if (!auth) return null;

  if (auth.user.emailVerified !== true) {
    return json({
      ok: false,
      error: { code: 'email_verification_required', message: 'Email verification is required.' },
    }, 401);
  }

  if (!(await userPhoneVerified(env, auth.user.id))) {
    return json({
      ok: false,
      error: { code: 'phone_verification_required', message: 'Phone verification is required.' },
    }, 428);
  }

  return null;
}
