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
// Chatrooms display FIRST NAMES ONLY (owner rule, 2026-10-09): the API
// never sends a member's full name to other chatters. An email-shaped
// name is not a name at all — it yields '' and callers use the fallback.
function firstNameOf(name) {
  const token = String(name || '').trim().split(/\s+/)[0] || '';
  return token.includes('@') ? '' : token;
}
// No first name on file -> the chatter is shown as a numbered visitor
// (owner rule, 2026-10-09). Numbers come from a REAL COUNTER the site
// hands out in order and stores (public.chat_visitor_numbers): the first
// time a nameless chatter's name would display, the next number is
// assigned and kept forever — unique per person, in handout order.
// Existing chatters are covered because names are computed when
// messages are read, not stored on the messages themselves.
let visitorNumbersSchemaReady = false;
async function ensureVisitorNumbersSchema(db) {
  if (visitorNumbersSchemaReady) return;
  await ensureDdl(db, `CREATE SEQUENCE IF NOT EXISTS public.chat_visitor_number_seq`);
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.chat_visitor_numbers (
      user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
      visitor_number bigint NOT NULL UNIQUE DEFAULT nextval('public.chat_visitor_number_seq'),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  visitorNumbersSchemaReady = true;
}
async function visitorNumbersFor(db, userIds) {
  const labels = new Map();
  const ids = [...new Set((userIds || []).map(v => String(v || '')).filter(Boolean))];
  if (!ids.length) return labels;
  try {
    await ensureVisitorNumbersSchema(db);
    await db.query(
      `INSERT INTO public.chat_visitor_numbers(user_id)
         SELECT v FROM unnest($1::uuid[]) AS v
         ON CONFLICT (user_id) DO NOTHING`,
      [ids],
    );
    const found = await db.query(
      `SELECT user_id,visitor_number FROM public.chat_visitor_numbers WHERE user_id = ANY($1::uuid[])`,
      [ids],
    );
    for (const row of found.rows) labels.set(String(row.user_id), 'Visitor #' + Number(row.visitor_number));
  } catch { /* counter store unreachable — callers use the derived fallback */ }
  return labels;
}
// Emergency fallback ONLY (counter store unreachable): a stable number
// derived from the user ID. Never stored, never the primary scheme.
function derivedVisitorLabel(userId) {
  const hex = String(userId || '').replace(/[^0-9a-f]/gi, '');
  const n = hex ? parseInt(hex.slice(0, 8), 16) % 100000 : 0;
  return 'Visitor #' + String(n).padStart(5, '0');
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
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
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
function cleanReportReason(value) {
  const text = String(value || '').trim();
  if (text.length < 3) throw new Error('Please provide a reason for the report.');
  if (text.length > 500) throw new Error('Report reason can be up to 500 characters.');
  return text;
}

// Schema bootstrap is idempotent DDL; running it on every request cost 9
// statements per chat poll and was the largest single driver of the Oct 7
// Hyperdrive query burn. Run it once per isolate instead (same pattern as
// worker/feature-usage.ts interactionSchemaReady); the flag is only set
// after every statement succeeds, so a failure retries on the next request.
let chatSafetySchemaReady = false;

// Lazy-ensure DDL tolerance (2026-10-08): on the preview database the
// connecting role does not own the pre-existing tables, so an ensure DDL
// statement against an object that is already in shape can fail with 42501
// (must be owner). The full DDL set is pre-applied by the table owner via
// preview-schema-preapply.sql; here, skip ONLY the benign already-in-shape
// codes (42501 insufficient_privilege, 42701 duplicate_column, 42P07
// duplicate_table) per statement and continue. Any other error still throws,
// and the DML that follows surfaces a genuinely missing object loudly.
const TOLERATED_DDL_CODES = new Set(['42501', '42701', '42P07']);
async function ensureDdl(db, sql) {
  try { await db.query(sql); }
  catch (err) { if (!TOLERATED_DDL_CODES.has(err?.code)) throw err; }
}

async function ensureChatSafetySchema(db) {
  if (chatSafetySchemaReady) return;
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.chat_room_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
      message_id uuid NOT NULL REFERENCES public.chat_room_messages(id) ON DELETE CASCADE,
      reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      reported_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      reason text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      reviewed_at timestamptz,
      reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
      UNIQUE(message_id, reporter_id)
    )
  `);
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.chat_room_topics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
      creator_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      title text NOT NULL,
      is_locked boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await ensureDdl(db, `
    ALTER TABLE public.chat_room_messages
    ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.chat_room_topics(id) ON DELETE SET NULL
  `);
  await ensureDdl(db, `
    CREATE INDEX IF NOT EXISTS idx_chat_room_topics_room_created
      ON public.chat_room_topics(room_id,created_at DESC)
  `);
  await ensureDdl(db, `
    CREATE INDEX IF NOT EXISTS idx_chat_room_messages_topic
      ON public.chat_room_messages(topic_id,created_at)
  `);
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.chat_user_mutes (
      owner_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      muted_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(owner_user_id, muted_user_id)
    )
  `);
  await db.query(`
    INSERT INTO public.chat_rooms(id,slug,name,description,icon,is_active,created_at)
    SELECT gen_random_uuid(),'lgbtq-community','LGBTQ+ Community Chat',
           'A dedicated LGBTQ+ community space for support, connection and respectful conversation.',
           '🏳️‍🌈',true,now()
     WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE slug='lgbtq-community')
  `);
  await db.query(`
    INSERT INTO public.chat_rooms(id,slug,name,description,icon,is_active,created_at)
    SELECT gen_random_uuid(),'studio-who-should-apologize-first','O2OL Studio — Who Should Apologize First?',
           'Discuss Season 1, Episode 1 and share your perspective after watching O2OL and Bianca.',
           '🎬',true,now()
     WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE slug='studio-who-should-apologize-first')
  `);
  await db.query(`
    INSERT INTO public.chat_rooms(id,slug,name,description,icon,is_active,created_at)
    SELECT gen_random_uuid(),'studio-who-pays-for-the-first-date','O2OL Studio — Who Pays for the First Date?',
           'Discuss Season 1, Episode 2 and share your perspective after watching the new O2OL Studio show.',
           '🎬',true,now()
     WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE slug='studio-who-pays-for-the-first-date')
  `);
  await db.query(`
    INSERT INTO public.chat_rooms(id,slug,name,description,icon,is_active,created_at)
    SELECT gen_random_uuid(),'relationship-100','Relationship 100 — What Matters Most in Your Relationship?',
           'What matters most in YOUR relationship? Divide 100% across money, communication, intimacy, faith and more — then see how everyone else divided theirs. Voting closes Wednesday, October 7 at midnight CT · Results revealed Friday, October 9',
           '💯',true,now()
     WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE slug='relationship-100')
  `);
  chatSafetySchemaReady = true;
}

