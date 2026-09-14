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
  'memory_date',
  'location',
  'media_urls',
  'is_favorite',
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
  return user?.id && session ? { user, session } : null;
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

function cleanDate(value, required = false) {
  if (value == null || value === '') {
    if (required) throw new Error('Memory date is required.');
    return null;
  }
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Memory date must use YYYY-MM-DD.');
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error('Memory date is invalid.');
  return text;
}

function cleanMediaUrls(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error('media_urls must be an array.');
  if (value.length > 20) throw new Error('A memory can contain at most 20 media items.');
  return value
    .map(item => cleanText(item, 2000, false))
    .filter(Boolean);
}

function normalize(body, partial = false) {
  const out = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (WRITE_FIELDS.has(key)) out[key] = value;
  }

  if (!partial) {
    out.title = cleanText(out.title, 500, true);
    out.memory_date = cleanDate(out.memory_date, true);
  } else {
    if ('title' in out) out.title = cleanText(out.title, 500, true);
    if ('memory_date' in out) out.memory_date = cleanDate(out.memory_date, true);
  }

  if ('description' in out) out.description = cleanText(out.description, 10000, false);
  if ('location' in out) out.location = cleanText(out.location, 500, false);
  if ('media_urls' in out) out.media_urls = cleanMediaUrls(out.media_urls);
  if ('is_favorite' in out) out.is_favorite = Boolean(out.is_favorite);

  return out;
}

async function listMemories(db, userId) {
  const result = await db.query(
    'SELECT * FROM public.memories WHERE user_id=$1::uuid ORDER BY memory_date DESC, created_at DESC, id ASC',
    [userId],
  );
  return result.rows;
}

async function insertMemory(db, userId, body) {
  const fields = normalize(body, false);
  const columns = ['user_id'];
  const values = [userId];
  const params = ['$1::uuid'];

  for (const [key, value] of Object.entries(fields)) {
    columns.push(key);
    values.push(value);
    if (key === 'media_urls') {
      params.push(`$${values.length}::text[]`);
    } else if (key === 'memory_date') {
      params.push(`$${values.length}::date`);
    } else {
      params.push(`$${values.length}`);
    }
  }

  const result = await db.query(
    `INSERT INTO public.memories (${columns.join(',')}) VALUES (${params.join(',')}) RETURNING *`,
    values,
  );
  return result.rows[0];
}

async function updateMemory(db, userId, memoryId, body) {
  const fields = normalize(body, true);
  if (!Object.keys(fields).length) throw new Error('No updates were provided.');
  const sets = [];
  const values = [];

  for (const [key, value] of Object.entries(fields)) {
    values.push(value);
    const cast = key === 'media_urls' ? '::text[]' : key === 'memory_date' ? '::date' : '';
    sets.push(`${key}=$${values.length}${cast}`);
  }

  values.push(memoryId, userId);
  const result = await db.query(
    `UPDATE public.memories SET ${sets.join(',')}, updated_at=now()
     WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING *`,
    values,
  );
  return result.rows[0] || null;
}

export async function handleMemoriesRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/memories')) return null;

  const auth = await getSession(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    return await withDb(env, async (db) => {
      const itemMatch = url.pathname.match(/^\/api\/memories\/([0-9a-f-]{36})$/i);
      if (itemMatch) {
        const memoryId = itemMatch[1];
        if (request.method === 'PATCH') {
          const memory = await updateMemory(db, auth.user.id, memoryId, await readJson(request));
          return memory ? json({ ok: true, memory }) : fail('Memory not found.', 404, 'not_found');
        }
        if (request.method === 'DELETE') {
          const result = await db.query(
            'DELETE FROM public.memories WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id',
            [memoryId, auth.user.id],
          );
          return result.rowCount ? json({ ok: true }) : fail('Memory not found.', 404, 'not_found');
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      if (url.pathname === '/api/memories') {
        if (request.method === 'GET') return json({ ok: true, memories: await listMemories(db, auth.user.id) });
        if (request.method === 'POST') {
          const memory = await insertMemory(db, auth.user.id, await readJson(request));
          return json({ ok: true, memory }, 201);
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      return fail('Memories route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove memories API error', err);
    return fail(err?.message || 'Unable to process Memories request.', 400, 'memories_error');
  }
}
