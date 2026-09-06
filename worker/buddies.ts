// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const SORT_FIELDS = new Set(['created_at', 'name', 'updated_at']);
const PUBLIC_USER_COLUMNS = 'id,name,email,avatar_url,bio,relationship_status,user_type,location,interests,partner_email,created_at';

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

async function listUsers(db, currentUserId, url) {
  const clauses = ['id<>$1::uuid', 'is_active=true'];
  const values = [currentUserId];
  const userType = url.searchParams.get('userType');
  if (userType) { values.push(userType); clauses.push(`user_type=$${values.length}`); }
  const search = (url.searchParams.get('search') || '').trim();
  if (search) {
    values.push(`%${search}%`);
    const p = `$${values.length}`;
    clauses.push(`(name ILIKE ${p} OR email ILIKE ${p} OR location ILIKE ${p} OR bio ILIKE ${p})`);
  }
  const sortBy = SORT_FIELDS.has(url.searchParams.get('sortBy')) ? url.searchParams.get('sortBy') : 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';
  const limitRaw = Number(url.searchParams.get('limit') || 100);
  const limit = Number.isInteger(limitRaw) ? Math.max(1, Math.min(limitRaw, 100)) : 100;
  const result = await db.query(`SELECT ${PUBLIC_USER_COLUMNS} FROM public.users WHERE ${clauses.join(' AND ')} ORDER BY ${sortBy} ${sortOrder},id ASC LIMIT ${limit}`, values);
  return result.rows;
}

async function requestList(db, userId, direction) {
  const idField = direction === 'received' ? 'to_user_id' : 'from_user_id';
  const otherField = direction === 'received' ? 'from_user_id' : 'to_user_id';
  const alias = direction === 'received' ? 'from_user' : 'to_user';
  const result = await db.query(
    `SELECT r.*, jsonb_build_object('id',u.id,'name',u.name,'email',u.email,'avatar_url',u.avatar_url,'bio',u.bio) AS ${alias}
     FROM public.buddy_requests r
     JOIN public.users u ON u.id=r.${otherField}
     WHERE r.${idField}=$1::uuid AND r.status='pending'
     ORDER BY r.created_at DESC`, [userId],
  );
  return result.rows;
}

async function buddies(db, userId) {
  const result = await db.query(
    `SELECT u.id,u.name,u.email,u.avatar_url,u.bio,u.relationship_status,u.location,
            r.id AS request_id,COALESCE(r.updated_at,r.created_at) AS connected_since,'active'::text AS status
     FROM public.buddy_requests r
     JOIN public.users u ON u.id=CASE WHEN r.from_user_id=$1::uuid THEN r.to_user_id ELSE r.from_user_id END
     WHERE r.status='accepted' AND (r.from_user_id=$1::uuid OR r.to_user_id=$1::uuid)
     ORDER BY connected_since DESC`, [userId],
  );
  return result.rows;
}

export async function handleBuddiesRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/buddies')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  try {
    return await withDb(env, async (db) => {
      const userMatch = url.pathname.match(/^\/api\/buddies\/users\/([0-9a-f-]{36})$/i);
      if (userMatch) {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        const result = await db.query(`SELECT ${PUBLIC_USER_COLUMNS} FROM public.users WHERE id=$1::uuid AND is_active=true`, [userMatch[1]]);
        return result.rows[0] ? json({ ok: true, user: result.rows[0] }) : fail('User not found.', 404, 'not_found');
      }
      if (url.pathname === '/api/buddies/users') {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        return json({ ok: true, users: await listUsers(db, auth.user.id, url) });
      }
      const requestMatch = url.pathname.match(/^\/api\/buddies\/requests\/([0-9a-f-]{36})$/i);
      if (requestMatch) {
        const requestId = requestMatch[1];
        if (request.method === 'DELETE') {
          const result = await db.query(`DELETE FROM public.buddy_requests WHERE id=$1::uuid AND from_user_id=$2::uuid AND status='pending' RETURNING id`, [requestId, auth.user.id]);
          return result.rowCount ? json({ ok: true }) : fail('Pending request not found.', 404, 'not_found');
        }
        if (request.method === 'PATCH') {
          const input = await body(request);
          const action = String(input.action || '');
          if (!['accept', 'reject'].includes(action)) return fail('Invalid buddy request action.');
          const status = action === 'accept' ? 'accepted' : 'rejected';
          const result = await db.query(
            `UPDATE public.buddy_requests SET status=$1,updated_at=now()
             WHERE id=$2::uuid AND to_user_id=$3::uuid AND status='pending' RETURNING *`,
            [status, requestId, auth.user.id],
          );
          return result.rows[0] ? json({ ok: true, request: result.rows[0] }) : fail('Pending request not found.', 404, 'not_found');
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      if (url.pathname === '/api/buddies/requests') {
        if (request.method === 'GET') {
          const direction = url.searchParams.get('direction') === 'received' ? 'received' : 'sent';
          return json({ ok: true, requests: await requestList(db, auth.user.id, direction) });
        }
        if (request.method === 'POST') {
          const input = await body(request);
          const toUserId = String(input.to_user_id || '');
          if (!/^[0-9a-f-]{36}$/i.test(toUserId)) return fail('Invalid buddy user ID.');
          if (toUserId === auth.user.id) return fail('You cannot send a buddy request to yourself.');
          const target = await db.query('SELECT id FROM public.users WHERE id=$1::uuid AND is_active=true', [toUserId]);
          if (!target.rowCount) return fail('User not found.', 404, 'not_found');
          const existing = await db.query(
            `SELECT id,status FROM public.buddy_requests
             WHERE (from_user_id=$1::uuid AND to_user_id=$2::uuid) OR (from_user_id=$2::uuid AND to_user_id=$1::uuid)
             ORDER BY created_at DESC LIMIT 1`, [auth.user.id, toUserId],
          );
          if (existing.rows[0]?.status === 'pending') return fail('A buddy request already exists.', 409, 'conflict');
          if (existing.rows[0]?.status === 'accepted') return fail('You are already buddies.', 409, 'conflict');
          if (existing.rows[0]) {
            const result = await db.query(
              `UPDATE public.buddy_requests SET from_user_id=$1::uuid,to_user_id=$2::uuid,status='pending',updated_at=now()
               WHERE id=$3::uuid RETURNING *`, [auth.user.id, toUserId, existing.rows[0].id],
            );
            return json({ ok: true, request: result.rows[0] }, 201);
          }
          const result = await db.query(
            `INSERT INTO public.buddy_requests (from_user_id,to_user_id,status) VALUES ($1::uuid,$2::uuid,'pending') RETURNING *`,
            [auth.user.id, toUserId],
          );
          return json({ ok: true, request: result.rows[0] }, 201);
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      if (url.pathname === '/api/buddies') {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        return json({ ok: true, buddies: await buddies(db, auth.user.id) });
      }
      return fail('Buddy route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove buddy API error', err);
    return fail(err?.message || 'Unable to process buddy request.', 400, 'buddy_error');
  }
}
