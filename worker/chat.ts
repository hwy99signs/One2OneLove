// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MESSAGE_TYPES = new Set(['text', 'image', 'video', 'audio', 'voice', 'file', 'location']);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function isUuid(value) { return UUID.test(String(value || '')); }
function cleanText(value, max = 10000, required = false) {
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
  const name = String(value || 'attachment').replace(/[\r\n]/g, '').replace(/[^a-zA-Z0-9._ -]/g, '_').trim();
  return (name || 'attachment').slice(0, 180);
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
async function requireConversation(db, conversationId, userId) {
  const result = await db.query(
    'SELECT * FROM public.conversations WHERE id=$1::uuid AND (user1_id=$2::uuid OR user2_id=$2::uuid)',
    [conversationId, userId],
  );
  if (!result.rows[0]) throw Object.assign(new Error('Conversation not found.'), { status: 404, code: 'not_found' });
  return result.rows[0];
}
async function requireMessage(db, messageId, userId) {
  const result = await db.query(
    `SELECT m.*, c.user1_id, c.user2_id
       FROM public.messages m
       JOIN public.conversations c ON c.id=m.conversation_id
      WHERE m.id=$1::uuid AND (c.user1_id=$2::uuid OR c.user2_id=$2::uuid)`,
    [messageId, userId],
  );
  if (!result.rows[0]) throw Object.assign(new Error('Message not found.'), { status: 404, code: 'not_found' });
  return result.rows[0];
}
function otherUserId(conversation, userId) {
  return conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
}
function publicFileUrl(row) {
  if (!row.file_url) return null;
  return String(row.file_url).startsWith('r2://') ? `/api/chat/messages/${row.id}/file` : row.file_url;
}
function messageShape(row, currentUserId) {
  let status = 'sent';
  if (row.delivered_at) status = 'delivered';
  if (row.read_at || row.is_read) status = 'read';
  const fileUrl = publicFileUrl(row);
  const reply = row.reply_id ? {
    id: row.reply_id,
    content: row.reply_content,
    messageType: row.reply_message_type,
    senderId: row.reply_sender_id,
    senderName: row.reply_sender_name || row.reply_sender_email || 'Unknown',
  } : null;
  const senderEmail = row.sender_email || '';
  const senderAvatar = row.sender_avatar || (senderEmail ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderEmail)}` : '');
  const item = {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    senderName: row.sender_name || senderEmail || 'Unknown',
    senderAvatar,
    type: row.message_type,
    text: row.content,
    content: row.content,
    fileUrl,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    locationAddress: row.location_address,
    isRead: Boolean(row.is_read),
    isEdited: Boolean(row.is_edited),
    replyToId: row.reply_to_id,
    replyToMessage: reply,
    timestamp: row.created_at,
    createdAt: row.created_at,
    sentAt: row.created_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    updatedAt: row.updated_at,
    isOwn: row.sender_id === currentUserId,
    status,
  };
  if (row.message_type === 'image') { item.imageUrl = fileUrl; item.caption = row.content; }
  if (row.message_type === 'voice' || row.message_type === 'audio') { item.audioUrl = fileUrl; item.duration = row.duration || 0; }
  if (row.message_type === 'location') {
    item.latitude = row.location_lat;
    item.longitude = row.location_lng;
    item.address = row.location_address;
  }
  return item;
}
async function loadMessage(db, messageId, currentUserId) {
  const result = await db.query(
    `SELECT m.*, su.name AS sender_name, su.email AS sender_email, su.avatar_url AS sender_avatar,
            rm.id AS reply_id, rm.content AS reply_content, rm.message_type AS reply_message_type,
            rm.sender_id AS reply_sender_id, ru.name AS reply_sender_name, ru.email AS reply_sender_email
       FROM public.messages m
       JOIN public.conversations c ON c.id=m.conversation_id
       LEFT JOIN public.users su ON su.id=m.sender_id
       LEFT JOIN public.messages rm ON rm.id=m.reply_to_id
       LEFT JOIN public.users ru ON ru.id=rm.sender_id
      WHERE m.id=$1::uuid AND (c.user1_id=$2::uuid OR c.user2_id=$2::uuid)`,
    [messageId, currentUserId],
  );
  return result.rows[0] ? messageShape(result.rows[0], currentUserId) : null;
}
async function listMessages(db, conversationId, userId) {
  await requireConversation(db, conversationId, userId);
  await db.query(
    `UPDATE public.messages SET delivered_at=COALESCE(delivered_at,now())
      WHERE conversation_id=$1::uuid AND receiver_id=$2::uuid AND is_deleted=false AND delivered_at IS NULL`,
    [conversationId, userId],
  );
  const result = await db.query(
    `SELECT m.*, su.name AS sender_name, su.email AS sender_email, su.avatar_url AS sender_avatar,
            rm.id AS reply_id, rm.content AS reply_content, rm.message_type AS reply_message_type,
            rm.sender_id AS reply_sender_id, ru.name AS reply_sender_name, ru.email AS reply_sender_email
       FROM public.messages m
       LEFT JOIN public.users su ON su.id=m.sender_id
       LEFT JOIN public.messages rm ON rm.id=m.reply_to_id
       LEFT JOIN public.users ru ON ru.id=rm.sender_id
      WHERE m.conversation_id=$1::uuid AND m.is_deleted=false
      ORDER BY m.created_at ASC, m.id ASC`,
    [conversationId],
  );
  return result.rows.map(row => messageShape(row, userId));
}
async function listConversations(db, userId) {
  const result = await db.query(
    `SELECT c.*, u.id AS other_user_id, u.name AS other_name, u.email AS other_email, u.avatar_url AS other_avatar
       FROM public.conversations c
       JOIN public.users u ON u.id=CASE WHEN c.user1_id=$1::uuid THEN c.user2_id ELSE c.user1_id END
      WHERE c.user1_id=$1::uuid OR c.user2_id=$1::uuid
      ORDER BY c.last_message_time DESC NULLS LAST, c.updated_at DESC`,
    [userId],
  );
  return result.rows.map(c => {
    const isUser1 = c.user1_id === userId;
    return {
      id: c.id,
      otherUserId: c.other_user_id,
      name: c.other_name || c.other_email || 'Unknown User',
      email: c.other_email,
      avatar: c.other_avatar || (c.other_email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.other_email)}` : ''),
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time,
      unreadCount: isUser1 ? c.user1_unread_count : c.user2_unread_count,
      isMuted: isUser1 ? c.user1_muted : c.user2_muted,
      isPinned: isUser1 ? c.user1_pinned : c.user2_pinned,
      isArchived: isUser1 ? c.user1_archived : c.user2_archived,
      isOnline: false,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  });
}
async function insertMessage(db, conversation, userId, input) {
  const receiverId = input.receiver_id || otherUserId(conversation, userId);
  if (receiverId !== otherUserId(conversation, userId)) throw Object.assign(new Error('Receiver is not the other conversation participant.'), { status: 403, code: 'forbidden' });
  const type = MESSAGE_TYPES.has(String(input.message_type || 'text')) ? String(input.message_type || 'text') : 'text';
  const content = cleanText(input.content, 10000, type === 'text');
  const replyTo = input.reply_to_id || null;
  if (replyTo) {
    if (!isUuid(replyTo)) throw new Error('Invalid reply message ID.');
    const reply = await db.query('SELECT 1 FROM public.messages WHERE id=$1::uuid AND conversation_id=$2::uuid', [replyTo, conversation.id]);
    if (!reply.rowCount) throw Object.assign(new Error('Reply message not found.'), { status: 404, code: 'not_found' });
  }
  const result = await db.query(
    `INSERT INTO public.messages(conversation_id,sender_id,receiver_id,content,message_type,reply_to_id)
     VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6::uuid) RETURNING id`,
    [conversation.id, userId, receiverId, content, type, replyTo],
  );
  return loadMessage(db, result.rows[0].id, userId);
}
async function setConversationSetting(db, conversation, userId, settings) {
  const prefix = conversation.user1_id === userId ? 'user1_' : 'user2_';
  const fields = [];
  const values = [];
  if ('isMuted' in settings) { values.push(Boolean(settings.isMuted)); fields.push(`${prefix}muted=$${values.length}`); }
  if ('isPinned' in settings) { values.push(Boolean(settings.isPinned)); fields.push(`${prefix}pinned=$${values.length}`); }
  if ('isArchived' in settings) { values.push(Boolean(settings.isArchived)); fields.push(`${prefix}archived=$${values.length}`); }
  if (!fields.length) return;
  values.push(conversation.id);
  await db.query(`UPDATE public.conversations SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length}::uuid`, values);
}
async function messageInfo(db, messageId, userId) {
  const raw = await requireMessage(db, messageId, userId);
  const people = await db.query(
    `SELECT id,name,email,avatar_url FROM public.users WHERE id=ANY($1::uuid[])`,
    [[raw.sender_id, raw.receiver_id]],
  );
  const peopleMap = new Map(people.rows.map(p => [p.id, p]));
  const reactions = await db.query('SELECT emoji,user_id FROM public.message_reactions WHERE message_id=$1::uuid ORDER BY created_at ASC', [messageId]);
  const starred = await db.query('SELECT 1 FROM public.starred_messages WHERE message_id=$1::uuid AND user_id=$2::uuid', [messageId, userId]);
  const pinned = await db.query('SELECT 1 FROM public.pinned_messages WHERE message_id=$1::uuid AND conversation_id=$2::uuid AND (expires_at IS NULL OR expires_at>now())', [messageId, raw.conversation_id]);
  const forwarded = await db.query('SELECT original_message_id,forwarded_by,created_at FROM public.forwarded_messages WHERE new_message_id=$1::uuid ORDER BY created_at DESC LIMIT 1', [messageId]);
  let reply = null;
  if (raw.reply_to_id) {
    const rr = await db.query(`SELECT m.id,m.content,m.message_type,m.sender_id,m.created_at,u.name,u.email FROM public.messages m LEFT JOIN public.users u ON u.id=m.sender_id WHERE m.id=$1::uuid`, [raw.reply_to_id]);
    if (rr.rows[0]) reply = { id: rr.rows[0].id, content: rr.rows[0].content, message_type: rr.rows[0].message_type, sender_name: rr.rows[0].name || rr.rows[0].email || 'Unknown', created_at: rr.rows[0].created_at };
  }
  const sender = peopleMap.get(raw.sender_id) || {};
  const receiver = peopleMap.get(raw.receiver_id) || {};
  const status = raw.read_at ? 'read' : raw.delivered_at ? 'delivered' : 'sent';
  return {
    ...raw,
    file_url: publicFileUrl(raw),
    sender_name: sender.name || sender.email || 'Unknown',
    sender_avatar: sender.avatar_url,
    receiver_name: receiver.name || receiver.email || 'Unknown',
    receiver_avatar: receiver.avatar_url,
    reactions_count: reactions.rowCount,
    reactions: reactions.rows,
    is_starred: starred.rowCount > 0,
    is_pinned: pinned.rowCount > 0,
    is_forwarded: forwarded.rowCount > 0,
    original_message_id: forwarded.rows[0]?.original_message_id || null,
    forwarded_at: forwarded.rows[0]?.created_at || null,
    forwarded_by: forwarded.rows[0]?.forwarded_by || null,
    reply_to_message: reply,
    sent_at: raw.created_at,
    status,
  };
}

