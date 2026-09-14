// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const MOODS = new Set(['happy', 'grateful', 'reflective', 'excited', 'peaceful', 'challenged', 'loving']);
const SORT_FIELDS = new Set(['entry_date', 'created_at', 'updated_at', 'title', 'mood']);
const WRITE_FIELDS = new Set(['title', 'content', 'entry_date', 'mood', 'tags', 'is_favorite']);

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
async function body(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}
function text(value, max, required = false) {
  if (value == null) { if (required) throw new Error('Required value is missing.'); return null; }
  const out = String(value).trim();
  if (required && !out) throw new Error('Required value is empty.');
  if (out.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return out || null;
}
function normalize(input, partial = false) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) if (WRITE_FIELDS.has(key)) out[key] = value;
  if (!partial) {
    out.title = text(out.title, 300, true);
    out.content = text(out.content, 50000, true);
    out.entry_date = text(out.entry_date, 10, true);
    out.mood = text(out.mood, 40, true);
    out.tags = Array.isArray(out.tags) ? out.tags.slice(0, 50).map((v) => text(v, 100, true)) : [];
    out.is_favorite = Boolean(out.is_favorite);
  } else {
    if ('title' in out) out.title = text(out.title, 300, true);
    if ('content' in out) out.content = text(out.content, 50000, true);
    if ('entry_date' in out) out.entry_date = text(out.entry_date, 10, true);
    if ('mood' in out) out.mood = text(out.mood, 40, true);
    if ('tags' in out) out.tags = Array.isArray(out.tags) ? out.tags.slice(0, 50).map((v) => text(v, 100, true)) : [];
    if ('is_favorite' in out) out.is_favorite = Boolean(out.is_favorite);
  }
  if ('mood' in out && !MOODS.has(out.mood)) throw new Error('Invalid journal mood.');
  return out;
}

async function list(db, userId, url) {
  const clauses = ['user_id=$1::uuid'];
  const values = [userId];
  if (url.searchParams.get('mood')) { values.push(url.searchParams.get('mood')); clauses.push(`mood=$${values.length}`); }
  if (url.searchParams.get('favorite') === 'true') clauses.push('is_favorite=true');
  const order = url.searchParams.get('order') || '-entry_date';
  const desc = order.startsWith('-');
  const field = order.replace(/^-/, '');
  const sort = SORT_FIELDS.has(field) ? field : 'entry_date';
  const result = await db.query(`SELECT * FROM public.shared_journals WHERE ${clauses.join(' AND ')} ORDER BY ${sort} ${desc ? 'DESC' : 'ASC'}, id ASC`, values);
  return result.rows;
}

async function create(db, userId, input) {
  const data = normalize(input, false);
  const result = await db.query(
    `INSERT INTO public.shared_journals (user_id,title,content,entry_date,mood,tags,is_favorite)
     VALUES ($1::uuid,$2,$3,$4::date,$5,$6::text[],$7) RETURNING *`,
    [userId, data.title, data.content, data.entry_date, data.mood, data.tags, data.is_favorite],
  );
  return result.rows[0];
}

async function update(db, userId, entryId, input) {
  const data = normalize(input, true);
  if (!Object.keys(data).length) throw new Error('No journal updates were provided.');
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) { values.push(value); sets.push(`${key}=$${values.length}`); }
  values.push(entryId, userId);
  const result = await db.query(
    `UPDATE public.shared_journals SET ${sets.join(',')},updated_at=now()
     WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING *`, values,
  );
  return result.rows[0] || null;
}

async function stats(db, userId) {
  const result = await db.query(
    `SELECT count(*)::int AS total,
      count(*) FILTER (WHERE is_favorite)::int AS favorites,
      count(*) FILTER (WHERE mood='happy')::int AS happy,
      count(*) FILTER (WHERE mood='grateful')::int AS grateful,
      count(*) FILTER (WHERE mood='reflective')::int AS reflective,
      count(*) FILTER (WHERE mood='excited')::int AS excited,
      count(*) FILTER (WHERE mood='peaceful')::int AS peaceful,
      count(*) FILTER (WHERE mood='challenged')::int AS challenged,
      count(*) FILTER (WHERE mood='loving')::int AS loving
     FROM public.shared_journals WHERE user_id=$1::uuid`, [userId],
  );
  const row = result.rows[0];
  return { total: row.total, favorites: row.favorites, byMood: { happy: row.happy, grateful: row.grateful, reflective: row.reflective, excited: row.excited, peaceful: row.peaceful, challenged: row.challenged, loving: row.loving } };
}

export async function handleJournalsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/journals')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  try {
    return await withDb(env, async (db) => {
      if (url.pathname === '/api/journals/stats') {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        return json({ ok: true, stats: await stats(db, auth.user.id) });
      }
      const item = url.pathname.match(/^\/api\/journals\/([0-9a-f-]{36})$/i);
      if (item) {
        if (request.method === 'GET') {
          const result = await db.query('SELECT * FROM public.shared_journals WHERE id=$1::uuid AND user_id=$2::uuid', [item[1], auth.user.id]);
          return result.rows[0] ? json({ ok: true, entry: result.rows[0] }) : fail('Journal entry not found.', 404, 'not_found');
        }
        if (request.method === 'PATCH') {
          const entry = await update(db, auth.user.id, item[1], await body(request));
          return entry ? json({ ok: true, entry }) : fail('Journal entry not found.', 404, 'not_found');
        }
        if (request.method === 'DELETE') {
          const result = await db.query('DELETE FROM public.shared_journals WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id', [item[1], auth.user.id]);
          return result.rowCount ? json({ ok: true }) : fail('Journal entry not found.', 404, 'not_found');
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      if (url.pathname === '/api/journals') {
        if (request.method === 'GET') return json({ ok: true, entries: await list(db, auth.user.id, url) });
        if (request.method === 'POST') return json({ ok: true, entry: await create(db, auth.user.id, await body(request)) }, 201);
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      return fail('Journal route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove journals API error', err);
    return fail(err?.message || 'Unable to process journal request.', 400, 'journal_error');
  }
}
