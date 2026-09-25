// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const WRITE_METHODS = new Set(['POST','PUT','PATCH','DELETE']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function bypassPath(url) {
  const path = url.pathname;
  if (path.startsWith('/api/auth/')) return true;
  if (path.startsWith('/api/phone-verification')) return true;
  if (path.startsWith('/api/launch-signup')) return true;
  if (path.startsWith('/api/admin')) return true;
  if (path === '/api/feature-usage') return true;
  if (path === '/api/billing/webhook') return true;
  if (path === '/api/billing/checkout') return true;
  if (path === '/api/billing/trial') return true;
  if (path === '/api/billing/change-plan') return true;
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
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}

export async function accountGuestPreviewStatus(request, env) {
  const auth = await session(request, env);
  if (!auth) return { active:false, auth:null, profile:null };

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(
      `SELECT p.created_at,p.subscription_status,p.stripe_subscription_id,
              COALESCE(p.is_active,true) AS is_active,
              COALESCE(a.banned,false) AS banned
         FROM public.users p
         LEFT JOIN neon_auth."user" a ON a.id=p.id
        WHERE p.id=$1::uuid
        LIMIT 1`,
      [auth.user.id],
    );
    const profile = result.rows[0] || null;
    if (!profile || profile.banned || profile.is_active === false) return { active:false, auth, profile };

    const status = String(profile.subscription_status || '').toLowerCase();
    const paid = Boolean(profile.stripe_subscription_id && ['active','trial','trialing'].includes(status));
    const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : NaN;
    const active = !paid && Number.isFinite(createdAt) && createdAt > 0 && Date.now() < createdAt + 24 * 60 * 60 * 1000;
    return { active, auth, profile };
  } finally {
    await db.end();
  }
}

export async function enforceGuestPreviewReadOnly(request, env, url) {
  if (!url.pathname.startsWith('/api/')) return null;
  if (!WRITE_METHODS.has(request.method.toUpperCase())) return null;
  if (bypassPath(url)) return null;

  const status = await accountGuestPreviewStatus(request, env);
  if (!status.active) return null;

  return json({
    ok: false,
    error: {
      code: 'guest_preview_view_only',
      message: 'Your 24-hour Guest Preview is view-only. Subscribe to use this feature.',
    },
  }, 403);
}
