// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const TYPES = new Set(['first_date', 'first_kiss', 'first_love', 'moving_in', 'engagement', 'wedding', 'anniversary', 'first_vacation', 'met_family', 'custom']);
const SORT_FIELDS = new Set(['date', 'created_at', 'updated_at', 'title', 'milestone_type']);
const WRITE_FIELDS = new Set(['title', 'milestone_type', 'date', 'description', 'location', 'partner_email', 'media_urls', 'is_recurring', 'reminder_enabled', 'reminder_days_before', 'celebration_ideas', 'celebration_completed']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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
function text(value, max, required = false) {
  if (value == null) { if (required) throw new Error('Required value is missing.'); return null; }
  const out = String(value).trim();
  if (required && !out) throw new Error('Required value is empty.');
  if (out.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return out || null;
}
function textArray(value, maxItems = 50, maxLength = 1000) {
  return Array.isArray(value) ? value.slice(0, maxItems).map((item) => text(item, maxLength, true)) : [];
}
function normalize(input, partial = false) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) if (WRITE_FIELDS.has(key)) out[key] = value;
  if (!partial) {
    out.title = text(out.title, 300, true);
    out.milestone_type = out.milestone_type || 'custom';
    out.date = text(out.date, 10, true);
    out.media_urls = textArray(out.media_urls, 50, 2000);
    out.is_recurring = Boolean(out.is_recurring);
    out.reminder_enabled = out.reminder_enabled !== false;
    out.reminder_days_before = Number.isInteger(Number(out.reminder_days_before)) ? Number(out.reminder_days_before) : 7;
    out.celebration_ideas = textArray(out.celebration_ideas, 50, 1000);
    out.celebration_completed = Boolean(out.celebration_completed);
  } else {
    if ('title' in out) out.title = text(out.title, 300, true);
    if ('date' in out) out.date = text(out.date, 10, true);
    if ('media_urls' in out) out.media_urls = textArray(out.media_urls, 50, 2000);
    if ('celebration_ideas' in out) out.celebration_ideas = textArray(out.celebration_ideas, 50, 1000);
    if ('is_recurring' in out) out.is_recurring = Boolean(out.is_recurring);
    if ('reminder_enabled' in out) out.reminder_enabled = Boolean(out.reminder_enabled);
    if ('celebration_completed' in out) out.celebration_completed = Boolean(out.celebration_completed);
  }
  if ('description' in out) out.description = text(out.description, 10000);
  if ('location' in out) out.location = text(out.location, 1000);
  if ('partner_email' in out) out.partner_email = text(out.partner_email, 320);
  if ('milestone_type' in out && !TYPES.has(out.milestone_type)) throw new Error('Invalid milestone type.');
  if ('reminder_days_before' in out) {
    const days = Number(out.reminder_days_before);
    if (!Number.isInteger(days) || days < 0) throw new Error('Invalid reminder days.');
    out.reminder_days_before = days;
  }
  return out;
}

async function list(db, userId, url) {
  const clauses = ['user_id=$1::uuid'];
  const values = [userId];
  const add = (fragment, value) => { values.push(value); clauses.push(fragment.replace('?', `$${values.length}`)); };
  if (url.searchParams.get('type')) add('milestone_type=?', url.searchParams.get('type'));
  if (url.searchParams.get('startDate')) add('date>=?::date', url.searchParams.get('startDate'));
  if (url.searchParams.get('endDate')) add('date<=?::date', url.searchParams.get('endDate'));
  if (url.searchParams.get('recurring') === 'true') clauses.push('is_recurring=true');
  if (url.searchParams.get('recurring') === 'false') clauses.push('is_recurring=false');
  const order = url.searchParams.get('order') || '-date';
  const desc = order.startsWith('-');
  const field = order.replace(/^-/, '');
  const sort = SORT_FIELDS.has(field) ? field : 'date';
  const result = await db.query(`SELECT * FROM public.relationship_milestones WHERE ${clauses.join(' AND ')} ORDER BY ${sort} ${desc ? 'DESC' : 'ASC'},id ASC`, values);
  return result.rows;
}

async function create(db, userId, input) {
  const data = normalize(input, false);
  const result = await db.query(
    `INSERT INTO public.relationship_milestones
      (user_id,title,milestone_type,date,description,location,partner_email,media_urls,is_recurring,reminder_enabled,reminder_days_before,celebration_ideas,celebration_completed)
     VALUES ($1::uuid,$2,$3,$4::date,$5,$6,$7,$8::text[],$9,$10,$11,$12::text[],$13) RETURNING *`,
    [userId, data.title, data.milestone_type, data.date, data.description, data.location, data.partner_email, data.media_urls, data.is_recurring, data.reminder_enabled, data.reminder_days_before, data.celebration_ideas, data.celebration_completed],
  );
  return result.rows[0];
}

