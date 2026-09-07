const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });

const bearerToken = (request) => {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : null;
};

/**
 * Validate the caller with Neon's own Data API + RLS. The users table policy
 * only returns the authenticated caller's row, so a successful one-row query
 * gives us the authoritative O2OL user id without putting a database password
 * in the browser or Worker.
 */
async function authenticatedUserId(request, env) {
  const token = bearerToken(request);
  if (!token || !env.NEON_DATA_API_URL) return null;

  const response = await fetch(`${env.NEON_DATA_API_URL}/users?select=id&limit=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length === 1 ? rows[0]?.id || null : null;
}

const decodePathSegments = (pathname) =>
  pathname
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));

function ownedPath(userId, path) {
  return Boolean(userId && path && (path === userId || path.startsWith(`${userId}/`)));
}

async function handleStorageList(request, env) {
  if (!env.O2OL_MEDIA) return json({ error: 'Media storage is not configured' }, 503);

  const userId = await authenticatedUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const bucket = url.searchParams.get('bucket') || '';
  const prefix = url.searchParams.get('prefix') || '';
  const search = (url.searchParams.get('search') || '').toLowerCase();

  if (!bucket || !ownedPath(userId, prefix || userId)) {
    return json({ error: 'Invalid storage path' }, 403);
  }

  const keyPrefix = `${bucket}/${prefix || `${userId}/`}`;
  const result = await env.O2OL_MEDIA.list({ prefix: keyPrefix, limit: 1000 });

  const data = result.objects
    .map((object) => {
      const relativeKey = object.key.slice(`${bucket}/`.length);
      const name = relativeKey.split('/').pop();
      return {
        name,
        id: object.etag,
        updated_at: object.uploaded?.toISOString?.() || null,
        created_at: object.uploaded?.toISOString?.() || null,
        last_accessed_at: null,
        metadata: {
          size: object.size,
          eTag: object.etag,
        },
      };
    })
    .filter((item) => !search || item.name?.toLowerCase().includes(search));

  return json({ data });
}

async function handleStorageUpload(request, env, bucket, path) {
  if (!env.O2OL_MEDIA) return json({ error: 'Media storage is not configured' }, 503);

  const userId = await authenticatedUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);
  if (!bucket || !ownedPath(userId, path)) return json({ error: 'Invalid storage path' }, 403);

  const key = `${bucket}/${path}`;
  const upsert = request.headers.get('X-Upsert') === 'true';

  if (!upsert) {
    const existing = await env.O2OL_MEDIA.head(key);
    if (existing) return json({ error: 'File already exists' }, 409);
  }

  await env.O2OL_MEDIA.put(key, request.body, {
    httpMetadata: {
      contentType: request.headers.get('Content-Type') || 'application/octet-stream',
      cacheControl: 'public, max-age=3600',
    },
    customMetadata: { ownerUserId: userId, logicalBucket: bucket },
  });

  return json({ data: { path } });
}

async function handleStorageDelete(request, env) {
  if (!env.O2OL_MEDIA) return json({ error: 'Media storage is not configured' }, 503);

  const userId = await authenticatedUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const body = await request.json().catch(() => null);
  const bucket = body?.bucket || '';
  const paths = Array.isArray(body?.paths) ? body.paths : [];

  if (!bucket || !paths.length || paths.some((path) => !ownedPath(userId, path))) {
    return json({ error: 'Invalid storage paths' }, 403);
  }

  const keys = paths.map((path) => `${bucket}/${path}`);
  await env.O2OL_MEDIA.delete(keys);
  return json({ data: paths.map((path) => ({ path })) });
}

async function handlePublicMedia(request, env) {
  if (!env.O2OL_MEDIA) return new Response('Media storage is not configured', { status: 503 });

  const url = new URL(request.url);
  const segments = decodePathSegments(url.pathname);
  if (segments.length < 3) return new Response('Not found', { status: 404 });

  const [, bucket, ...parts] = segments;
  const key = `${bucket}/${parts.join('/')}`;
  const object = await env.O2OL_MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', headers.get('Cache-Control') || 'public, max-age=3600');
  return new Response(object.body, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'one2onelove',
        database: Boolean(env.NEON_DATA_API_URL),
        media: Boolean(env.O2OL_MEDIA),
      });
    }

    if (request.method === 'GET' && url.pathname === '/api/storage/list') {
      return handleStorageList(request, env);
    }

    if (request.method === 'DELETE' && url.pathname === '/api/storage') {
      return handleStorageDelete(request, env);
    }

    if (request.method === 'PUT' && url.pathname.startsWith('/api/storage/')) {
      const segments = decodePathSegments(url.pathname);
      const [, , bucket, ...parts] = segments;
      return handleStorageUpload(request, env, bucket, parts.join('/'));
    }

    if (request.method === 'GET' && url.pathname.startsWith('/media/')) {
      return handlePublicMedia(request, env);
    }

    // Cloudflare Static Assets serves the existing Vite/React application.
    // SPA fallback is configured in wrangler.jsonc so approved routes continue
    // to resolve without changing the O2OL UX.
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('One2OneLove assets are not configured', { status: 503 });
  },
};
