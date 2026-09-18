// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const TYPES = new Set(['monthly_love_notes', 'yearly_engagement']);
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request') { return json({ ok: false, error: { code, message } }, status); }
async function withDb(env, fn) { const db = new Client({ connectionString: env.HYPERDRIVE.connectionString }); await db.connect(); try { return await fn(db); } finally { await db.end(); } }
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', { headers: { cookie, accept: 'application/json' } });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}
function validate(type, period) {
  if (!TYPES.has(type)) throw new Error('Invalid contest type.');
  if (type === 'monthly_love_notes' && !/^\d{4}-\d{2}$/.test(String(period || ''))) throw new Error('Invalid monthly contest period.');
  if (type === 'yearly_engagement' && !/^\d{4}$/.test(String(period || ''))) throw new Error('Invalid yearly contest period.');
}
function periodBounds(type, period) {
  validate(type, period);
  if (type === 'monthly_love_notes') {
    const [year, month] = period.split('-').map(Number);
    if (month < 1 || month > 12) throw new Error('Invalid monthly contest period.');
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return [start.toISOString(), end.toISOString()];
  }
  const year = Number(period);
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  return [start.toISOString(), end.toISOString()];
}

export async function readContestLeaderboard(db, type, period, limit = 5) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 50));
  const [start, end] = periodBounds(type, period);
  if (type === 'monthly_love_notes') {
    const r = await db.query(
      `SELECT cp.id,cp.contest_type,cp.period,
              COALESCE(activity.score,0)::int AS score,
              COALESCE(activity.activities_count,0)::int AS activities_count,
              cp.created_at,
              COALESCE(NULLIF(u.name,''),'One2OneLove Member') AS display_name
         FROM public.contest_participants cp
         LEFT JOIN public.users u ON lower(u.email)=lower(cp.user_email)
         LEFT JOIN LATERAL (
           SELECT count(*)::int AS score,count(*)::int AS activities_count
             FROM public.sent_love_notes s
            WHERE s.user_id=u.id AND s.sent_date >= $3::timestamptz AND s.sent_date < $4::timestamptz
         ) activity ON true
        WHERE cp.contest_type=$1 AND cp.period=$2
        ORDER BY score DESC,activities_count DESC,cp.created_at ASC
        LIMIT $5`,
      [type, period, start, end, safeLimit],
    );
    return r.rows;
  }

  const r = await db.query(
    `SELECT cp.id,cp.contest_type,cp.period,
            COALESCE(activity.score,0)::int AS score,
            COALESCE(activity.activities_count,0)::int AS activities_count,
            cp.created_at,
            COALESCE(NULLIF(u.name,''),'One2OneLove Member') AS display_name
       FROM public.contest_participants cp
       LEFT JOIN public.users u ON lower(u.email)=lower(cp.user_email)
       LEFT JOIN LATERAL (
         SELECT COALESCE(sum(COALESCE(g.points_earned,g.points,0)),0)::int AS score,
                count(*)::int AS activities_count
           FROM public.gamification_points g
          WHERE g.user_id=u.id AND g.created_at >= $3::timestamptz AND g.created_at < $4::timestamptz
       ) activity ON true
      WHERE cp.contest_type=$1 AND cp.period=$2
      ORDER BY score DESC,activities_count DESC,cp.created_at ASC
      LIMIT $5`,
    [type, period, start, end, safeLimit],
  );
  return r.rows;
}

export async function readContestWinner(db, type, period) {
  const [start, end] = periodBounds(type, period);
  const scoreSql = type === 'monthly_love_notes'
    ? `SELECT count(*)::int AS score
         FROM public.sent_love_notes s
        WHERE s.user_id=u.id AND s.sent_date >= $3::timestamptz AND s.sent_date < $4::timestamptz`
    : `SELECT COALESCE(sum(COALESCE(g.points_earned,g.points,0)),0)::int AS score
         FROM public.gamification_points g
        WHERE g.user_id=u.id AND g.created_at >= $3::timestamptz AND g.created_at < $4::timestamptz`;
  const r = await db.query(
    `SELECT cw.id,cw.contest_type,cw.period,cw.rank,cw.prize_description,cw.won_at,cw.created_at,
            COALESCE(NULLIF(u.name,''),'One2OneLove Member') AS winner_name,
            COALESCE(activity.score,0)::int AS final_score
       FROM public.contest_winners cw
       LEFT JOIN public.users u ON lower(u.email)=lower(cw.user_email)
       LEFT JOIN LATERAL (${scoreSql}) activity ON true
      WHERE cw.contest_type=$1 AND cw.period=$2
      ORDER BY cw.rank ASC LIMIT 1`,
    [type, period, start, end],
  );
  return r.rows[0] || null;
}

