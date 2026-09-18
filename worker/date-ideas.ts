// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const WRITE_FIELDS = new Set([
  'title',
  'description',
  'category',
  'budget',
  'location_type',
  'occasion',
  'relationship_stage',
  'is_favorite',
  'is_completed',
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function getSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && session ? { user, session } : null;
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Expected application/json body.');
  }
  return request.json();
}

function cleanText(value, max = 5000, required = false) {
  if (value == null) {
    if (required) throw new Error('Required value is missing.');
    return null;
  }
  const out = String(value).trim();
  if (required && !out) throw new Error('Required value is empty.');
  if (out.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return out || null;
}

function normalize(body, partial = false) {
  const out = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (WRITE_FIELDS.has(key)) out[key] = value;
  }

  if (!partial) {
    out.title = cleanText(out.title, 500, true);
  } else if ('title' in out) {
    out.title = cleanText(out.title, 500, true);
  }

  for (const key of ['description', 'category', 'budget', 'location_type', 'occasion', 'relationship_stage']) {
    if (key in out) out[key] = cleanText(out[key], key === 'description' ? 5000 : 250);
  }
  if ('is_favorite' in out) out.is_favorite = Boolean(out.is_favorite);
  if ('is_completed' in out) out.is_completed = Boolean(out.is_completed);

  return out;
}

async function listIdeas(db, userId) {
  const result = await db.query(
    'SELECT * FROM public.custom_date_ideas WHERE user_id=$1::uuid ORDER BY created_at DESC, id ASC',
    [userId],
  );
  return result.rows;
}

async function insertIdea(db, userId, body) {
  const fields = normalize(body, false);
  const columns = ['user_id'];
  const values = [userId];
  const params = ['$1::uuid'];
  for (const [key, value] of Object.entries(fields)) {
    columns.push(key);
    values.push(value);
    params.push(`$${values.length}`);
  }
  const result = await db.query(
    `INSERT INTO public.custom_date_ideas (${columns.join(',')}) VALUES (${params.join(',')}) RETURNING *`,
    values,
  );
  return result.rows[0];
}

async function updateIdea(db, userId, ideaId, body) {
  const fields = normalize(body, true);
  if (!Object.keys(fields).length) throw new Error('No updates were provided.');
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    values.push(value);
    sets.push(`${key}=$${values.length}`);
  }
  values.push(ideaId, userId);
  const result = await db.query(
    `UPDATE public.custom_date_ideas SET ${sets.join(',')}, updated_at=now()
     WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING *`,
    values,
  );
  return result.rows[0] || null;
}

export async function handleDateIdeasRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/date-ideas')) return null;

  const auth = await getSession(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    return await withDb(env, async (db) => {
      const itemMatch = url.pathname.match(/^\/api\/date-ideas\/([0-9a-f-]{36})$/i);
      if (itemMatch) {
        const ideaId = itemMatch[1];
        if (request.method === 'PATCH') {
          const idea = await updateIdea(db, auth.user.id, ideaId, await readJson(request));
          return idea ? json({ ok: true, idea }) : fail('Date idea not found.', 404, 'not_found');
        }
        if (request.method === 'DELETE') {
          const result = await db.query(
            'DELETE FROM public.custom_date_ideas WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id',
            [ideaId, auth.user.id],
          );
          return result.rowCount ? json({ ok: true }) : fail('Date idea not found.', 404, 'not_found');
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      if (url.pathname === '/api/date-ideas') {
        if (request.method === 'GET') return json({ ok: true, ideas: await listIdeas(db, auth.user.id, url) });
        if (request.method === 'POST') return json({ ok: true, idea: await insertIdea(db, auth.user.id, await readJson(request)) }, 201);
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      return fail('Date Ideas route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove date ideas API error', err);
    return fail(err?.message || 'Unable to process Date Ideas request.', 400, 'date_ideas_error');
  }
}
