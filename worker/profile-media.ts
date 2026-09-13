// @ts-nocheck
import { Client } from 'pg';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const profileKey = (id) => `profiles/${id}/avatar`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function fail(message, status = 400) {
  return json({ ok: false, error: { message } }, status);
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

async function saveAvatarUrl(env, userId, avatarUrl) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    await db.query('UPDATE public.users SET avatar_url=$1, updated_at=now() WHERE id=$2::uuid', [avatarUrl, userId]);
  } finally {
    await db.end();
  }
}

async function servePublic(request, env, url) {
  const match = url.pathname.match(/^\/api\/media\/profile\/([0-9a-f-]{36})$/i);
  if (!match) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return fail('Method not allowed.', 405);
  const object = await env.MEDIA.get(profileKey(match[1]));
  if (!object) return fail('Profile photo not found.', 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=3600');
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

async function handleOwn(request, env, url) {
  if (url.pathname !== '/api/profile/photo') return null;
  const auth = await getSession(request, env);
  if (!auth) return fail('Authentication required.', 401);

  if (request.method === 'PUT' || request.method === 'POST') {
    const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!TYPES.has(type)) return fail('File must be a JPEG, PNG, WebP, or GIF image.');
    const length = Number(request.headers.get('content-length') || 0);
    if (length > MAX_BYTES) return fail('Image size must be less than 5MB.', 413);
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength) return fail('Image file is empty.');
    if (bytes.byteLength > MAX_BYTES) return fail('Image size must be less than 5MB.', 413);
    await env.MEDIA.put(profileKey(auth.user.id), bytes, { httpMetadata: { contentType: type } });
    const avatarUrl = `/api/media/profile/${auth.user.id}`;
    await saveAvatarUrl(env, auth.user.id, avatarUrl);
    return json({ ok: true, avatar_url: avatarUrl }, 201);
  }

  if (request.method === 'DELETE') {
    await env.MEDIA.delete(profileKey(auth.user.id));
    await saveAvatarUrl(env, auth.user.id, null);
    return json({ ok: true });
  }

  return fail('Method not allowed.', 405);
}

export async function handleProfileMediaRequest(request, env, url) {
  return (await servePublic(request, env, url)) || handleOwn(request, env, url);
}
