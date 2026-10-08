// @ts-nocheck
// One2OneLove — TikTok Content Posting API integration (prelaunch build).
//
// Owner-only tool: a verified One2OneLove site session is required for every
// route in this module. The OAuth callback additionally requires the `state`
// value issued by /api/tiktok/connect (stored in an HttpOnly cookie), so a
// callback cannot be forged or replayed against a different browser session.
//
// Configuration (Cloudflare Worker secrets / vars — NEVER commit real values):
//   TIKTOK_CLIENT_KEY     (var or secret) TikTok app Client key
//   TIKTOK_CLIENT_SECRET  (secret)        TikTok app Client secret
//   TIKTOK_ENV            (var, optional) 'sandbox' | 'production' (default 'sandbox')
//   TIKTOK_REDIRECT_URI   (var, optional) defaults to the portal-registered URI
//                         https://one2onelove.com/api/tiktok/callback
//                         (exact match, no trailing slash — changing it here
//                         without changing it in the TikTok portal breaks OAuth)
//
// TikTok tokens are stored server-side only (public.tiktok_connections in the
// Neon database) and are never returned to the browser. Nothing in this module
// logs tokens, authorization codes, or the client secret.
//
// Posting flow follows TikTok's Direct Post guide:
//   creator_info/query (called before EVERY post) ->
//   post/publish/video/init (FILE_UPLOAD / push_by_file) ->
//   chunked PUT to the TikTok upload URL (proxied through this worker so the
//   upload URL never leaves the server) ->
//   post/publish/status/fetch polled by the page until PUBLISH_COMPLETE.
// The MEDIA_UPLOAD post mode is the Upload-to-TikTok (draft / inbox) route and
// uses the video.upload scope; DIRECT_POST uses video.publish.

import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const TIKTOK_AUTHORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_CREATOR_INFO_URL = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';
const TIKTOK_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
const TIKTOK_STATUS_URL = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';

const DEFAULT_REDIRECT_URI = 'https://one2onelove.com/api/tiktok/callback';
const SCOPES = 'user.info.basic,video.publish,video.upload';
// TikTok upload rules: a chunk is at most 64 MB and (except the final chunk)
// at least 5 MB. 10 MB chunks keep Worker request bodies comfortably small.
const CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 256 * 1024 * 1024; // generous ceiling; creator_info duration rules still apply
const STATE_COOKIE = 'o2ol_tiktok_oauth_state';
const POST_PAGE = '/TikTokPost';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...HEADERS, ...extraHeaders } });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

export function tiktokConfig(env) {
  const clientKey = String(env.TIKTOK_CLIENT_KEY || '').trim();
  const clientSecret = String(env.TIKTOK_CLIENT_SECRET || '').trim();
  return {
    configured: Boolean(clientKey && clientSecret),
    clientKey,
    clientSecret,
    environment: String(env.TIKTOK_ENV || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox',
    redirectUri: String(env.TIKTOK_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim() || DEFAULT_REDIRECT_URI,
  };
}

async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie || !env.NEON_AUTH_BASE_URL) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}

async function withDb(env, fn) {
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error('The database is not configured on this deployment (HYPERDRIVE binding missing).');
  }
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.tiktok_connections (
      user_id uuid PRIMARY KEY,
      open_id text NOT NULL,
      access_token text NOT NULL,
      refresh_token text,
      access_expires_at timestamptz,
      refresh_expires_at timestamptz,
      scope text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS public.tiktok_posts (
      publish_id text PRIMARY KEY,
      user_id uuid NOT NULL,
      upload_url text NOT NULL,
      video_size bigint NOT NULL,
      chunk_size integer NOT NULL,
      post_mode text NOT NULL DEFAULT 'DIRECT_POST',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  schemaReady = true;
}

async function getConnection(env, userId) {
  return withDb(env, async (db) => {
    await ensureSchema(db);
    const { rows } = await db.query('SELECT * FROM public.tiktok_connections WHERE user_id = $1 LIMIT 1', [userId]);
    return rows[0] || null;
  });
}

async function saveConnection(env, userId, tokens) {
  const now = Date.now();
  const accessExpires = tokens.expires_in ? new Date(now + Number(tokens.expires_in) * 1000) : null;
  const refreshExpires = tokens.refresh_expires_in ? new Date(now + Number(tokens.refresh_expires_in) * 1000) : null;
  await withDb(env, async (db) => {
    await ensureSchema(db);
    await db.query(
      `INSERT INTO public.tiktok_connections
         (user_id, open_id, access_token, refresh_token, access_expires_at, refresh_expires_at, scope, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,now())
       ON CONFLICT (user_id) DO UPDATE SET
         open_id = EXCLUDED.open_id,
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, public.tiktok_connections.refresh_token),
         access_expires_at = EXCLUDED.access_expires_at,
         refresh_expires_at = COALESCE(EXCLUDED.refresh_expires_at, public.tiktok_connections.refresh_expires_at),
         scope = EXCLUDED.scope,
         updated_at = now()`,
      [userId, tokens.open_id, tokens.access_token, tokens.refresh_token || null,
       accessExpires, refreshExpires, tokens.scope || SCOPES],
    );
  });
}

async function deleteConnection(env, userId) {
  await withDb(env, async (db) => {
    await ensureSchema(db);
    await db.query('DELETE FROM public.tiktok_connections WHERE user_id = $1', [userId]);
  });
}

async function tiktokTokenRequest(env, params) {
  const cfg = tiktokConfig(env);
  const body = new URLSearchParams({
    client_key: cfg.clientKey,
    client_secret: cfg.clientSecret,
    ...params,
  });
  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    const detail = payload?.error_description || payload?.error || `HTTP ${response.status}`;
    throw new Error(`TikTok token request failed: ${detail}`);
  }
  return payload;
}

