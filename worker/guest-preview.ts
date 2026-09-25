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
  if (path === '/api/guest-preview/status') return true;
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

async function ensurePreviewTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.guest_preview_sessions (
      user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
      started_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function accountGuestPreviewStatus(request, env, { startIfEligible = true } = {}) {
  const auth = await session(request, env);
  if (!auth) return { active:false, auth:null, profile:null, startedAt:null, expiresAt:null };

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    await ensurePreviewTable(db);

    const result = await db.query(
      `SELECT p.subscription_status,p.stripe_subscription_id,
              COALESCE(p.is_active,true) AS is_active,
              COALESCE(a.banned,false) AS banned
         FROM public.users p
         LEFT JOIN neon_auth."user" a ON a.id=p.id
        WHERE p.id=$1::uuid
        LIMIT 1`,
      [auth.user.id],
    );
    const profile = result.rows[0] || null;
    if (!profile || profile.banned || profile.is_active === false) {
      return { active:false, auth, profile, startedAt:null, expiresAt:null };
    }

    const subscriptionStatus = String(profile.subscription_status || '').toLowerCase();
    const paid = Boolean(profile.stripe_subscription_id && ['active','trial','trialing'].includes(subscriptionStatus));
    if (paid) return { active:false, auth, profile, startedAt:null, expiresAt:null };

    if (startIfEligible) {
      await db.query(
        `INSERT INTO public.guest_preview_sessions(user_id)
         VALUES($1::uuid)
         ON CONFLICT (user_id) DO NOTHING`,
        [auth.user.id],
      );
    }

    const previewResult = await db.query(
      `SELECT started_at,expires_at,(expires_at > now()) AS active
         FROM public.guest_preview_sessions
        WHERE user_id=$1::uuid
        LIMIT 1`,
      [auth.user.id],
    );
    const preview = previewResult.rows[0] || null;
    return {
      active: preview?.active === true,
      auth,
      profile,
      startedAt: preview?.started_at || null,
      expiresAt: preview?.expires_at || null,
    };
  } finally {
    await db.end();
  }
}

export async function handleGuestPreviewStatusRequest(request, env, url) {
  if (url.pathname !== '/api/guest-preview/status') return null;
  if (request.method !== 'GET') return json({ ok:false, error:{ code:'method_not_allowed', message:'Method not allowed.' } }, 405);

  const status = await accountGuestPreviewStatus(request, env, { startIfEligible:true });
  if (!status.auth) return json({ ok:false, error:{ code:'unauthorized', message:'Sign in required.' } }, 401);

  return json({
    ok:true,
    guestPreview:{
      active:status.active,
      startedAt:status.startedAt,
      expiresAt:status.expiresAt,
      mode:'view_only',
    },
  });
}

export async function enforceGuestPreviewReadOnly(request, env, url) {
  if (!url.pathname.startsWith('/api/')) return null;
  if (!WRITE_METHODS.has(request.method.toUpperCase())) return null;
  if (bypassPath(url)) return null;

  const status = await accountGuestPreviewStatus(request, env, { startIfEligible:true });
  if (!status.active) return null;

  return json({
    ok: false,
    error: {
      code: 'guest_preview_view_only',
      message: 'Your 24-hour Guest Preview is view-only. Subscribe to use this feature.',
    },
  }, 403);
}
