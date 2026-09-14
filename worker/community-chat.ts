// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
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
function cleanMessage(value) {
  const text = String(value || '').replace(/\r\n/g, '\n').trim();
  if (!text) throw new Error('Write a message before sending.');
  if (text.length > 2000) throw new Error('Messages can be up to 2,000 characters.');
  return text;
}
function isUuid(value) { return UUID.test(String(value || '')); }

async function listRooms(db) {
  const result = await db.query(`
    SELECT r.id,r.slug,r.name,r.description,r.icon,
           COALESCE(p.online_count,0)::int AS online_count,
           COALESCE(m.message_count,0)::int AS message_count
      FROM public.chat_rooms r
      LEFT JOIN (
        SELECT room_id,count(*) AS online_count
          FROM public.chat_room_presence
         WHERE last_seen > now() - interval '5 minutes'
         GROUP BY room_id
      ) p ON p.room_id=r.id
      LEFT JOIN (
        SELECT room_id,count(*) AS message_count
          FROM public.chat_room_messages
         WHERE is_deleted=false AND moderation_status='approved'
         GROUP BY room_id
      ) m ON m.room_id=r.id
     WHERE r.is_active=true
     ORDER BY r.created_at ASC,r.name ASC
  `);
  return result.rows;
}

async function listMessages(db, roomId, url) {
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get('limit') || 60)));
  const before = url.searchParams.get('before');
  const values = [roomId];
  let beforeClause = '';
  if (before) {
    values.push(before);
    beforeClause = `AND m.created_at < $${values.length}::timestamptz`;
  }
  values.push(limit);
  const result = await db.query(`
    SELECT * FROM (
      SELECT m.id,m.room_id,m.user_id,m.content,m.reply_to_id,m.edited_at,m.created_at,
             u.name AS author_name,u.avatar_url AS author_avatar
        FROM public.chat_room_messages m
        LEFT JOIN public.users u ON u.id=m.user_id
       WHERE m.room_id=$1::uuid
         AND m.is_deleted=false
         AND m.moderation_status='approved'
         ${beforeClause}
       ORDER BY m.created_at DESC,m.id DESC
       LIMIT $${values.length}
    ) q
    ORDER BY q.created_at ASC,q.id ASC
  `, values);
  return result.rows.map(row => ({
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    authorName: row.author_name || 'One2OneLove Member',
    authorAvatar: row.author_avatar || '',
    content: row.content,
    replyToId: row.reply_to_id,
    editedAt: row.edited_at,
    createdAt: row.created_at,
  }));
}

async function touchPresence(db, roomId, userId) {
  await db.query(`
    INSERT INTO public.chat_room_presence(room_id,user_id,last_seen)
    VALUES($1::uuid,$2::uuid,now())
    ON CONFLICT(room_id,user_id) DO UPDATE SET last_seen=EXCLUDED.last_seen
  `, [roomId, userId]);
}

export async function handleCommunityChatRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/community-chat')) return null;
  const auth = await session(request, env);

  try {
    return await withDb(env, async db => {
      if (url.pathname === '/api/community-chat/rooms' && request.method === 'GET') {
        return json({ ok: true, rooms: await listRooms(db) });
      }

      const messagesMatch = url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/messages$/i);
      if (messagesMatch) {
        const roomId = messagesMatch[1];
        const room = await db.query('SELECT id FROM public.chat_rooms WHERE id=$1::uuid AND is_active=true', [roomId]);
        if (!room.rowCount) return fail('Chat room not found.', 404, 'not_found');

        if (request.method === 'GET') {
          if (auth) await touchPresence(db, roomId, auth.user.id);
          return json({ ok: true, messages: await listMessages(db, roomId, url) });
        }

        if (request.method === 'POST') {
          if (!auth) return fail('Sign in to join the conversation.', 401, 'unauthorized');
          const input = await readJson(request);
          const content = cleanMessage(input.content);
          const replyToId = input.reply_to_id || null;
          if (replyToId && !isUuid(replyToId)) return fail('Invalid reply message.');
          if (replyToId) {
            const reply = await db.query(
              `SELECT 1 FROM public.chat_room_messages WHERE id=$1::uuid AND room_id=$2::uuid AND is_deleted=false`,
              [replyToId, roomId],
            );
            if (!reply.rowCount) return fail('Reply message not found.', 404, 'not_found');
          }

          const recent = await db.query(
            `SELECT created_at,content FROM public.chat_room_messages
              WHERE room_id=$1::uuid AND user_id=$2::uuid AND is_deleted=false
              ORDER BY created_at DESC LIMIT 1`,
            [roomId, auth.user.id],
          );
          if (recent.rows[0]) {
            const ageMs = Date.now() - new Date(recent.rows[0].created_at).getTime();
            if (ageMs < 1500) return fail('Please wait a moment before sending another message.', 429, 'rate_limited');
            if (recent.rows[0].content === content && ageMs < 30000) return fail('That message was already sent.', 409, 'duplicate_message');
          }

          const inserted = await db.query(`
            INSERT INTO public.chat_room_messages(room_id,user_id,content,reply_to_id,moderation_status)
            VALUES($1::uuid,$2::uuid,$3,$4::uuid,'approved')
            RETURNING id,room_id,user_id,content,reply_to_id,edited_at,created_at
          `, [roomId, auth.user.id, content, replyToId]);
          await touchPresence(db, roomId, auth.user.id);
          const profile = await db.query('SELECT name,avatar_url FROM public.users WHERE id=$1::uuid', [auth.user.id]);
          const row = inserted.rows[0];
          return json({ ok: true, message: {
            id: row.id,
            roomId: row.room_id,
            userId: row.user_id,
            authorName: profile.rows[0]?.name || auth.user.name || 'One2OneLove Member',
            authorAvatar: profile.rows[0]?.avatar_url || '',
            content: row.content,
            replyToId: row.reply_to_id,
            editedAt: row.edited_at,
            createdAt: row.created_at,
          } }, 201);
        }

        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      const presenceMatch = url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/presence$/i);
      if (presenceMatch && request.method === 'POST') {
        if (!auth) return fail('Authentication required.', 401, 'unauthorized');
        const roomId = presenceMatch[1];
        const room = await db.query('SELECT 1 FROM public.chat_rooms WHERE id=$1::uuid AND is_active=true', [roomId]);
        if (!room.rowCount) return fail('Chat room not found.', 404, 'not_found');
        await touchPresence(db, roomId, auth.user.id);
        return json({ ok: true });
      }

      const messageMatch = url.pathname.match(/^\/api\/community-chat\/messages\/([0-9a-f-]{36})$/i);
      if (messageMatch && request.method === 'DELETE') {
        if (!auth) return fail('Authentication required.', 401, 'unauthorized');
        const removed = await db.query(`
          UPDATE public.chat_room_messages
             SET is_deleted=true,updated_at=now()
           WHERE id=$1::uuid AND user_id=$2::uuid
           RETURNING id
        `, [messageMatch[1], auth.user.id]);
        return removed.rowCount ? json({ ok: true }) : fail('Message not found.', 404, 'not_found');
      }

      return fail('Community chat route not found.', 404, 'not_found');
    });
  } catch (error) {
    console.error('Community chat error:', error);
    return fail(error?.message || 'Community chat is temporarily unavailable.', error?.status || 500, error?.code || 'chat_error');
  }
}