// Returns a valid access token for the connection, refreshing when expired.
// Returns null when the connection must be re-authorized.
async function validAccessToken(env, connection) {
  const expiresAt = connection.access_expires_at ? new Date(connection.access_expires_at).getTime() : 0;
  if (connection.access_token && expiresAt > Date.now() + 60_000) return connection.access_token;
  if (!connection.refresh_token) return null;
  if (connection.refresh_expires_at && new Date(connection.refresh_expires_at).getTime() < Date.now()) return null;
  try {
    const tokens = await tiktokTokenRequest(env, {
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
    });
    await saveConnection(env, connection.user_id, { ...tokens, open_id: tokens.open_id || connection.open_id });
    return tokens.access_token;
  } catch {
    return null;
  }
}

async function tiktokApi(env, accessToken, url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(payload ?? {}),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || (body?.error && body.error.code && body.error.code !== 'ok')) {
    const detail = body?.error?.message || body?.error?.code || `HTTP ${response.status}`;
    throw new Error(`TikTok API request failed: ${detail}`);
  }
  return body?.data ?? {};
}

async function queryCreatorInfo(env, accessToken) {
  return tiktokApi(env, accessToken, TIKTOK_CREATOR_INFO_URL, {});
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function randomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Expected application/json body.');
  }
  return request.json();
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function handleConnect(request, env, cfg) {
  if (!cfg.configured) {
    return fail('TikTok posting is not configured on this deployment yet (client key/secret missing).', 503, 'tiktok_not_configured');
  }
  const state = randomState();
  const authorize = new URL(TIKTOK_AUTHORIZE_URL);
  authorize.searchParams.set('client_key', cfg.clientKey);
  authorize.searchParams.set('scope', SCOPES);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('redirect_uri', cfg.redirectUri);
  authorize.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      location: authorize.toString(),
      'set-cookie': `${STATE_COOKIE}=${encodeURIComponent(state)}; Path=/api/tiktok; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      'cache-control': 'no-store',
    },
  });
}

async function handleCallback(request, env, url, cfg) {
  const back = (params) => new Response(null, {
    status: 302,
    headers: {
      location: `${POST_PAGE}?${params}`,
      'set-cookie': `${STATE_COOKIE}=; Path=/api/tiktok; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      'cache-control': 'no-store',
    },
  });
  if (!cfg.configured) return back('tiktok=error&reason=not_configured');
  const auth = await session(request, env);
  if (!auth) return back('tiktok=error&reason=site_signin_required');
  const expectedState = readCookie(request, STATE_COOKIE);
  const state = url.searchParams.get('state');
  if (!expectedState || !state || state !== expectedState) {
    return back('tiktok=error&reason=state_mismatch');
  }
  const code = url.searchParams.get('code');
  if (!code) return back('tiktok=error&reason=no_code');
  try {
    const tokens = await tiktokTokenRequest(env, {
      code,
      grant_type: 'authorization_code',
      redirect_uri: cfg.redirectUri,
    });
    if (!tokens.open_id) throw new Error('TikTok did not return an open_id.');
    await saveConnection(env, auth.user.id, tokens);
    return back('tiktok=connected');
  } catch {
    return back('tiktok=error&reason=exchange_failed');
  }
}

