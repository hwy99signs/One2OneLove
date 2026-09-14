// @ts-nocheck
import { Client } from 'pg';

const TRACKABLE_FEATURES = new Set([
  'Love Notes',
  'Love Note Scheduler',
  'Date Ideas',
  'Relationship Quizzes',
  'Love Language Quiz',
  'Anniversary Tracker',
  'Memory Lane',
  'Relationship Goals',
  'Couples Calendar',
  'Shared Journals',
  'Relationship Milestones',
  'Couples Profile',
  'Couples Dashboard',
  'Relationship Support',
  'Community',
  'Chat',
  'Podcasts',
  'Articles',
  'LGBTQ+ Support',
  'Invite & Share',
  'Communication Practice',
  'Meditation',
  'Couple Activities',
  'Find Friends',
  'Friend Requests',
  'Member Profile',
  'Subscription / Billing',
]);

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

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export async function handleFeatureUsageRequest(request, env, url) {
  if (url.pathname !== '/api/feature-usage') return null;
  if (request.method !== 'POST') return json({ ok: false, error: { message: 'Method not allowed.' } }, 405);

  const auth = await session(request, env);
  if (!auth) return json({ ok: false, error: { message: 'Authentication required.' } }, 401);

  const body = await request.json().catch(() => null);
  const feature = String(body?.feature || '').trim();
  const eventType = String(body?.eventType || 'view').trim().toLowerCase();
  const route = String(body?.route || '').trim().slice(0, 300) || null;

  if (!TRACKABLE_FEATURES.has(feature)) return json({ ok: false, error: { message: 'Unknown feature.' } }, 400);
  if (!new Set(['view', 'action']).has(eventType)) return json({ ok: false, error: { message: 'Unknown event type.' } }, 400);

  return withDb(env, async (db) => {
    const exists = await db.query(`SELECT to_regclass('public.feature_usage_events') IS NOT NULL AS ready`);
    if (!exists.rows[0]?.ready) {
      // Preview code may deploy before the additive analytics migration is activated.
      // Treat that as a no-op so normal member navigation is never interrupted.
      return new Response(null, { status: 204 });
    }

    // Avoid inflating engagement when a member refreshes the same page repeatedly.
    await db.query(
      `INSERT INTO public.feature_usage_events (user_id,feature,event_type,route)
       SELECT $1::uuid,$2,$3,$4
       WHERE NOT EXISTS (
         SELECT 1 FROM public.feature_usage_events
          WHERE user_id=$1::uuid AND feature=$2 AND event_type=$3
            AND created_at >= now() - interval '30 seconds'
       )`,
      [auth.user.id, feature, eventType, route],
    );

    return json({ ok: true });
  });
}
