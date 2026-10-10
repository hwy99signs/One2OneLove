// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

// These API areas require a verified member identity, but NOT a recurring
// subscription/tier. Paid actions are authorized and charged by their own
// Credit handlers (games, AI, Love Notes, Studio, etc.).
const MEMBER_ONLY_PREFIXES = [
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

function memberIdentityRequired(pathname) {
  if (pathname === '/api/engagement/waitlist') return false;
  if (pathname === '/api/engagement/contests/leaderboard' || pathname === '/api/engagement/contests/winner') return false;
  return MEMBER_ONLY_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export function requiresApiEntitlement(pathname) {
  // Compatibility name retained because identity-gate.ts imports it.
  // "Entitlement" now means member identity only; recurring tiers are retired.
  return memberIdentityRequired(pathname);
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

export async function enforceApiEntitlement(request, env, url) {
  // Open House community-chat reads are public; writes are checked by the
  // community-chat handler. Do not impose any paid membership requirement.
  if (url.pathname.startsWith('/api/community-chat')) return null;

  if (!memberIdentityRequired(url.pathname)) return null;

  const auth = await authSession(request, env);
  if (!auth) {
    return json({ ok: false, error: { code: 'unauthorized', message: 'Verified member sign-in is required.' } }, 401);
  }

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(
      `SELECT u.role,COALESCE(u.banned,false) AS banned,
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

    // No recurring membership/tier check belongs here. Feature-level paid
    // access is enforced by the Credit engine in the destination handler.
    return null;
  } finally {
    await db.end();
  }
}
