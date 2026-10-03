// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const PREMIERE_PREFIXES = [
  '/api/games/scratch',
  '/api/love-notes',
  '/api/community-chat',
  '/api/chat',
  '/api/communities',
  '/api/presence',
  '/api/buddies',
  '/api/date-ideas',
  '/api/memories',
  '/api/media/memories/',
  '/api/profile/photo',
  '/api/media/profile/',
  '/api/engagement',
  '/api/ai',
  '/api/milestones',
  '/api/media/milestones/',
  '/api/journals',
  '/api/calendar-events',
  '/api/goals',
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function requiredPlan(pathname) {
  if (pathname === '/api/engagement/waitlist') return null;
  if (pathname === '/api/engagement/contests/leaderboard' || pathname === '/api/engagement/contests/winner') return null;
  if (pathname.startsWith('/api/ai/content')) return 'Exclusive';
  if (PREMIERE_PREFIXES.some(prefix => pathname.startsWith(prefix))) return 'Premiere';
  return null;
}

export function requiresApiEntitlement(pathname) {
  return requiredPlan(pathname) !== null;
}

function planLevel(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'exclusive') return 2;
  if (raw === 'premier' || raw === 'premiere') return 1;
  return 0;
}

async function authSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  if (!user?.id || user?.emailVerified !== true || !session) return null;
  return { user, session };
}

function adminAccessActive(row) {
  if (!row?.subscription_end_date) return false;
  const end = new Date(row.subscription_end_date);
  return !Number.isNaN(end.getTime()) && end.getTime() > Date.now();
}

export async function enforceApiEntitlement(request, env, url) {
  const required = requiredPlan(url.pathname);
  if (!required) return null;

  const auth = await authSession(request, env);
  if (!auth) {
    return json({ ok: false, error: { code: 'unauthorized', message: 'Verified member sign-in is required.' } }, 401);
  }

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(
      `SELECT u.role,COALESCE(u.banned,false) AS banned,
              p.subscription_plan,p.subscription_status,p.subscription_end_date,p.stripe_subscription_id,
              COALESCE((to_jsonb(p)->>'phone_number_verified')::boolean,false) AS phone_number_verified
         FROM neon_auth."user" u
         LEFT JOIN public.users p ON p.id=u.id
        WHERE u.id=$1::uuid`,
      [auth.user.id],
    );
    const row = result.rows[0] || null;
    if (!row || row.banned) {
      return json({ ok: false, error: { code: 'forbidden', message: 'Account access is unavailable.' } }, 403);
    }

    const phoneVerificationRequired = Boolean(
      env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_VERIFY_SERVICE_SID
    );
    if (phoneVerificationRequired && row.phone_number_verified !== true) {
      return json({ ok: false, error: { code: 'phone_verification_required', message: 'Phone verification is required.' } }, 428);
    }

    if (row.role === 'admin') return null;

    const status = String(row.subscription_status || '').toLowerCase();
    const adminAccess = adminAccessActive(row);
    const active = ['active', 'trial', 'trialing'].includes(status);

    if (!active || (!row.stripe_subscription_id && !adminAccess)) {
      return json({ ok: false, error: { code: 'billing_required', message: 'An active One2OneLove membership is required to use this protected feature. Open House browsing remains free.' } }, 402);
    }

    // Stripe trial/trialing represents the 30-day Founding Member free period.
    // Access always follows the stored plan for the member's Founding cohort.
    const effectiveLevel = planLevel(row.subscription_plan);

    if (effectiveLevel < planLevel(required)) {
      return json({ ok: false, error: { code: 'plan_upgrade_required', message: `${required} membership or higher is required.` } }, 403);
    }

    return null;
  } finally {
    await db.end();
  }
}