export async function handleChatRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/chat')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  const userId = auth.user.id;

  try {
    return await withDb(env, async db => {
      if (url.pathname === '/api/chat/conversations' && request.method === 'GET') {
        return json({ ok: true, conversations: await listConversations(db, userId) });
      }
      if (url.pathname === '/api/chat/conversations' && request.method === 'POST') {
        const input = await readJson(request);
        const other = input.other_user_id;
        if (!isUuid(other) || other === userId) return fail('Invalid conversation participant.');
        const exists = await db.query('SELECT 1 FROM public.users WHERE id=$1::uuid AND is_active=true', [other]);
        if (!exists.rowCount) return fail('User not found.', 404, 'not_found');
        const r = await db.query('SELECT public.get_or_create_conversation($1::uuid,$2::uuid) AS id', [userId, other]);
        return json({ ok: true, conversation_id: r.rows[0].id });
      }
      if (url.pathname === '/api/chat/deliver-pending' && request.method === 'POST') {
        const r = await db.query(`UPDATE public.messages SET delivered_at=COALESCE(delivered_at,now()) WHERE receiver_id=$1::uuid AND is_deleted=false AND delivered_at IS NULL RETURNING id`, [userId]);
        return json({ ok: true, delivered: r.rowCount });
      }
      if (url.pathname === '/api/chat/starred' && request.method === 'GET') {
        const r = await db.query(
          `SELECT m.* FROM public.starred_messages s JOIN public.messages m ON m.id=s.message_id JOIN public.conversations c ON c.id=m.conversation_id WHERE s.user_id=$1::uuid AND (c.user1_id=$1::uuid OR c.user2_id=$1::uuid) ORDER BY s.created_at DESC`,
          [userId],
        );
        return json({ ok: true, messages: r.rows.map(row => ({ ...row, file_url: publicFileUrl(row) })) });
      }

      const pinsMatch = url.pathname.match(/^\/api\/chat\/conversations\/([0-9a-f-]{36})\/pins$/i);
      if (pinsMatch && request.method === 'GET') {
        const conversation = await requireConversation(db, pinsMatch[1], userId);
        const r = await db.query(
          `SELECT m.*,p.pinned_by,p.created_at AS pinned_at,p.expires_at AS pin_expires_at
             FROM public.pinned_messages p JOIN public.messages m ON m.id=p.message_id
            WHERE p.conversation_id=$1::uuid AND (p.expires_at IS NULL OR p.expires_at>now()) ORDER BY p.created_at DESC`,
          [conversation.id],
        );
        return json({ ok: true, messages: r.rows.map(row => ({ ...row, file_url: publicFileUrl(row) })) });
      }

      const conversationAction = url.pathname.match(/^\/api\/chat\/conversations\/([0-9a-f-]{36})\/(messages|files|location|read|settings|clear|unread)$/i);
      if (conversationAction) {
        const conversationId = conversationAction[1];
        const action = conversationAction[2];
        const conversation = await requireConversation(db, conversationId, userId);

        if (action === 'messages' && request.method === 'GET') return json({ ok: true, messages: await listMessages(db, conversationId, userId) });
        if (action === 'messages' && request.method === 'POST') {
          const input = await readJson(request);
          return json({ ok: true, message: await insertMessage(db, conversation, userId, input) }, 201);
        }
        if (action === 'location' && request.method === 'POST') {
          const input = await readJson(request);
          const receiverId = input.receiver_id || otherUserId(conversation, userId);
          if (receiverId !== otherUserId(conversation, userId)) return fail('Receiver is not the other conversation participant.', 403, 'forbidden');
          const lat = Number(input.lat);
          const lng = Number(input.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return fail('Invalid location coordinates.');
          const address = cleanText(input.address, 500) || 'Location';
          const r = await db.query(`INSERT INTO public.messages(conversation_id,sender_id,receiver_id,content,message_type,location_lat,location_lng,location_address) VALUES($1::uuid,$2::uuid,$3::uuid,$4,'location',$5,$6,$4) RETURNING id`, [conversationId,userId,receiverId,address,lat,lng]);
          return json({ ok: true, message: await loadMessage(db, r.rows[0].id, userId) }, 201);
        }
        if (action === 'files' && request.method === 'PUT') {
          const contentLength = Number(request.headers.get('content-length') || 0);
          if (contentLength > MAX_FILE_BYTES) return fail('File exceeds 25 MB limit.', 413, 'file_too_large');
          const receiverId = url.searchParams.get('receiver_id') || otherUserId(conversation, userId);
          if (receiverId !== otherUserId(conversation, userId)) return fail('Receiver is not the other conversation participant.', 403, 'forbidden');
          const type = MESSAGE_TYPES.has(url.searchParams.get('message_type')) ? url.searchParams.get('message_type') : 'file';
          const fileName = safeFileName(url.searchParams.get('file_name'));
          const contentType = (request.headers.get('content-type') || 'application/octet-stream').slice(0, 100);
          const body = await request.arrayBuffer();
          if (!body.byteLength) return fail('Empty file.');
          if (body.byteLength > MAX_FILE_BYTES) return fail('File exceeds 25 MB limit.', 413, 'file_too_large');
          const key = `chat/${conversationId}/${userId}/${crypto.randomUUID()}-${fileName}`;
          await env.MEDIA.put(key, body, { httpMetadata: { contentType }, customMetadata: { originalName: fileName } });
          try {
            const r = await db.query(`INSERT INTO public.messages(conversation_id,sender_id,receiver_id,content,message_type,file_url,file_name,file_size,file_type) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$4,$7,$8) RETURNING id`, [conversationId,userId,receiverId,fileName,type,`r2://${key}`,body.byteLength,contentType]);
            return json({ ok: true, message: await loadMessage(db, r.rows[0].id, userId) }, 201);
          } catch (error) {
            await env.MEDIA.delete(key).catch(() => {});
            throw error;
          }
        }
        if (action === 'read' && request.method === 'POST') {
          await db.query(`UPDATE public.messages SET delivered_at=COALESCE(delivered_at,now()),is_read=true,read_at=COALESCE(read_at,now()) WHERE conversation_id=$1::uuid AND receiver_id=$2::uuid AND is_deleted=false`, [conversationId,userId]);
          const r = await db.query('SELECT public.recalculate_unread_count($1::uuid,$2::uuid) AS unread', [conversationId,userId]);
          return json({ ok: true, unread_count: r.rows[0]?.unread || 0 });
        }
        if (action === 'settings' && request.method === 'PATCH') {
          const input = await readJson(request);
          await setConversationSetting(db, conversation, userId, input);
          return json({ ok: true });
        }
        if (action === 'clear' && request.method === 'POST') {
          await db.query('UPDATE public.messages SET is_deleted=true WHERE conversation_id=$1::uuid', [conversationId]);
          const prefix = conversation.user1_id === userId ? 'user1_' : 'user2_';
          await db.query(`UPDATE public.conversations SET ${prefix}unread_count=0,last_message='',updated_at=now() WHERE id=$1::uuid`, [conversationId]);
          return json({ ok: true });
        }
        if (action === 'unread' && request.method === 'POST') {
          const prefix = conversation.user1_id === userId ? 'user1_' : 'user2_';
          await db.query(`UPDATE public.conversations SET ${prefix}unread_count=GREATEST(${prefix}unread_count,1),updated_at=now() WHERE id=$1::uuid`, [conversationId]);
          return json({ ok: true });
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      const conversationItem = url.pathname.match(/^\/api\/chat\/conversations\/([0-9a-f-]{36})$/i);
      if (conversationItem) {
        const conversationId = conversationItem[1];
        await requireConversation(db, conversationId, userId);
        if (request.method === 'DELETE') {
          await db.query('DELETE FROM public.conversations WHERE id=$1::uuid', [conversationId]);
          return json({ ok: true });
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      const messageAction = url.pathname.match(/^\/api\/chat\/messages\/([0-9a-f-]{36})\/(delivered|read|reactions|star|pin|forward|info|file)$/i);
      if (messageAction) {
        const messageId = messageAction[1];
        const action = messageAction[2];
        const message = await requireMessage(db, messageId, userId);
        if (action === 'delivered' && request.method === 'POST') {
          if (message.receiver_id !== userId) return fail('Only the receiver can mark this message delivered.', 403, 'forbidden');
          await db.query('UPDATE public.messages SET delivered_at=COALESCE(delivered_at,now()) WHERE id=$1::uuid', [messageId]);
          return json({ ok: true });
        }
        if (action === 'read' && request.method === 'POST') {
          if (message.receiver_id !== userId) return fail('Only the receiver can mark this message read.', 403, 'forbidden');
          await db.query('SELECT public.mark_message_read($1::uuid,$2::uuid)', [messageId,userId]);
          return json({ ok: true });
        }
        if (action === 'reactions' && request.method === 'GET') {
          const r = await db.query(`SELECT emoji,count(*)::integer AS count,bool_or(user_id=$2::uuid) AS "userReacted" FROM public.message_reactions WHERE message_id=$1::uuid GROUP BY emoji ORDER BY count(*) DESC,emoji`, [messageId,userId]);
          return json({ ok: true, reactions: r.rows });
        }
        if (action === 'reactions' && request.method === 'POST') {
          const input = await readJson(request);
          const emoji = cleanText(input.emoji, 32, true);
          const existing = await db.query('DELETE FROM public.message_reactions WHERE message_id=$1::uuid AND user_id=$2::uuid AND emoji=$3 RETURNING id', [messageId,userId,emoji]);
          if (existing.rowCount) return json({ ok: true, action: 'removed' });
          await db.query('INSERT INTO public.message_reactions(message_id,user_id,emoji) VALUES($1::uuid,$2::uuid,$3) ON CONFLICT DO NOTHING', [messageId,userId,emoji]);
          return json({ ok: true, action: 'added' });
        }
        if (action === 'star' && request.method === 'GET') {
          const r = await db.query('SELECT 1 FROM public.starred_messages WHERE message_id=$1::uuid AND user_id=$2::uuid', [messageId,userId]);
          return json({ ok: true, starred: r.rowCount > 0 });
        }
        if (action === 'star' && request.method === 'POST') {
          const removed = await db.query('DELETE FROM public.starred_messages WHERE message_id=$1::uuid AND user_id=$2::uuid RETURNING id', [messageId,userId]);
          if (removed.rowCount) return json({ ok: true, starred: false });
          await db.query('INSERT INTO public.starred_messages(message_id,user_id) VALUES($1::uuid,$2::uuid) ON CONFLICT DO NOTHING', [messageId,userId]);
          return json({ ok: true, starred: true });
        }
        if (action === 'pin' && request.method === 'POST') {
          const input = await readJson(request);
          const conversationId = input.conversation_id || message.conversation_id;
          if (conversationId !== message.conversation_id) return fail('Message does not belong to that conversation.');
          const expires = input.expires_at ? new Date(input.expires_at) : null;
          if (expires && Number.isNaN(expires.getTime())) return fail('Invalid pin expiry.');
          await db.query(`INSERT INTO public.pinned_messages(message_id,conversation_id,pinned_by,expires_at) VALUES($1::uuid,$2::uuid,$3::uuid,$4) ON CONFLICT(message_id,conversation_id) DO UPDATE SET pinned_by=EXCLUDED.pinned_by,expires_at=EXCLUDED.expires_at,created_at=now()`, [messageId,conversationId,userId,expires ? expires.toISOString() : null]);
          return json({ ok: true });
        }
        if (action === 'pin' && request.method === 'DELETE') {
          await db.query('DELETE FROM public.pinned_messages WHERE message_id=$1::uuid AND conversation_id=$2::uuid', [messageId,message.conversation_id]);
          return json({ ok: true });
        }
        if (action === 'pin' && request.method === 'GET') {
          const r = await db.query('SELECT 1 FROM public.pinned_messages WHERE message_id=$1::uuid AND conversation_id=$2::uuid AND (expires_at IS NULL OR expires_at>now())', [messageId,message.conversation_id]);
          return json({ ok: true, pinned: r.rowCount > 0 });
        }
        if (action === 'forward' && request.method === 'POST') {
          const input = await readJson(request);
          const targetId = input.conversation_id;
          if (!isUuid(targetId)) return fail('Invalid target conversation.');
          const target = await requireConversation(db, targetId, userId);
          const receiverId = input.receiver_id || otherUserId(target, userId);
          if (receiverId !== otherUserId(target, userId)) return fail('Receiver is not the other target conversation participant.', 403, 'forbidden');
          const forwardedContent = message.content ? `Forwarded: ${message.content}` : message.content;
          const r = await db.query(`INSERT INTO public.messages(conversation_id,sender_id,receiver_id,content,message_type,file_url,file_name,file_size,file_type,duration,location_lat,location_lng,location_address) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`, [targetId,userId,receiverId,forwardedContent,message.message_type,message.file_url,message.file_name,message.file_size,message.file_type,message.duration,message.location_lat,message.location_lng,message.location_address]);
          await db.query('INSERT INTO public.forwarded_messages(original_message_id,new_message_id,forwarded_by,forwarded_to_conversation) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid)', [messageId,r.rows[0].id,userId,targetId]);
          return json({ ok: true, newMessageId: r.rows[0].id, newMessage: await loadMessage(db,r.rows[0].id,userId) }, 201);
        }
        if (action === 'info' && request.method === 'GET') return json({ ok: true, info: await messageInfo(db,messageId,userId) });
        if (action === 'file' && request.method === 'GET') {
          if (!message.file_url || !String(message.file_url).startsWith('r2://')) return fail('File not found.',404,'not_found');
          const key = String(message.file_url).slice(5);
          const object = await env.MEDIA.get(key);
          if (!object) return fail('File not found.',404,'not_found');
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('cache-control','private, max-age=3600');
          headers.set('x-content-type-options','nosniff');
          headers.set('content-disposition', `inline; filename="${safeFileName(message.file_name)}"`);
          return new Response(object.body,{headers});
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }

      const messageItem = url.pathname.match(/^\/api\/chat\/messages\/([0-9a-f-]{36})$/i);
      if (messageItem) {
        const messageId = messageItem[1];
        const message = await requireMessage(db,messageId,userId);
        if (request.method === 'GET') {
          const item = await loadMessage(db,messageId,userId);
          return json({ ok:true,message:item });
        }
        if (request.method === 'PATCH') {
          if (message.sender_id !== userId) return fail('Only the sender can edit this message.',403,'forbidden');
          const input = await readJson(request);
          const content = cleanText(input.content,10000,true);
          const r = await db.query('UPDATE public.messages SET content=$1,is_edited=true,updated_at=now() WHERE id=$2::uuid AND sender_id=$3::uuid AND is_deleted=false RETURNING id',[content,messageId,userId]);
          if(!r.rowCount)return fail('Message not found.',404,'not_found');
          return json({ok:true,message:await loadMessage(db,messageId,userId)});
        }
        if (request.method === 'DELETE') {
          if (message.sender_id !== userId) return fail('Only the sender can delete this message.',403,'forbidden');
          await db.query('UPDATE public.messages SET is_deleted=true,updated_at=now() WHERE id=$1::uuid',[messageId]);
          return json({ok:true});
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }

      return fail('Not found.',404,'not_found');
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return fail(error?.message || 'Chat request failed.', error?.status || 500, error?.code || 'chat_error');
  }
}
