// @ts-nocheck
import { Client } from 'pg';
import { isO2OLPromoFreeFeature } from '../src/lib/o2olFreePromo2026';

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

// One-time Credit purchases must be enforced at the API as well as in the
// page's PaidFeatureGate. The Credit purchase endpoint records content_key
// 'feature' for each of these five protected feature groups.
const CONTENT_UNLOCK_PREFIXES = [
  ['/api/media/memories/', 'memories_unlock'],
  ['/api/memories', 'memories_unlock'],
  ['/api/milestones', 'milestones_unlock'],
  ['/api/media/milestones/', 'milestones_unlock'],
  ['/api/journals', 'journals_unlock'],
  ['/api/calendar-events', 'calendar_unlock'],
  ['/api/goals', 'goals_unlock'],
];

function contentUnlockFeature(pathname) {
  for (const [prefix, featureCode] of CONTENT_UNLOCK_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/')) {
      return featureCode;
    }
  }
  return null;
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

  // Communities (2026-11-25): public communities are guest-participation
  // areas now — the communities handler enforces its own per-route rules
  // (member-only creation/membership; guest posts/comments/likes in
  // public communities), so the gate does not pre-empt it.
  if (url.pathname.startsWith('/api/communities')) return null;

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

    // Phone verification retired 2026-11-25: no feature requires a
    // verified phone number any more (Twilio Verify was a per-use cost).

    // No recurring membership, Stripe-subscription or tier eligibility
    // gate, and no Credit content-unlock check (retired 2026-11-25):
    // every feature is free. Member identity above only scopes access
    // to the signed-in member's own data.
    return null;
  } finally {
    await db.end();
  }
}
