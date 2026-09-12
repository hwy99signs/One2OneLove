// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MEMORY_FILE_BYTES = 10 * 1024 * 1024;
const MEMORY_CONTENT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function isUuid(value) { return UUID.test(String(value || '')); }
function cleanText(value, max = 1000, required = false) {
  if (value == null) {
    if (required) throw new Error('Required value is missing.');
    return null;
  }
  const out = String(value).trim();
  if (required && !out) throw new Error('Required value is empty.');
  if (out.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return out || null;
}
function safeFileName(value) {
  const name = String(value || 'memory-media').replace(/[\r\n]/g, '').replace(/[^a-zA-Z0-9._ -]/g, '_').trim();
  return (name || 'memory-media').slice(0, 180);
}
function safeDate(value) {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Invalid date.');
  return text;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Expected application/json body.');
  }
  return request.json();
}
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
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
function memoryPayload(input) {
  return {
    title: cleanText(input?.title, 200, true),
    description: cleanText(input?.description, 5000),
    memory_date: safeDate(input?.memory_date),
    location: cleanText(input?.location, 500),
    media_urls: Array.isArray(input?.media_urls)
      ? input.media_urls.filter(v => typeof v === 'string').slice(0, 30)
      : [],
    is_favorite: Boolean(input?.is_favorite),
  };
}
function dateIdeaPayload(input, partial = false) {
  const out = {};
  const textFields = {
    title: 200,
    description: 3000,
    category: 100,
    budget: 100,
    location_type: 100,
    occasion: 100,
    relationship_stage: 100,
  };
  for (const [key, max] of Object.entries(textFields)) {
    if (!partial || Object.prototype.hasOwnProperty.call(input || {}, key)) {
      const value = cleanText(input?.[key], max, key === 'title' && !partial);
      if (value !== null || !partial) out[key] = value;
    }
  }
  for (const key of ['is_favorite', 'is_completed']) {
    if (!partial || Object.prototype.hasOwnProperty.call(input || {}, key)) out[key] = Boolean(input?.[key]);
  }
  return out;
}
function memoryMediaTailFromUrl(url) {
  const value = String(url || '');
  const marker = '/api/engagement/media/memories/';
  const index = value.indexOf(marker);
  if (index < 0) return null;
  const tail = value.slice(index + marker.length).split(/[?#]/)[0];
  try { return decodeURIComponent(tail); } catch { return null; }
}
async function deleteOwnedMedia(env, userId, urls) {
  const keys = [];
  for (const url of urls || []) {
    const tail = memoryMediaTailFromUrl(url);
    if (tail && !tail.includes('/') && tail.length < 260) keys.push(`memories/${userId}/${tail}`);
  }
  if (keys.length) await env.MEDIA.delete(keys);
}
async function listMemories(db, userId) {
  const r = await db.query('SELECT * FROM public.memories WHERE user_id=$1::uuid ORDER BY memory_date DESC,created_at DESC', [userId]);
  return r.rows;
}
async function ownMemory(db, id, userId) {
  const r = await db.query('SELECT * FROM public.memories WHERE id=$1::uuid AND user_id=$2::uuid', [id, userId]);
  return r.rows[0] || null;
}
async function listDateIdeas(db, userId, favoriteOnly) {
  const r = await db.query(
    `SELECT * FROM public.custom_date_ideas WHERE user_id=$1::uuid ${favoriteOnly ? 'AND is_favorite=true' : ''} ORDER BY created_at DESC`,
    [userId],
  );
  return r.rows;
}
async function contestLeaderboard(db, type, period, limit = 5) {
  if (!['monthly_love_notes', 'yearly_engagement'].includes(type)) throw new Error('Invalid contest type.');
  const p = cleanText(period, 16, true);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 50));
  const r = await db.query(
    `SELECT cp.*,
            COALESCE(u.name,split_part(cp.user_email,'@',1)) AS display_name
       FROM public.contest_participants cp
       LEFT JOIN public.users u ON lower(u.email)=lower(cp.user_email)
      WHERE cp.contest_type=$1 AND cp.period=$2
      ORDER BY cp.score DESC,cp.activities_count DESC,cp.created_at ASC
      LIMIT $3`,
    [type, p, safeLimit],
  );
  return r.rows;
}
async function contestWinner(db, type, period) {
  const r = await db.query(
    `SELECT cw.*,
            COALESCE(u.name,split_part(cw.user_email,'@',1)) AS winner_name,
            COALESCE(cp.score,0) AS final_score
       FROM public.contest_winners cw
       LEFT JOIN public.users u ON lower(u.email)=lower(cw.user_email)
       LEFT JOIN public.contest_participants cp
         ON lower(cp.user_email)=lower(cw.user_email)
        AND cp.contest_type=cw.contest_type AND cp.period=cw.period
      WHERE cw.contest_type=$1 AND cw.period=$2
      ORDER BY cw.rank ASC LIMIT 1`,
    [type, cleanText(period, 16, true)],
  );
  return r.rows[0] || null;
}

