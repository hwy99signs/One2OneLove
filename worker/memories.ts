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
  'tags',
  'partner_email',
]);

const MEDIA_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]);
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

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
  try { return await fn(db); } finally { await db.end(); }
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

function cleanArray(value, maxItems, maxLength) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error('Expected an array.');
  if (value.length > maxItems) throw new Error(`Array can contain at most ${maxItems} items.`);
  return value.map(item => cleanText(item, maxLength, true));
}

function normalize(body, partial = false) {
  const out = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (WRITE_FIELDS.has(key)) out[key] = value;
  }

  if (!partial) {
    out.title = cleanText(out.title, 500, true);
    out.memory_date = cleanDate(out.memory_date, true);
    out.media_urls = cleanArray(out.media_urls, 20, 2000);
    out.tags = cleanArray(out.tags, 30, 100);
    out.is_favorite = Boolean(out.is_favorite);
  } else {
    if ('title' in out) out.title = cleanText(out.title, 500, true);
    if ('memory_date' in out) out.memory_date = cleanDate(out.memory_date, true);
    if ('media_urls' in out) out.media_urls = cleanArray(out.media_urls, 20, 2000);
    if ('tags' in out) out.tags = cleanArray(out.tags, 30, 100);
    if ('is_favorite' in out) out.is_favorite = Boolean(out.is_favorite);
  }

  if ('description' in out) out.description = cleanText(out.description, 10000, false);
  if ('location' in out) out.location = cleanText(out.location, 500, false);
  if ('partner_email' in out) out.partner_email = cleanText(out.partner_email, 320, false)?.toLowerCase() || null;
  return out;
}

async function listMemories(db, auth) {
  const email = String(auth.user.email || '').trim().toLowerCase();
  const result = await db.query(
    `SELECT m.*, (m.user_id=$1::uuid) AS can_edit
       FROM public.memories m
      WHERE m.user_id=$1::uuid
         OR (m.partner_email IS NOT NULL AND lower(m.partner_email)=lower($2))
      ORDER BY m.memory_date DESC, m.created_at DESC, m.id ASC`,
    [auth.user.id, email],
  );
  return result.rows;
}

async function insertMemory(db, userId, body) {
  const data = normalize(body, false);
  const result = await db.query(
    `INSERT INTO public.memories
      (user_id,title,description,memory_date,location,media_urls,is_favorite,tags,partner_email)
     VALUES ($1::uuid,$2,$3,$4::date,$5,$6::text[],$7,$8::text[],$9)
     RETURNING *, true AS can_edit`,
    [userId, data.title, data.description, data.memory_date, data.location,
     data.media_urls, data.is_favorite, data.tags, data.partner_email],
  );
  return result.rows[0];
}

async function updateMemory(db, userId, memoryId, body) {
  const data = normalize(body, true);
  if (!Object.keys(data).length) throw new Error('No updates were provided.');
  const sets = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    values.push(value);
    const cast = ['media_urls', 'tags'].includes(key) ? '::text[]' : key === 'memory_date' ? '::date' : '';
    sets.push(`${key}=$${values.length}${cast}`);
  }

  values.push(memoryId, userId);
  const result = await db.query(
    `UPDATE public.memories SET ${sets.join(',')}, updated_at=now()
     WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid
     RETURNING *, true AS can_edit`,
    values,
  );
  return result.rows[0] || null;
}

function mediaKey(userId, fileId) {
  return `memories/${userId}/${fileId}`;
}

async function serveMedia(request, env, url) {
  const match = url.pathname.match(/^\/api\/media\/memories\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/i);
  if (!match) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return fail('Method not allowed.', 405, 'method_not_allowed');
  const object = await env.MEDIA.get(mediaKey(match[1], match[2]));
  if (!object) return fail('Memory media not found.', 404, 'not_found');
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public,max-age=3600');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

export async function handleMemoriesRequest(request, env, url) {
  const publicMedia = await serveMedia(request, env, url);
  if (publicMedia) return publicMedia;
  if (!url.pathname.startsWith('/api/memories')) return null;

  const auth = await getSession(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    if (url.pathname === '/api/memories/media' && ['POST', 'PUT'].includes(request.method)) {
      const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!MEDIA_TYPES.has(type)) return fail('File must be JPEG, PNG, WebP, GIF, MP4, MOV, or WebM.');
      const declared = Number(request.headers.get('content-length') || 0);
      if (declared > MAX_MEDIA_BYTES) return fail('Memory media must be 10MB or smaller.', 413, 'file_too_large');
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > MAX_MEDIA_BYTES) {
        return fail('Memory media must be between 1 byte and 10MB.', 413, 'file_too_large');
      }

      const memoryId = url.searchParams.get('memoryId');
      if (memoryId) {
        const owned = await withDb(env, db => db.query(
          'SELECT 1 FROM public.memories WHERE id=$1::uuid AND user_id=$2::uuid',
          [memoryId, auth.user.id],
        ));
        if (!owned.rowCount) return fail('Memory not found.', 404, 'not_found');
      }

      const fileId = crypto.randomUUID();
      await env.MEDIA.put(mediaKey(auth.user.id, fileId), bytes, {
        httpMetadata: { contentType: type },
        customMetadata: { ownerUserId: auth.user.id, memoryId: memoryId || '' },
      });
      return json({ ok: true, url: `/api/media/memories/${auth.user.id}/${fileId}` }, 201);
    }

    const mediaDelete = url.pathname.match(/^\/api\/memories\/media\/([0-9a-f-]{36})$/i);
    if (mediaDelete) {
      if (request.method !== 'DELETE') return fail('Method not allowed.', 405, 'method_not_allowed');
      await env.MEDIA.delete(mediaKey(auth.user.id, mediaDelete[1]));
      return json({ ok: true });
    }

    return await withDb(env, async (db) => {
      const itemMatch = url.pathname.match(/^\/api\/memories\/([0-9a-f-]{36})$/i);
      if (itemMatch) {
        const memoryId = itemMatch[1];
        if (request.method === 'PATCH') {
          const memory = await updateMemory(db, auth.user.id, memoryId, await readJson(request));
          return memory ? json({ ok: true, memory }) : fail('Memory not found or not editable.', 404, 'not_found');
        }
        if (request.method === 'DELETE') {
          const result = await db.query(
            'DELETE FROM public.memories WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id',
            [memoryId, auth.user.id],
          );
          return result.rowCount ? json({ ok: true }) : fail('Memory not found or not editable.', 404, 'not_found');
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      if (url.pathname === '/api/memories') {
        if (request.method === 'GET') return json({ ok: true, memories: await listMemories(db, auth) });
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
