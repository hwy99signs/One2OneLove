// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const EVENT_TYPES = new Set(['date', 'anniversary', 'milestone', 'reminder', 'appointment', 'activity', 'other']);
const RECURRENCE = new Set(['daily', 'weekly', 'monthly', 'yearly']);
const SORT_FIELDS = new Set(['event_date', 'event_time', 'created_at', 'updated_at', 'title', 'event_type']);
const WRITE_FIELDS = new Set([
  'title', 'description', 'event_date', 'event_time', 'event_type', 'location', 'notes', 'color',
  'reminder_enabled', 'reminder_days_before', 'is_recurring', 'recurrence_pattern',
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
  try { return await fn(db); } finally { await db.end(); }
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}
function text(value, max = 5000, required = false) {
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
  for (const [key, value] of Object.entries(body || {})) if (WRITE_FIELDS.has(key)) out[key] = value;
  if (!partial) {
    out.title = text(out.title, 250, true);
    out.event_date = text(out.event_date, 10, true);
    out.event_type = out.event_type || 'other';
    out.color = out.color || 'pink';
    out.reminder_enabled = out.reminder_enabled !== false;
    out.reminder_days_before = Number.isFinite(Number(out.reminder_days_before)) ? Number(out.reminder_days_before) : 1;
    out.is_recurring = Boolean(out.is_recurring);
    out.recurrence_pattern = out.recurrence_pattern || null;
  } else if ('title' in out) out.title = text(out.title, 250, true);
  if ('description' in out) out.description = text(out.description, 5000);
  if ('location' in out) out.location = text(out.location, 1000);
  if ('notes' in out) out.notes = text(out.notes, 10000);
  if ('color' in out) out.color = text(out.color, 50, true);
  if ('event_type' in out && !EVENT_TYPES.has(out.event_type)) throw new Error('Invalid event type.');
  if ('recurrence_pattern' in out && out.recurrence_pattern && !RECURRENCE.has(out.recurrence_pattern)) throw new Error('Invalid recurrence pattern.');
  if ('reminder_enabled' in out) out.reminder_enabled = Boolean(out.reminder_enabled);
  if ('is_recurring' in out) out.is_recurring = Boolean(out.is_recurring);
  if ('reminder_days_before' in out) {
    const days = Number(out.reminder_days_before);
    if (!Number.isInteger(days) || days < 0) throw new Error('Invalid reminder days.');
    out.reminder_days_before = days;
  }
  if ('event_time' in out && out.event_time === '') out.event_time = null;
  if ('recurrence_pattern' in out && out.recurrence_pattern === '') out.recurrence_pattern = null;
  return out;
}

async function listEvents(db, userId, url) {
  const clauses = ['user_id=$1::uuid'];
  const values = [userId];
  const add = (sql, value) => { values.push(value); clauses.push(sql.replace('?', `$${values.length}`)); };
  if (url.searchParams.get('eventType')) add('event_type=?', url.searchParams.get('eventType'));
  if (url.searchParams.get('startDate')) add('event_date>=?::date', url.searchParams.get('startDate'));
  if (url.searchParams.get('endDate')) add('event_date<=?::date', url.searchParams.get('endDate'));
  const sortBy = SORT_FIELDS.has(url.searchParams.get('sortBy')) ? url.searchParams.get('sortBy') : 'event_date';
  const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';
  const rawLimit = Number(url.searchParams.get('limit') || 0);
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : null;
  const timeSort = sortBy === 'event_date' ? ', event_time ASC NULLS LAST' : '';
  const limitSql = limit ? ` LIMIT ${limit}` : '';
  const result = await db.query(
    `SELECT * FROM public.calendar_events WHERE ${clauses.join(' AND ')} ORDER BY ${sortBy} ${sortOrder}${timeSort}, id ASC${limitSql}`,
    values,
  );
  return result.rows;
}

async function insertEvent(db, userId, body) {
  const fields = normalize(body, false);
  const columns = ['user_id'];
  const values = [userId];
  const params = ['$1::uuid'];
  for (const [key, value] of Object.entries(fields)) {
    columns.push(key); values.push(value); params.push(`$${values.length}`);
  }
  const result = await db.query(
    `INSERT INTO public.calendar_events (${columns.join(',')}) VALUES (${params.join(',')}) RETURNING *`,
    values,
  );
  return result.rows[0];
}

async function updateEvent(db, userId, eventId, body) {
  const fields = normalize(body, true);
  if (!Object.keys(fields).length) throw new Error('No event updates were provided.');
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    values.push(value); sets.push(`${key}=$${values.length}`);
  }
  values.push(eventId, userId);
  const result = await db.query(
    `UPDATE public.calendar_events SET ${sets.join(',')},updated_at=now()
     WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING *`,
    values,
  );
  return result.rows[0] || null;
}

export async function handleCalendarRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/calendar-events')) return null;
  const auth = await getSession(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  try {
    return await withDb(env, async (db) => {
      const itemMatch = url.pathname.match(/^\/api\/calendar-events\/([0-9a-f-]{36})$/i);
      if (itemMatch) {
        const eventId = itemMatch[1];
        if (request.method === 'GET') {
          const result = await db.query('SELECT * FROM public.calendar_events WHERE id=$1::uuid AND user_id=$2::uuid', [eventId, auth.user.id]);
          return result.rows[0] ? json({ ok: true, event: result.rows[0] }) : fail('Event not found.', 404, 'not_found');
        }
        if (request.method === 'PATCH') {
          const event = await updateEvent(db, auth.user.id, eventId, await readJson(request));
          return event ? json({ ok: true, event }) : fail('Event not found.', 404, 'not_found');
        }
        if (request.method === 'DELETE') {
          const result = await db.query('DELETE FROM public.calendar_events WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id', [eventId, auth.user.id]);
          return result.rowCount ? json({ ok: true }) : fail('Event not found.', 404, 'not_found');
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      if (url.pathname === '/api/calendar-events') {
        if (request.method === 'GET') return json({ ok: true, events: await listEvents(db, auth.user.id, url) });
        if (request.method === 'POST') return json({ ok: true, event: await insertEvent(db, auth.user.id, await readJson(request)) }, 201);
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      return fail('Calendar route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove calendar API error', err);
    return fail(err?.message || 'Unable to process calendar request.', 400, 'calendar_error');
  }
}