export async function handleEngagementRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/engagement')) return null;

  try {
    // Public waitlist endpoint: no authentication required.
    if (url.pathname === '/api/engagement/waitlist') {
      if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
      const input = await readJson(request);
      const email = String(input?.email || '').trim().toLowerCase();
      const country = cleanText(input?.country, 100, true);
      if (!EMAIL.test(email) || email.length > 320) return fail('Enter a valid email address.');
      return await withDb(env, async db => {
        const r = await db.query(
          `INSERT INTO public.waitlist(email,country) VALUES($1,$2)
           ON CONFLICT(email) DO UPDATE SET country=EXCLUDED.country
           RETURNING id,email,country,created_at`,
          [email, country],
        );
        return json({ ok: true, signup: r.rows[0] }, 201);
      });
    }

    // Public contest read endpoints. They expose only intentionally public standings/winner data.
    if (url.pathname === '/api/engagement/contests/leaderboard' && request.method === 'GET') {
      return await withDb(env, async db => json({
        ok: true,
        participants: await contestLeaderboard(db, url.searchParams.get('type'), url.searchParams.get('period'), url.searchParams.get('limit')),
      }));
    }
    if (url.pathname === '/api/engagement/contests/winner' && request.method === 'GET') {
      return await withDb(env, async db => json({
        ok: true,
        winner: await contestWinner(db, url.searchParams.get('type'), url.searchParams.get('period')),
      }));
    }

    const auth = await session(request, env);
    if (!auth) return fail('Authentication required.', 401, 'unauthorized');
    const userId = auth.user.id;

    return await withDb(env, async db => {
      if (url.pathname === '/api/engagement/points' && request.method === 'GET') {
        const r = await db.query('SELECT * FROM public.gamification_points WHERE user_id=$1::uuid ORDER BY created_at DESC', [userId]);
        const total = r.rows.reduce((sum, p) => sum + Number(p.points_earned || p.points || 0), 0);
        return json({ ok: true, points: r.rows, total_points: total, activity_count: r.rowCount, level: Math.floor(total / 100) + 1 });
      }
      if (url.pathname === '/api/engagement/badges' && request.method === 'GET') {
        const r = await db.query('SELECT * FROM public.badges WHERE user_id=$1::uuid ORDER BY earned_date DESC', [userId]);
        return json({ ok: true, badges: r.rows });
      }

      if (url.pathname === '/api/engagement/memories' && request.method === 'GET') {
        return json({ ok: true, memories: await listMemories(db, userId) });
      }
      if (url.pathname === '/api/engagement/memories' && request.method === 'POST') {
        const m = memoryPayload(await readJson(request));
        const r = await db.query(
          `INSERT INTO public.memories(user_id,title,description,memory_date,location,media_urls,is_favorite)
           VALUES($1::uuid,$2,$3,$4::date,$5,$6::text[],$7) RETURNING *`,
          [userId, m.title, m.description, m.memory_date, m.location, m.media_urls, m.is_favorite],
        );
        return json({ ok: true, memory: r.rows[0] }, 201);
      }

      const memoryMatch = url.pathname.match(/^\/api\/engagement\/memories\/([0-9a-f-]{36})$/i);
      if (memoryMatch) {
        const id = memoryMatch[1];
        if (!isUuid(id)) return fail('Invalid memory ID.');
        const existing = await ownMemory(db, id, userId);
        if (!existing) return fail('Memory not found.', 404, 'not_found');
        if (request.method === 'PATCH') {
          const m = memoryPayload({ ...existing, ...(await readJson(request)) });
          const r = await db.query(
            `UPDATE public.memories SET title=$1,description=$2,memory_date=$3::date,location=$4,media_urls=$5::text[],is_favorite=$6
              WHERE id=$7::uuid AND user_id=$8::uuid RETURNING *`,
            [m.title, m.description, m.memory_date, m.location, m.media_urls, m.is_favorite, id, userId],
          );
          const removed = (existing.media_urls || []).filter(v => !m.media_urls.includes(v));
          await deleteOwnedMedia(env, userId, removed).catch(() => {});
          return json({ ok: true, memory: r.rows[0] });
        }
        if (request.method === 'DELETE') {
          await db.query('DELETE FROM public.memories WHERE id=$1::uuid AND user_id=$2::uuid', [id, userId]);
          await deleteOwnedMedia(env, userId, existing.media_urls || []).catch(() => {});
          return json({ ok: true });
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      if (url.pathname === '/api/engagement/memory-media' && request.method === 'PUT') {
        const contentLength = Number(request.headers.get('content-length') || 0);
        if (contentLength > MAX_MEMORY_FILE_BYTES) return fail('File exceeds 10 MB limit.', 413, 'file_too_large');
        const contentType = (request.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim().toLowerCase();
        if (!MEMORY_CONTENT_TYPES.has(contentType)) return fail('Unsupported memory media type.', 415, 'unsupported_media_type');
        const body = await request.arrayBuffer();
        if (!body.byteLength) return fail('Empty file.');
        if (body.byteLength > MAX_MEMORY_FILE_BYTES) return fail('File exceeds 10 MB limit.', 413, 'file_too_large');
        const fileName = safeFileName(url.searchParams.get('file_name'));
        const tail = `${crypto.randomUUID()}-${fileName}`;
        const key = `memories/${userId}/${tail}`;
        await env.MEDIA.put(key, body, {
          httpMetadata: { contentType },
          customMetadata: { originalName: fileName, ownerId: userId },
        });
        return json({ ok: true, media_url: `/api/engagement/media/memories/${encodeURIComponent(tail)}` }, 201);
      }
      if (url.pathname === '/api/engagement/memory-media' && request.method === 'DELETE') {
        const input = await readJson(request);
        const tail = memoryMediaTailFromUrl(input?.url);
        if (!tail || tail.includes('/') || tail.length > 260) return fail('Invalid memory media URL.');
        await env.MEDIA.delete(`memories/${userId}/${tail}`);
        return json({ ok: true });
      }

      const mediaMatch = url.pathname.match(/^\/api\/engagement\/media\/memories\/(.+)$/);
      if (mediaMatch && request.method === 'GET') {
        let tail;
        try { tail = decodeURIComponent(mediaMatch[1]); } catch { return fail('Invalid media path.'); }
        if (!tail || tail.includes('/') || tail.length > 260) return fail('Invalid media path.');
        const object = await env.MEDIA.get(`memories/${userId}/${tail}`);
        if (!object) return fail('Media not found.', 404, 'not_found');
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('cache-control', 'private, max-age=3600');
        headers.set('x-content-type-options', 'nosniff');
        return new Response(object.body, { headers });
      }

      if (url.pathname === '/api/engagement/date-ideas' && request.method === 'GET') {
        const favoriteOnly = url.searchParams.get('favorite') === 'true';
        return json({ ok: true, date_ideas: await listDateIdeas(db, userId, favoriteOnly) });
      }
      if (url.pathname === '/api/engagement/date-ideas' && request.method === 'POST') {
        const idea = dateIdeaPayload(await readJson(request));
        const r = await db.query(
          `INSERT INTO public.custom_date_ideas(user_id,title,description,category,budget,location_type,occasion,relationship_stage,is_favorite,is_completed)
           VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [userId, idea.title, idea.description, idea.category, idea.budget, idea.location_type, idea.occasion, idea.relationship_stage, idea.is_favorite, idea.is_completed],
        );
        return json({ ok: true, date_idea: r.rows[0] }, 201);
      }
      const dateIdeaMatch = url.pathname.match(/^\/api\/engagement\/date-ideas\/([0-9a-f-]{36})$/i);
      if (dateIdeaMatch) {
        const id = dateIdeaMatch[1];
        const own = await db.query('SELECT * FROM public.custom_date_ideas WHERE id=$1::uuid AND user_id=$2::uuid', [id, userId]);
        if (!own.rowCount) return fail('Date idea not found.', 404, 'not_found');
        if (request.method === 'PATCH') {
          const input = dateIdeaPayload(await readJson(request), true);
          const allowed = ['title','description','category','budget','location_type','occasion','relationship_stage','is_favorite','is_completed'];
          const keys = allowed.filter(k => Object.prototype.hasOwnProperty.call(input, k));
          if (!keys.length) return json({ ok: true, date_idea: own.rows[0] });
          const values = keys.map(k => input[k]);
          const sets = keys.map((k, i) => `${k}=$${i + 1}`);
          values.push(id, userId);
          const r = await db.query(
            `UPDATE public.custom_date_ideas SET ${sets.join(',')},updated_at=now() WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING *`,
            values,
          );
          return json({ ok: true, date_idea: r.rows[0] });
        }
        if (request.method === 'DELETE') {
          await db.query('DELETE FROM public.custom_date_ideas WHERE id=$1::uuid AND user_id=$2::uuid', [id, userId]);
          return json({ ok: true });
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      if (url.pathname === '/api/engagement/contests/me' && request.method === 'GET') {
        const type = url.searchParams.get('type');
        const period = cleanText(url.searchParams.get('period'), 16, true);
        if (!['monthly_love_notes', 'yearly_engagement'].includes(type)) return fail('Invalid contest type.');
        const email = String(auth.user.email || '').toLowerCase();
        if (!email) return json({ ok: true, participant: null });
        const r = await db.query(
          `SELECT * FROM public.contest_participants WHERE contest_type=$1 AND period=$2 AND lower(user_email)=$3 ORDER BY created_at ASC LIMIT 1`,
          [type, period, email],
        );
        return json({ ok: true, participant: r.rows[0] || null });
      }
      if (url.pathname === '/api/engagement/contests/join' && request.method === 'POST') {
        const input = await readJson(request);
        const type = input?.type;
        const period = cleanText(input?.period, 16, true);
        if (!['monthly_love_notes', 'yearly_engagement'].includes(type)) return fail('Invalid contest type.');
        const email = String(auth.user.email || '').trim().toLowerCase();
        if (!EMAIL.test(email)) return fail('Authenticated account does not have a valid email.', 409, 'missing_email');
        const r = await db.query(
          `INSERT INTO public.contest_participants(user_email,contest_type,period)
           VALUES($1,$2,$3)
           ON CONFLICT(user_email,contest_type,period) DO UPDATE SET updated_at=now()
           RETURNING *`,
          [email, type, period],
        );
        return json({ ok: true, participant: r.rows[0] }, 201);
      }

      return fail('Not found.', 404, 'not_found');
    });
  } catch (error) {
    console.error('Engagement API error:', error?.message || error);
    return fail(error?.message || 'Engagement request failed.', error?.status || 500, error?.code || 'engagement_error');
  }
}