async function update(db, userId, milestoneId, input) {
  const data = normalize(input, true);
  if (!Object.keys(data).length) throw new Error('No milestone updates were provided.');
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) { values.push(value); sets.push(`${key}=$${values.length}`); }
  values.push(milestoneId, userId);
  const result = await db.query(
    `UPDATE public.relationship_milestones SET ${sets.join(',')},updated_at=now()
     WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING *`, values,
  );
  return result.rows[0] || null;
}

function mediaKey(userId, fileId) { return `milestones/${userId}/${fileId}`; }

async function serveMedia(request, env, url) {
  const match = url.pathname.match(/^\/api\/media\/milestones\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/i);
  if (!match) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return fail('Method not allowed.', 405, 'method_not_allowed');
  const object = await env.MEDIA.get(mediaKey(match[1], match[2]));
  if (!object) return fail('Milestone photo not found.', 404, 'not_found');
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public,max-age=3600');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

export async function handleMilestonesRequest(request, env, url) {
  const publicMedia = await serveMedia(request, env, url);
  if (publicMedia) return publicMedia;
  if (!url.pathname.startsWith('/api/milestones')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  try {
    if (url.pathname === '/api/milestones/media' && (request.method === 'POST' || request.method === 'PUT')) {
      const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!IMAGE_TYPES.has(contentType)) return fail('Milestone photo must be JPEG, PNG, WebP, or GIF.');
      const sizeHeader = Number(request.headers.get('content-length') || 0);
      if (sizeHeader > MAX_IMAGE_BYTES) return fail('Milestone photo must be 10MB or smaller.', 413, 'file_too_large');
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) return fail('Milestone photo must be between 1 byte and 10MB.', 413, 'file_too_large');
      const milestoneId = url.searchParams.get('milestoneId');
      if (milestoneId) {
        const owned = await withDb(env, (db) => db.query('SELECT 1 FROM public.relationship_milestones WHERE id=$1::uuid AND user_id=$2::uuid', [milestoneId, auth.user.id]));
        if (!owned.rowCount) return fail('Milestone not found.', 404, 'not_found');
      }
      const fileId = crypto.randomUUID();
      await env.MEDIA.put(mediaKey(auth.user.id, fileId), bytes, { httpMetadata: { contentType }, customMetadata: { ownerUserId: auth.user.id, milestoneId: milestoneId || '' } });
      return json({ ok: true, url: `/api/media/milestones/${auth.user.id}/${fileId}` }, 201);
    }
    const mediaDelete = url.pathname.match(/^\/api\/milestones\/media\/([0-9a-f-]{36})$/i);
    if (mediaDelete) {
      if (request.method !== 'DELETE') return fail('Method not allowed.', 405, 'method_not_allowed');
      await env.MEDIA.delete(mediaKey(auth.user.id, mediaDelete[1]));
      return json({ ok: true });
    }
    return await withDb(env, async (db) => {
      const item = url.pathname.match(/^\/api\/milestones\/([0-9a-f-]{36})$/i);
      if (item) {
        if (request.method === 'GET') {
          const result = await db.query('SELECT * FROM public.relationship_milestones WHERE id=$1::uuid AND user_id=$2::uuid', [item[1], auth.user.id]);
          return result.rows[0] ? json({ ok: true, milestone: result.rows[0] }) : fail('Milestone not found.', 404, 'not_found');
        }
        if (request.method === 'PATCH') {
          const milestone = await update(db, auth.user.id, item[1], await readJson(request));
          return milestone ? json({ ok: true, milestone }) : fail('Milestone not found.', 404, 'not_found');
        }
        if (request.method === 'DELETE') {
          const result = await db.query('DELETE FROM public.relationship_milestones WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id', [item[1], auth.user.id]);
          return result.rowCount ? json({ ok: true }) : fail('Milestone not found.', 404, 'not_found');
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      if (url.pathname === '/api/milestones') {
        if (request.method === 'GET') return json({ ok: true, milestones: await list(db, auth.user.id, url) });
        if (request.method === 'POST') return json({ ok: true, milestone: await create(db, auth.user.id, await readJson(request)) }, 201);
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      return fail('Milestone route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove milestone API error', err);
    return fail(err?.message || 'Unable to process milestone request.', 400, 'milestone_error');
  }
}