async function readMyContestRank(db, type, period, email) {
  const [start, end] = periodBounds(type, period);
  const activitySql = type === 'monthly_love_notes'
    ? `SELECT count(*)::int AS score,count(*)::int AS activities_count
         FROM public.sent_love_notes s
        WHERE s.user_id=u.id AND s.sent_date >= $3::timestamptz AND s.sent_date < $4::timestamptz`
    : `SELECT COALESCE(sum(COALESCE(g.points_earned,g.points,0)),0)::int AS score,
              count(*)::int AS activities_count
         FROM public.gamification_points g
        WHERE g.user_id=u.id AND g.created_at >= $3::timestamptz AND g.created_at < $4::timestamptz`;
  const r = await db.query(
    `WITH scored AS (
       SELECT cp.id,cp.user_email,cp.contest_type,cp.period,cp.created_at,
              COALESCE(activity.score,0)::int AS score,
              COALESCE(activity.activities_count,0)::int AS activities_count
         FROM public.contest_participants cp
         LEFT JOIN public.users u ON lower(u.email)=lower(cp.user_email)
         LEFT JOIN LATERAL (${activitySql}) activity ON true
        WHERE cp.contest_type=$1 AND cp.period=$2
     ), ranked AS (
       SELECT scored.*,dense_rank() OVER (ORDER BY score DESC,activities_count DESC,created_at ASC)::int AS rank
         FROM scored
     )
     SELECT id,contest_type,period,score,activities_count,created_at,rank
       FROM ranked WHERE lower(user_email)=lower($5) LIMIT 1`,
    [type, period, start, end, email],
  );
  return r.rows[0] || null;
}

export async function handleContestsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/contests')) return null;
  try {
    if (url.pathname === '/api/contests/leaderboard' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      const period = url.searchParams.get('period');
      const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 5), 50));
      return await withDb(env, async db => json({ ok: true, participants: await readContestLeaderboard(db, type, period, limit) }));
    }

    if (url.pathname === '/api/contests/winner' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      const period = url.searchParams.get('period');
      return await withDb(env, async db => json({ ok: true, winner: await readContestWinner(db, type, period) }));
    }

    const auth = await session(request, env);
    if (!auth) return fail('Authentication required.', 401, 'unauthorized');

    if (url.pathname === '/api/contests/my-rank' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      const period = url.searchParams.get('period');
      return await withDb(env, async db => json({ ok: true, participant: await readMyContestRank(db, type, period, auth.user.email) }));
    }

    if (url.pathname === '/api/contests/join' && request.method === 'POST') {
      const input = await readJson(request);
      const type = String(input?.type || '');
      const period = String(input?.period || '');
      validate(type, period);
      return await withDb(env, async db => {
        const r = await db.query(
          `INSERT INTO public.contest_participants(user_email,contest_type,period,score,activities_count)
           VALUES($1,$2,$3,0,0)
           ON CONFLICT(user_email,contest_type,period) DO UPDATE SET updated_at=now()
           RETURNING id,contest_type,period,created_at`,
          [auth.user.email, type, period],
        );
        const participant = await readMyContestRank(db, type, period, auth.user.email);
        return json({ ok: true, participant: participant || r.rows[0] }, 201);
      });
    }

    return fail('Contest route not found.', 404, 'not_found');
  } catch (err) {
    console.error('One2OneLove contest API error', err);
    return fail(err?.message || 'Unable to process contest request.', 400, 'contest_error');
  }
}
