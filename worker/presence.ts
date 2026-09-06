// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const STATUSES = new Set(['online', 'offline', 'away', 'busy']);

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request') { return json({ ok: false, error: { code, message } }, status); }
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
async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}
function offline(userId) {
  return { user_id: userId, status: 'offline', is_online: false, last_seen: null, last_active: null, last_seen_text: 'Long time ago' };
}

export async function handlePresenceRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/presence')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  try {
    return await withDb(env, async (db) => {
      if (url.pathname === '/api/presence/heartbeat') {
        if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
        await db.query('SELECT public.heartbeat_user_presence($1::uuid)', [auth.user.id]);
        return json({ ok: true });
      }
      if (url.pathname === '/api/presence/batch') {
        if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
        const input = await readJson(request);
        const ids = Array.isArray(input.user_ids) ? input.user_ids.filter((id) => /^[0-9a-f-]{36}$/i.test(String(id))).slice(0, 100) : [];
        if (!ids.length) return json({ ok: true, presence: {} });
        const result = await db.query('SELECT * FROM public.user_presence_view WHERE user_id = ANY($1::uuid[])', [ids]);
        const map = {};
        for (const id of ids) map[id] = offline(id);
        for (const row of result.rows) map[row.user_id] = row;
        return json({ ok: true, presence: map });
      }
      if (url.pathname === '/api/presence/online') {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        const result = await db.query('SELECT * FROM public.user_presence_view WHERE is_online=true ORDER BY last_active DESC LIMIT 500');
        return json({ ok: true, users: result.rows });
      }
      if (url.pathname === '/api/presence/count') {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        const result = await db.query("SELECT count(*)::int AS count FROM public.user_presence_view WHERE is_online=true");
        return json({ ok: true, count: result.rows[0]?.count || 0 });
      }
      const userMatch = url.pathname.match(/^\/api\/presence\/([0-9a-f-]{36})$/i);
      if (userMatch) {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        const result = await db.query('SELECT * FROM public.user_presence_view WHERE user_id=$1::uuid', [userMatch[1]]);
        return json({ ok: true, presence: result.rows[0] || offline(userMatch[1]) });
      }
      if (url.pathname === '/api/presence') {
        if (request.method !== 'POST' && request.method !== 'PATCH') return fail('Method not allowed.', 405, 'method_not_allowed');
        const input = await readJson(request);
        const status = String(input.status || 'online');
        if (!STATUSES.has(status)) return fail('Invalid presence status.');
        await db.query('SELECT public.update_user_presence($1::uuid,$2)', [auth.user.id, status]);
        const result = await db.query('SELECT * FROM public.user_presence_view WHERE user_id=$1::uuid', [auth.user.id]);
        return json({ ok: true, presence: result.rows[0] || offline(auth.user.id) });
      }
      return fail('Presence route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove presence API error', err);
    return fail(err?.message || 'Unable to process presence request.', 400, 'presence_error');
  }
}
