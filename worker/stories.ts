// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const STORY_TYPES = new Set(['success', 'challenge', 'advice', 'milestone', 'transformation']);
const SORT_FIELDS = new Set(['created_at', 'updated_at', 'likes_count', 'helpful_count', 'views_count', 'title']);
const WRITE_FIELDS = new Set(['title', 'content', 'story_type', 'is_anonymous', 'relationship_length', 'tags']);

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
function tags(value) { return Array.isArray(value) ? value.slice(0, 30).map((item) => text(item, 100, true)) : []; }
function normalize(input, partial = false) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) if (WRITE_FIELDS.has(key)) out[key] = value;
  if (!partial) {
    out.title = text(out.title, 300, true);
    out.content = text(out.content, 50000, true);
    out.story_type = out.story_type || 'success';
    out.is_anonymous = Boolean(out.is_anonymous);
    out.relationship_length = text(out.relationship_length, 250);
    out.tags = tags(out.tags);
  } else {
    if ('title' in out) out.title = text(out.title, 300, true);
    if ('content' in out) out.content = text(out.content, 50000, true);
    if ('is_anonymous' in out) out.is_anonymous = Boolean(out.is_anonymous);
    if ('relationship_length' in out) out.relationship_length = text(out.relationship_length, 250);
    if ('tags' in out) out.tags = tags(out.tags);
  }
  if ('story_type' in out && !STORY_TYPES.has(out.story_type)) throw new Error('Invalid story type.');
  return out;
}
async function isAdmin(db, userId) {
  const result = await db.query('SELECT role FROM neon_auth."user" WHERE id=$1::uuid', [userId]);
  return result.rows[0]?.role === 'admin';
}
async function addInteractionFlags(db, stories, auth) {
  if (!stories.length) return stories.map((s) => ({ ...s, userHasLiked: false, userMarkedHelpful: false, created_date: s.created_at }));
  if (!auth?.user?.id) return stories.map((s) => ({ ...s, userHasLiked: false, userMarkedHelpful: false, created_date: s.created_at }));
  const ids = stories.map((s) => s.id);
  const [likes, helpful] = await Promise.all([
    db.query('SELECT story_id FROM public.story_likes WHERE user_id=$1::uuid AND story_id=ANY($2::uuid[])', [auth.user.id, ids]),
    db.query('SELECT story_id FROM public.story_helpful WHERE user_id=$1::uuid AND story_id=ANY($2::uuid[])', [auth.user.id, ids]),
  ]);
  const liked = new Set(likes.rows.map((r) => r.story_id));
  const helped = new Set(helpful.rows.map((r) => r.story_id));
  return stories.map((s) => ({ ...s, userHasLiked: liked.has(s.id), userMarkedHelpful: helped.has(s.id), created_date: s.created_at }));
}
async function listApproved(db, url, auth) {
  const clauses = ["moderation_status='approved'"];
  const values = [];
  const storyType = url.searchParams.get('type');
  if (storyType) { values.push(storyType); clauses.push(`story_type=$${values.length}`); }
  const search = (url.searchParams.get('search') || '').trim();
  if (search) { values.push(`%${search}%`); clauses.push(`(title ILIKE $${values.length} OR content ILIKE $${values.length})`); }
  const order = url.searchParams.get('order') || '-created_at';
  const desc = order.startsWith('-');
  const field = order.replace(/^-/, '');
  const sort = SORT_FIELDS.has(field) ? field : 'created_at';
  const result = await db.query(`SELECT * FROM public.success_stories WHERE ${clauses.join(' AND ')} ORDER BY ${sort} ${desc ? 'DESC' : 'ASC'},id ASC`, values);
  return addInteractionFlags(db, result.rows, auth);
}
async function publicStory(db, storyId, auth, incrementViews = false) {
  if (incrementViews) {
    const result = await db.query("UPDATE public.success_stories SET views_count=views_count+1 WHERE id=$1::uuid AND moderation_status='approved' RETURNING *", [storyId]);
    if (!result.rows[0]) return null;
    return (await addInteractionFlags(db, [result.rows[0]], auth))[0];
  }
  const result = await db.query("SELECT * FROM public.success_stories WHERE id=$1::uuid AND moderation_status='approved'", [storyId]);
  if (!result.rows[0]) return null;
  return (await addInteractionFlags(db, [result.rows[0]], auth))[0];
}
async function createStory(db, auth, input) {
  const data = normalize(input, false);
  const profile = await db.query('SELECT name FROM public.users WHERE id=$1::uuid', [auth.user.id]);
  const authorName = data.is_anonymous ? null : (profile.rows[0]?.name || auth.user.name || auth.user.email?.split('@')[0] || 'User');
  const result = await db.query(
    `INSERT INTO public.success_stories
      (user_id,title,content,story_type,author_name,is_anonymous,relationship_length,tags,moderation_status)
     VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8::text[],'approved') RETURNING *`,
    [auth.user.id, data.title, data.content, data.story_type, authorName, data.is_anonymous, data.relationship_length, data.tags],
  );
  return { ...result.rows[0], created_date: result.rows[0].created_at };
}
async function updateOwn(db, auth, storyId, input) {
  const data = normalize(input, true);
  if (!Object.keys(data).length) throw new Error('No story updates were provided.');
  if ('is_anonymous' in data) {
    const profile = await db.query('SELECT name FROM public.users WHERE id=$1::uuid', [auth.user.id]);
    data.author_name = data.is_anonymous ? null : (profile.rows[0]?.name || auth.user.name || auth.user.email?.split('@')[0] || 'User');
  }
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) { values.push(value); sets.push(`${key}=$${values.length}`); }
  values.push(storyId, auth.user.id);
  const result = await db.query(`UPDATE public.success_stories SET ${sets.join(',')},updated_at=now() WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING *`, values);
  return result.rows[0] ? { ...result.rows[0], created_date: result.rows[0].created_at } : null;
}
async function toggleInteraction(db, auth, storyId, table, enabled) {
  const exists = await db.query("SELECT 1 FROM public.success_stories WHERE id=$1::uuid AND moderation_status='approved'", [storyId]);
  if (!exists.rowCount) throw new Error('Story not found.');
  if (enabled) await db.query(`INSERT INTO public.${table} (story_id,user_id) VALUES ($1::uuid,$2::uuid) ON CONFLICT DO NOTHING`, [storyId, auth.user.id]);
  else await db.query(`DELETE FROM public.${table} WHERE story_id=$1::uuid AND user_id=$2::uuid`, [storyId, auth.user.id]);
}
async function stats(db, userId) {
  const result = await db.query(
    `SELECT count(*)::int AS total,
      count(*) FILTER (WHERE moderation_status='approved')::int AS approved,
      count(*) FILTER (WHERE moderation_status='pending')::int AS pending,
      count(*) FILTER (WHERE moderation_status='rejected')::int AS rejected,
      COALESCE(sum(likes_count),0)::int AS total_likes,
      COALESCE(sum(views_count),0)::int AS total_views
     FROM public.success_stories WHERE user_id=$1::uuid`, [userId]);
  const r = result.rows[0];
  return { total: r.total, approved: r.approved, pending: r.pending, rejected: r.rejected, totalLikes: r.total_likes, totalViews: r.total_views };
}