async function handleStatus(request, env, cfg) {
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  const base = { ok: true, configured: cfg.configured, environment: cfg.environment, connected: false };
  if (!cfg.configured) return json(base);
  const connection = await getConnection(env, auth.user.id);
  if (!connection) return json(base);
  const accessToken = await validAccessToken(env, connection);
  if (!accessToken) return json({ ...base, reconnectRequired: true });
  let creator = null;
  try {
    creator = await queryCreatorInfo(env, accessToken);
  } catch {
    creator = null;
  }
  return json({ ...base, connected: true, creator });
}

async function handleCreatorInfo(request, env) {
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  const connection = await getConnection(env, auth.user.id);
  if (!connection) return fail('No TikTok account is connected.', 409, 'tiktok_not_connected');
  const accessToken = await validAccessToken(env, connection);
  if (!accessToken) return fail('TikTok authorization has expired. Reconnect the account.', 409, 'tiktok_reconnect_required');
  const creator = await queryCreatorInfo(env, accessToken);
  return json({ ok: true, creator });
}

const PRIVACY_LEVELS = new Set([
  'PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY',
]);

async function handleInit(request, env) {
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  const body = await readJson(request);
  const connection = await getConnection(env, auth.user.id);
  if (!connection) return fail('No TikTok account is connected.', 409, 'tiktok_not_connected');
  const accessToken = await validAccessToken(env, connection);
  if (!accessToken) return fail('TikTok authorization has expired. Reconnect the account.', 409, 'tiktok_reconnect_required');

  const postMode = body.post_mode === 'MEDIA_UPLOAD' ? 'MEDIA_UPLOAD' : 'DIRECT_POST';
  const videoSize = Number(body.video_size);
  if (!Number.isFinite(videoSize) || videoSize <= 0 || videoSize > MAX_VIDEO_BYTES) {
    return fail('A valid video file size is required.', 400, 'invalid_video_size');
  }
  const title = String(body.title || '').trim();
  if (!title) return fail('A title/caption is required before posting.', 400, 'title_required');
  if (title.length > 2200) return fail('Title/caption can be up to 2,200 characters.', 400, 'title_too_long');

  // Packet rule: creator_info is queried before EVERY post and the post is
  // validated against what the creator's account actually allows.
  const creator = await queryCreatorInfo(env, accessToken);

  const chunkSize = videoSize <= CHUNK_SIZE ? videoSize : CHUNK_SIZE;
  const totalChunkCount = Math.ceil(videoSize / chunkSize);

  let initPayload;
  if (postMode === 'MEDIA_UPLOAD') {
    // Draft / inbox route (video.upload): fewer post_info fields are accepted;
    // the creator finishes the post inside TikTok.
    initPayload = {
      media_type: 'VIDEO',
      post_mode: 'MEDIA_UPLOAD',
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount,
      },
    };
  } else {
    const privacyLevel = String(body.privacy_level || '');
    if (!PRIVACY_LEVELS.has(privacyLevel)) {
      return fail('Choose who can view this post before posting.', 400, 'privacy_required');
    }
    const allowed = Array.isArray(creator.privacy_level_options) ? creator.privacy_level_options : [];
    if (allowed.length && !allowed.includes(privacyLevel)) {
      return fail('That privacy level is not available for the connected TikTok account.', 400, 'privacy_not_allowed');
    }
    const brandContent = body.brand_content_toggle === true;
    const brandOrganic = body.brand_organic_toggle === true;
    const disclose = brandContent || brandOrganic;
    if (brandContent && privacyLevel === 'SELF_ONLY') {
      return fail('Branded content cannot be private. Choose a different privacy level.', 400, 'branded_content_private');
    }
    initPayload = {
      media_type: 'VIDEO',
      post_mode: 'DIRECT_POST',
      post_info: {
        title,
        privacy_level: privacyLevel,
        disable_duet: body.disable_duet !== false,
        disable_comment: body.disable_comment !== false,
        disable_stitch: body.disable_stitch !== false,
        video_cover_timestamp_ms: Number(body.video_cover_timestamp_ms) || 1000,
        brand_content_toggle: brandContent,
        brand_organic_toggle: brandOrganic,
        is_aigc: body.is_aigc === true,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount,
      },
    };
    if (!disclose) {
      initPayload.post_info.brand_content_toggle = false;
      initPayload.post_info.brand_organic_toggle = false;
    }
  }

  const data = await tiktokApi(env, accessToken, TIKTOK_INIT_URL, initPayload);
  if (!data.publish_id || !data.upload_url) throw new Error('TikTok did not return an upload session.');

  await withDb(env, async (db) => {
    await ensureSchema(db);
    await db.query(
      `INSERT INTO public.tiktok_posts (publish_id, user_id, upload_url, video_size, chunk_size, post_mode)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (publish_id) DO UPDATE SET upload_url = EXCLUDED.upload_url`,
      [data.publish_id, auth.user.id, data.upload_url, videoSize, chunkSize, postMode],
    );
  });

  return json({ ok: true, publish_id: data.publish_id, chunk_size: chunkSize, total_chunk_count: totalChunkCount, post_mode: postMode });
}