async function listRooms(db, scope = 'general') {
  const result = await db.query(`
    SELECT r.id,r.slug,r.name,r.description,r.icon,
           COALESCE(p.online_count,0)::int AS online_count,
           COALESCE(m.message_count,0)::int AS message_count
      FROM public.chat_rooms r
      LEFT JOIN (
        SELECT room_id,count(*) AS online_count
          FROM public.chat_room_presence
         WHERE last_seen > now() - interval '60 seconds'
         GROUP BY room_id
      ) p ON p.room_id=r.id
      LEFT JOIN (
        SELECT room_id,count(*) AS message_count
          FROM public.chat_room_messages
         WHERE is_deleted=false AND moderation_status='approved'
         GROUP BY room_id
      ) m ON m.room_id=r.id
     WHERE r.is_active=true
       AND (
         ($1='lgbtq' AND r.slug='lgbtq-community')
         OR
         ($1<>'lgbtq' AND r.slug<>'lgbtq-community')
       )
     ORDER BY r.created_at ASC,r.name ASC
  `, [scope]);
  return result.rows;
}

async function listMessages(db, roomId, url, viewerId = null) {
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get('limit') || 60)));
  const before = url.searchParams.get('before');
  const topicId = url.searchParams.get('topic');
  const values = [roomId];
  let beforeClause = '';
  let topicClause = '';
  if (topicId) {
    if (!isUuid(topicId)) throw Object.assign(new Error('Invalid chat topic.'), { status: 400, code: 'invalid_topic' });
    values.push(topicId);
    topicClause = `AND m.topic_id=${values.length}::uuid`;
  }
  if (before) {
    values.push(before);
    beforeClause = `AND m.created_at < $${values.length}::timestamptz`;
  }
  values.push(limit);
  const result = await db.query(`
    SELECT * FROM (
      SELECT m.id,m.room_id,m.user_id,m.content,m.reply_to_id,m.topic_id,m.edited_at,m.created_at,
             u.name AS author_name,u.avatar_url AS author_avatar
        FROM public.chat_room_messages m
        LEFT JOIN public.users u ON u.id=m.user_id
       WHERE m.room_id=$1::uuid
         AND m.is_deleted=false
         AND m.moderation_status='approved'
         ${topicClause}
         ${beforeClause}
       ORDER BY m.created_at DESC,m.id DESC
       LIMIT $${values.length}
    ) q
    ORDER BY q.created_at ASC,q.id ASC
  `, values);
  let rows = result.rows;
  if (viewerId) {
    const muted = await db.query(
      'SELECT muted_user_id FROM public.chat_user_mutes WHERE owner_user_id=$1::uuid',
      [viewerId],
    );
    const mutedIds = new Set(muted.rows.map(row => String(row.muted_user_id)));
    rows = rows.filter(row => !mutedIds.has(String(row.user_id)));
  }
  const numberLabels = await visitorNumbersFor(db, rows.filter(row => !firstNameOf(row.author_name)).map(row => row.user_id));
  return rows.map(row => ({
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    authorName: firstNameOf(row.author_name) || numberLabels.get(String(row.user_id)) || derivedVisitorLabel(row.user_id),
    authorAvatar: row.author_avatar || '',
    content: row.content,
    replyToId: row.reply_to_id,
    topicId: row.topic_id,
    editedAt: row.edited_at,
    createdAt: row.created_at,
  }));
}

