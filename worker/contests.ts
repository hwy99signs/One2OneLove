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
  return user?.id && active ? { user, session: active } : null;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}
function validate(type, period) {
  if (!TYPES.has(type)) throw new Error('Invalid contest type.');
  if (!/^(\d{4}|\d{4}-\d{2})$/.test(String(period || ''))) throw new Error('Invalid contest period.');
}

export async function handleContestsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/contests')) return null;
  try {
    if (url.pathname === '/api/contests/leaderboard' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      const period = url.searchParams.get('period');
      validate(type, period);
      const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 5), 50));
      return await withDb(env, async db => {
        const r = await db.query(
          `SELECT cp.id,cp.contest_type,cp.period,cp.score,cp.activities_count,cp.created_at,
                  COALESCE(NULLIF(u.name,''),'One2OneLove Member') AS display_name
             FROM public.contest_participants cp
             LEFT JOIN public.users u ON lower(u.email)=lower(cp.user_email)
            WHERE cp.contest_type=$1 AND cp.period=$2
            ORDER BY cp.score DESC,cp.activities_count DESC,cp.created_at ASC LIMIT $3`,
          [type, period, limit],
        );
        return json({ ok: true, participants: r.rows });
      });
    }

    if (url.pathname === '/api/contests/winner' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      const period = url.searchParams.get('period');
      validate(type, period);
      return await withDb(env, async db => {
        const r = await db.query(
          `SELECT cw.id,cw.contest_type,cw.period,cw.rank,cw.prize_description,cw.won_at,cw.created_at,
                  COALESCE(NULLIF(u.name,''),'One2OneLove Member') AS winner_name,
                  COALESCE(cp.score,0) AS final_score
             FROM public.contest_winners cw
             LEFT JOIN public.users u ON lower(u.email)=lower(cw.user_email)
             LEFT JOIN public.contest_participants cp ON lower(cp.user_email)=lower(cw.user_email) AND cp.contest_type=cw.contest_type AND cp.period=cw.period
            WHERE cw.contest_type=$1 AND cw.period=$2 ORDER BY cw.rank ASC LIMIT 1`,
          [type, period],
        );
        return json({ ok: true, winner: r.rows[0] || null });
      });
    }

    const auth = await session(request, env);
    if (!auth) return fail('Authentication required.', 401, 'unauthorized');

    if (url.pathname === '/api/contests/my-rank' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      const period = url.searchParams.get('period');
      validate(type, period);
      return await withDb(env, async db => {
        const r = await db.query(
          `WITH ranked AS (
             SELECT cp.*, dense_rank() OVER (ORDER BY cp.score DESC,cp.activities_count DESC,cp.created_at ASC)::int AS rank
             FROM public.contest_participants cp WHERE cp.contest_type=$1 AND cp.period=$2
           ) SELECT * FROM ranked WHERE lower(user_email)=lower($3) LIMIT 1`,
          [type, period, auth.user.email],
        );
        return json({ ok: true, participant: r.rows[0] || null });
      });
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
           RETURNING *`,
          [auth.user.email, type, period],
        );
        return json({ ok: true, participant: r.rows[0] }, 201);
      });
    }

    return fail('Contest route not found.', 404, 'not_found');
  } catch (err) {
    console.error('One2OneLove contest API error', err);
    return fail(err?.message || 'Unable to process contest request.', 400, 'contest_error');
  }
}