export async function handleStoriesRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/stories')) return null;
  const auth = await session(request, env);
  try {
    return await withDb(env, async (db) => {
      if (url.pathname === '/api/stories' && request.method === 'GET') return json({ ok: true, stories: await listApproved(db, url, auth) });
      const publicItem = url.pathname.match(/^\/api\/stories\/([0-9a-f-]{36})$/i);
      if (publicItem && request.method === 'GET') {
        const story = await publicStory(db, publicItem[1], auth, true);
        return story ? json({ ok: true, story }) : fail('Story not found.', 404, 'not_found');
      }
      if (!auth) return fail('Authentication required.', 401, 'unauthorized');
      if (url.pathname === '/api/stories/mine' && request.method === 'GET') {
        const result = await db.query('SELECT * FROM public.success_stories WHERE user_id=$1::uuid ORDER BY created_at DESC', [auth.user.id]);
        return json({ ok: true, stories: result.rows.map((s) => ({ ...s, created_date: s.created_at })) });
      }
      if (url.pathname === '/api/stories/stats' && request.method === 'GET') return json({ ok: true, stats: await stats(db, auth.user.id) });
      if (url.pathname === '/api/stories' && request.method === 'POST') return json({ ok: true, story: await createStory(db, auth, await readJson(request)) }, 201);
      const interaction = url.pathname.match(/^\/api\/stories\/([0-9a-f-]{36})\/(like|helpful)$/i);
      if (interaction) {
        const table = interaction[2] === 'like' ? 'story_likes' : 'story_helpful';
        if (request.method === 'POST') { await toggleInteraction(db, auth, interaction[1], table, true); return json({ ok: true }); }
        if (request.method === 'DELETE') { await toggleInteraction(db, auth, interaction[1], table, false); return json({ ok: true }); }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }
      const adminMatch = url.pathname.match(/^\/api\/stories\/([0-9a-f-]{36})\/(approve|reject|feature)$/i);
      if (adminMatch) {
        if (!await isAdmin(db, auth.user.id)) return fail('Administrator access required.', 403, 'forbidden');
        if (request.method !== 'PATCH' && request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
        const input = await readJson(request).catch(() => ({}));
        let result;
        if (adminMatch[2] === 'approve') {
          result = await db.query("UPDATE public.success_stories SET moderation_status='approved',moderated_by=$1::uuid,moderated_at=now(),updated_at=now() WHERE id=$2::uuid RETURNING *", [auth.user.id, adminMatch[1]]);
        } else if (adminMatch[2] === 'reject') {
          result = await db.query("UPDATE public.success_stories SET moderation_status='rejected',moderation_notes=$1,moderated_by=$2::uuid,moderated_at=now(),updated_at=now() WHERE id=$3::uuid RETURNING *", [text(input.notes, 5000), auth.user.id, adminMatch[1]]);
        } else {
          result = await db.query('UPDATE public.success_stories SET is_featured=$1,updated_at=now() WHERE id=$2::uuid RETURNING *', [input.featured !== false, adminMatch[1]]);
        }
        return result.rows[0] ? json({ ok: true, story: result.rows[0] }) : fail('Story not found.', 404, 'not_found');
      }
      if (publicItem) {
        if (request.method === 'PATCH') {
          const story = await updateOwn(db, auth, publicItem[1], await readJson(request));
          return story ? json({ ok: true, story }) : fail('Story not found.', 404, 'not_found');
        }
        if (request.method === 'DELETE') {
          const result = await db.query('DELETE FROM public.success_stories WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id', [publicItem[1], auth.user.id]);
          return result.rowCount ? json({ ok: true }) : fail('Story not found.', 404, 'not_found');
        }
      }
      return fail('Story route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove stories API error', err);
    return fail(err?.message || 'Unable to process story request.', err?.message === 'Story not found.' ? 404 : 400, 'story_error');
  }
}