// Presence lifecycle (chat-close rule, Oct 7): a member is "in" a room only
// while their presence row is fresh. The client heartbeat runs every 45 s
// (src/pages/Chat.jsx), so occupancy counts rows seen within the last
// 60 seconds — one beat plus grace; two missed beats and the member is
// gone. Leaving is normally explicit: the client calls the /leave route
// below (including via sendBeacon on pagehide) and the row is deleted at
// once, so an emptied room closes immediately instead of lingering for
// the TTL. The TTL only covers exits the leave signal never survives
// (crash, killed tab, lost network). Expired rows are never counted and
// are overwritten on rejoin; no sweeper query runs for them, so a dormant
// room costs zero queries.
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
      await ensureChatSafetySchema(db);

      if (url.pathname === '/api/community-chat/rooms' && request.method === 'GET') {
        const scope = url.searchParams.get('scope') === 'lgbtq' ? 'lgbtq' : 'general';
        return json({ ok: true, rooms: await listRooms(db, scope) });
      }

      const topicsMatch = url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/topics$/i);
      if (topicsMatch) {
        const roomId = topicsMatch[1];
        const room = await db.query('SELECT id,slug FROM public.chat_rooms WHERE id=$1::uuid AND is_active=true', [roomId]);
        if (!room.rowCount) return fail('Chat room not found.', 404, 'not_found');
        if (room.rows[0].slug !== 'lgbtq-community') return fail('Topics are available in the LGBTQ+ community room.', 403, 'forbidden');

        if (request.method === 'GET') {
          const result = await db.query(`
            SELECT t.id,t.room_id,t.creator_id,t.title,t.is_locked,t.created_at,t.updated_at,
                   COALESCE(u.name,'One2OneLove Member') AS creator_name,
                   count(m.id) FILTER (WHERE m.is_deleted=false AND m.moderation_status='approved')::int AS message_count
              FROM public.chat_room_topics t
              LEFT JOIN public.users u ON u.id=t.creator_id
              LEFT JOIN public.chat_room_messages m ON m.topic_id=t.id
             WHERE t.room_id=$1::uuid
             GROUP BY t.id,u.name
             ORDER BY t.updated_at DESC,t.created_at DESC
          `, [roomId]);
          return json({ ok:true, topics:result.rows.map(row => ({
            id:row.id, roomId:row.room_id, creatorId:row.creator_id, creatorName:row.creator_name,
            title:row.title, isLocked:row.is_locked, messageCount:row.message_count,
            createdAt:row.created_at, updatedAt:row.updated_at,
          })) });
        }

        if (request.method === 'POST') {
          if (!auth) return fail('Sign in to start a chat topic.', 401, 'unauthorized');
          const input = await readJson(request);
          const title = String(input?.title || '').trim();
          if (title.length < 3) return fail('Topic title must be at least 3 characters.', 400, 'invalid_topic_title');
          if (title.length > 160) return fail('Topic title can be up to 160 characters.', 400, 'invalid_topic_title');
          const opening = String(input?.opening_message || '').trim();
          if (opening.length > 2000) return fail('Opening message can be up to 2,000 characters.', 400, 'invalid_opening_message');

          await db.query('BEGIN');
          try {
            const created = await db.query(`
              INSERT INTO public.chat_room_topics(room_id,creator_id,title)
              VALUES($1::uuid,$2::uuid,$3)
              RETURNING *
            `, [roomId,auth.user.id,title]);

            if (opening) {
              await db.query(`
                INSERT INTO public.chat_room_messages(room_id,user_id,content,topic_id,moderation_status)
                VALUES($1::uuid,$2::uuid,$3,$4::uuid,'approved')
              `, [roomId,auth.user.id,opening,created.rows[0].id]);
            }
            await touchPresence(db,roomId,auth.user.id);
            await db.query('COMMIT');
            const row=created.rows[0];
            return json({ ok:true, topic:{
              id:row.id, roomId:row.room_id, creatorId:row.creator_id, title:row.title,
              isLocked:row.is_locked, messageCount:opening?1:0, createdAt:row.created_at, updatedAt:row.updated_at,
            }},201);
          } catch (error) {
            await db.query('ROLLBACK').catch(()=>{});
            throw error;
          }
        }

        return fail('Method not allowed.',405,'method_not_allowed');
      }

      const messagesMatch = url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/messages$/i);
      if (messagesMatch) {
        const roomId = messagesMatch[1];
        const room = await db.query('SELECT id FROM public.chat_rooms WHERE id=$1::uuid AND is_active=true', [roomId]);
        if (!room.rowCount) return fail('Chat room not found.', 404, 'not_found');

        if (request.method === 'GET') {
          if (auth) await touchPresence(db, roomId, auth.user.id);
          return json({ ok: true, messages: await listMessages(db, roomId, url, auth?.user?.id || null) });
        }

        if (request.method === 'POST') {
          if (!auth) return fail('Sign in to join the conversation.', 401, 'unauthorized');
          const input = await readJson(request);
          const content = cleanMessage(input.content);
          const replyToId = input.reply_to_id || null;
          const topicId = input.topic_id || null;
          if (topicId && !isUuid(topicId)) return fail('Invalid chat topic.', 400, 'invalid_topic');
          if (topicId) {
            const topic = await db.query(
              'SELECT id,is_locked FROM public.chat_room_topics WHERE id=$1::uuid AND room_id=$2::uuid',
              [topicId,roomId],
            );
            if (!topic.rowCount) return fail('Chat topic not found.',404,'not_found');
            if (topic.rows[0].is_locked) return fail('This chat topic is locked.',403,'forbidden');
          }
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
            INSERT INTO public.chat_room_messages(room_id,user_id,content,reply_to_id,topic_id,moderation_status)
            VALUES($1::uuid,$2::uuid,$3,$4::uuid,$5::uuid,'approved')
            RETURNING id,room_id,user_id,content,reply_to_id,topic_id,edited_at,created_at
          `, [roomId, auth.user.id, content, replyToId, topicId]);
          if (topicId) await db.query('UPDATE public.chat_room_topics SET updated_at=now() WHERE id=$1::uuid', [topicId]);
          await touchPresence(db, roomId, auth.user.id);
          const profile = await db.query('SELECT name,avatar_url FROM public.users WHERE id=$1::uuid', [auth.user.id]);
          const row = inserted.rows[0];
          const firstName = firstNameOf(profile.rows[0]?.name || auth.user.name);
          const ownNumber = firstName ? null : await visitorNumbersFor(db, [auth.user.id]);
          const displayName = firstName || ownNumber?.get(String(auth.user.id)) || derivedVisitorLabel(auth.user.id);
          return json({ ok: true, message: {
            id: row.id,
            roomId: row.room_id,
            userId: row.user_id,
            authorName: displayName,
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

      // Explicit leave: stepping out closes the chat for this member. The
      // presence row is deleted in one statement, so occupancy drops to
      // zero the moment the last member leaves. Deliberately no room
      // existence check — leaving must succeed even if the room was
      // deactivated, and an idempotent no-op DELETE keeps the exit path
      // (often a sendBeacon during page teardown) as cheap as possible.
      const leaveMatch = url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/leave$/i);
      if (leaveMatch && request.method === 'POST') {
        if (!auth) return fail('Authentication required.', 401, 'unauthorized');
        await db.query(
          'DELETE FROM public.chat_room_presence WHERE room_id=$1::uuid AND user_id=$2::uuid',
          [leaveMatch[1], auth.user.id],
        );
        return json({ ok: true });
      }

      const reportMatch = url.pathname.match(/^\/api\/community-chat\/messages\/([0-9a-f-]{36})\/report$/i);
      if (reportMatch && request.method === 'POST') {
        if (!auth) return fail('Authentication required.', 401, 'unauthorized');
        const input = await readJson(request);
        const reason = cleanReportReason(input.reason);
        const message = await db.query(
          `SELECT m.id,m.room_id,m.user_id,r.slug
             FROM public.chat_room_messages m
             JOIN public.chat_rooms r ON r.id=m.room_id
            WHERE m.id=$1::uuid AND m.is_deleted=false`,
          [reportMatch[1]],
        );
        const row = message.rows[0];
        if (!row) return fail('Message not found.', 404, 'not_found');
        if (String(row.user_id) === String(auth.user.id)) return fail('You cannot report your own message.', 400, 'invalid_report');

        await db.query(
          `INSERT INTO public.chat_room_reports(room_id,message_id,reporter_id,reported_user_id,reason,status)
           VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,'pending')
           ON CONFLICT(message_id,reporter_id)
           DO UPDATE SET reason=EXCLUDED.reason,status='pending',created_at=now(),reviewed_at=NULL,reviewed_by=NULL`,
          [row.room_id,row.id,auth.user.id,row.user_id,reason],
        );
        return json({ ok:true });
      }

      const muteMatch = url.pathname.match(/^\/api\/community-chat\/users\/([0-9a-f-]{36})\/mute$/i);
      if (muteMatch) {
        if (!auth) return fail('Authentication required.', 401, 'unauthorized');
        const targetId = muteMatch[1];
        if (String(targetId) === String(auth.user.id)) return fail('You cannot mute yourself.', 400, 'invalid_mute');

        if (request.method === 'POST') {
          const exists = await db.query('SELECT 1 FROM public.users WHERE id=$1::uuid', [targetId]);
          if (!exists.rowCount) return fail('Member not found.', 404, 'not_found');
          await db.query(
            `INSERT INTO public.chat_user_mutes(owner_user_id,muted_user_id)
             VALUES($1::uuid,$2::uuid)
             ON CONFLICT(owner_user_id,muted_user_id) DO NOTHING`,
            [auth.user.id,targetId],
          );
          return json({ ok:true });
        }

        if (request.method === 'DELETE') {
          await db.query(
            'DELETE FROM public.chat_user_mutes WHERE owner_user_id=$1::uuid AND muted_user_id=$2::uuid',
            [auth.user.id,targetId],
          );
          return json({ ok:true });
        }

        return fail('Method not allowed.',405,'method_not_allowed');
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