async function handleChunk(request, env, url) {
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  const publishId = url.searchParams.get('publish_id');
  const index = Number(url.searchParams.get('index'));
  if (!publishId || !Number.isInteger(index) || index < 0) {
    return fail('publish_id and a valid chunk index are required.', 400, 'invalid_chunk');
  }
  const post = await withDb(env, async (db) => {
    await ensureSchema(db);
    const { rows } = await db.query(
      'SELECT * FROM public.tiktok_posts WHERE publish_id = $1 AND user_id = $2 LIMIT 1',
      [publishId, auth.user.id],
    );
    return rows[0] || null;
  });
  if (!post) return fail('Upload session not found.', 404, 'upload_not_found');

  const bytes = new Uint8Array(await request.arrayBuffer());
  const start = index * Number(post.chunk_size);
  const end = start + bytes.length - 1;
  if (bytes.length === 0 || start >= Number(post.video_size) || end >= Number(post.video_size)) {
    return fail('Chunk is outside the declared video size.', 400, 'chunk_out_of_range');
  }
  const response = await fetch(post.upload_url, {
    method: 'PUT',
    headers: {
      'content-type': 'video/mp4',
      'content-length': String(bytes.length),
      'content-range': `bytes ${start}-${end}/${post.video_size}`,
    },
    body: bytes,
  });
  if (!response.ok && response.status !== 201 && response.status !== 206) {
    return fail(`TikTok upload rejected chunk ${index} (HTTP ${response.status}).`, 502, 'chunk_upload_failed');
  }
  return json({ ok: true, index, uploaded: end + 1, total: Number(post.video_size) });
}

async function handlePublishStatus(request, env) {
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  const body = await readJson(request);
  const publishId = String(body.publish_id || '');
  if (!publishId) return fail('publish_id is required.', 400, 'publish_id_required');
  const connection = await getConnection(env, auth.user.id);
  if (!connection) return fail('No TikTok account is connected.', 409, 'tiktok_not_connected');
  const accessToken = await validAccessToken(env, connection);
  if (!accessToken) return fail('TikTok authorization has expired. Reconnect the account.', 409, 'tiktok_reconnect_required');
  const data = await tiktokApi(env, accessToken, TIKTOK_STATUS_URL, { publish_id: publishId });
  return json({
    ok: true,
    status: data.status || 'UNKNOWN',
    publicaly_available_post_id: data.publicaly_available_post_id || [],
    fail_reason: data.fail_reason || null,
  });
}

async function handleDisconnect(request, env) {
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  await deleteConnection(env, auth.user.id);
  return json({ ok: true });
}

export async function handleTikTokRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/tiktok')) return null;
  const cfg = tiktokConfig(env);
  try {
    if (url.pathname === '/api/tiktok/connect' && request.method === 'GET') {
      const auth = await session(request, env);
      if (!auth) return fail('Authentication required.', 401, 'unauthorized');
      return handleConnect(request, env, cfg);
    }
    if (url.pathname === '/api/tiktok/callback' && request.method === 'GET') {
      return await handleCallback(request, env, url, cfg);
    }
    if (url.pathname === '/api/tiktok/status' && request.method === 'GET') {
      return await handleStatus(request, env, cfg);
    }
    if (url.pathname === '/api/tiktok/creator-info' && request.method === 'POST') {
      return await handleCreatorInfo(request, env);
    }
    if (url.pathname === '/api/tiktok/post/init' && request.method === 'POST') {
      return await handleInit(request, env);
    }
    if (url.pathname === '/api/tiktok/post/chunk' && request.method === 'PUT') {
      return await handleChunk(request, env, url);
    }
    if (url.pathname === '/api/tiktok/post/status' && request.method === 'POST') {
      return await handlePublishStatus(request, env);
    }
    if (url.pathname === '/api/tiktok/disconnect' && request.method === 'POST') {
      return await handleDisconnect(request, env);
    }
    return fail('Not found.', 404, 'not_found');
  } catch (err) {
    // Never log tokens/codes: err messages from this module contain only
    // TikTok error descriptions and HTTP statuses.
    console.error('tiktok request failed:', err?.message || 'unknown error');
    return fail(err?.message || 'TikTok request failed.', 502, 'tiktok_upstream_error');
  }
}
