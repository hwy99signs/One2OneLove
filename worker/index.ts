// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const PROFILE_FIELDS = new Set([
  'name', 'relationship_status', 'anniversary_date', 'partner_email', 'avatar_url',
  'bio', 'location', 'interests', 'love_language', 'date_frequency',
  'communication_style', 'conflict_resolution', 'partner_name',
]);

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function error(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function withDb(env, fn) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

function copyAuthResponseHeaders(upstreamHeaders) {
  const headers = new Headers(upstreamHeaders);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');

  // Better Auth normally emits host-only cookies. If an upstream Domain attribute
  // ever appears, remove it so the proxied cookie remains scoped to One2OneLove.
  const getSetCookie = upstreamHeaders.getSetCookie?.bind(upstreamHeaders);
  if (getSetCookie) {
    const cookies = getSetCookie();
    if (cookies.length) {
      headers.delete('set-cookie');
      for (const cookie of cookies) {
        headers.append('set-cookie', cookie.replace(/;\s*Domain=[^;]+/ig, ''));
      }
    }
  }
  return headers;
}

async function proxyAuth(request, env, url) {
  const suffix = url.pathname.slice('/api/auth'.length) || '/';
  const upstream = new URL(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + suffix);
  upstream.search = url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const upstreamResponse = await fetch(upstream.toString(), {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: copyAuthResponseHeaders(upstreamResponse.headers),
  });
}

async function getSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  const headers = new Headers();
  headers.set('cookie', cookie);
  headers.set('accept', 'application/json');

  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    method: 'GET',
    headers,
  });
  if (!res.ok) return null;

  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  if (!user?.id || !session) return null;
  return { user, session };
}

async function requireUser(request, env) {
  const auth = await getSession(request, env);
  if (!auth) return { response: error('Authentication required.', 401, 'unauthorized') };

  // Ensure every authenticated Neon user has an application profile.
  await withDb(env, async (db) => {
    await db.query(
      `INSERT INTO public.users (id, email, name, user_type, is_active)
       VALUES ($1::uuid, $2, $3, 'regular', true)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = COALESCE(NULLIF(public.users.name, ''), EXCLUDED.name),
         is_active = true`,
      [auth.user.id, auth.user.email, auth.user.name || auth.user.email?.split('@')[0] || 'Member'],
    );
  });

  return { auth };
}

async function readJson(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('Expected application/json body.');
  return await request.json();
}

function cleanText(value, max = 5000, required = false) {
  if (value == null) {
    if (required) throw new Error('Required text value is missing.');
    return null;
  }
  const text = String(value).trim();
  if (required && !text) throw new Error('Required text value is empty.');
  if (text.length > max) throw new Error(`Text value exceeds ${max} characters.`);
  return text || null;
}

async function profileRoute(request, env, auth) {
  if (request.method === 'GET') {
    return withDb(env, async (db) => {
      const result = await db.query(
        `SELECT id,email,name,user_type,relationship_status,anniversary_date,partner_email,
                avatar_url,bio,is_verified,is_active,location,interests,love_language,
                date_frequency,communication_style,conflict_resolution,partner_name,
                profile_completion_percentage,profile_completed_fields,profile_total_fields,
                subscription_plan,subscription_price,subscription_status,
                subscription_current_period_start,subscription_current_period_end,
                cancel_at_period_end,created_at,updated_at
         FROM public.users WHERE id=$1::uuid`,
        [auth.user.id],
      );
      return json({ ok: true, profile: result.rows[0] || null });
    });
  }

  if (request.method === 'PATCH') {
    const body = await readJson(request);
    const entries = Object.entries(body || {}).filter(([key]) => PROFILE_FIELDS.has(key));
    if (!entries.length) return error('No supported profile fields were provided.');

    const sets = [];
    const values = [];
    for (const [key, rawValue] of entries) {
      let value = rawValue;
      if (key === 'interests') {
        if (!Array.isArray(value)) return error('interests must be an array.');
        value = JSON.stringify(value.slice(0, 50));
        values.push(value);
        sets.push(`${key}=$${values.length}::jsonb`);
      } else {
        if (typeof value === 'string' && value.length > 5000) return error(`${key} is too long.`);
        values.push(value === '' ? null : value);
        sets.push(`${key}=$${values.length}`);
      }
    }
    values.push(auth.user.id);

    return withDb(env, async (db) => {
      const result = await db.query(
        `UPDATE public.users SET ${sets.join(', ')}, updated_at=now()
         WHERE id=$${values.length}::uuid RETURNING *`,
        values,
      );
      return json({ ok: true, profile: result.rows[0] });
    });
  }

  return error('Method not allowed.', 405, 'method_not_allowed');
}

async function sentLoveNotesRoute(request, env, auth) {
  if (request.method === 'GET') {
    return withDb(env, async (db) => {
      const result = await db.query(
        `SELECT id,note_title,note_content,recipient_type,recipient_identifier,social_platform,sent_date,created_at
         FROM public.sent_love_notes WHERE user_id=$1::uuid ORDER BY sent_date DESC LIMIT 200`,
        [auth.user.id],
      );
      return json({ ok: true, notes: result.rows });
    });
  }

  if (request.method === 'POST') {
    const body = await readJson(request);
    const title = cleanText(body.note_title, 250, true);
    const content = cleanText(body.note_content, 10000, true);
    const recipientType = cleanText(body.recipient_type, 50, true);
    const allowedTypes = new Set(['partner', 'sms', 'social_media', 'other']);
    if (!allowedTypes.has(recipientType)) return error('Invalid recipient_type.');
    const recipient = cleanText(body.recipient_identifier, 500, false);
    const platform = cleanText(body.social_platform, 100, false);

    return withDb(env, async (db) => {
      const result = await db.query(
        `INSERT INTO public.sent_love_notes
          (user_id,note_title,note_content,recipient_type,recipient_identifier,social_platform,created_by)
         VALUES ($1::uuid,$2,$3,$4,$5,$6,$1::uuid)
         RETURNING id,note_title,note_content,recipient_type,recipient_identifier,social_platform,sent_date,created_at`,
        [auth.user.id, title, content, recipientType, recipient, platform],
      );
      return json({ ok: true, note: result.rows[0] }, 201);
    });
  }

  return error('Method not allowed.', 405, 'method_not_allowed');
}

async function scheduledLoveNotesRoute(request, env, auth, url) {
  const cancelMatch = url.pathname.match(/^\/api\/love-notes\/scheduled\/([0-9a-f-]{36})\/cancel$/i);
  if (cancelMatch) {
    if (request.method !== 'PATCH' && request.method !== 'POST') {
      return error('Method not allowed.', 405, 'method_not_allowed');
    }
    return withDb(env, async (db) => {
      const result = await db.query(
        `UPDATE public.scheduled_love_notes SET status='cancelled',updated_at=now()
         WHERE id=$1::uuid AND user_id=$2::uuid AND status IN ('scheduled','failed')
         RETURNING id,status,updated_at`,
        [cancelMatch[1], auth.user.id],
      );
      if (!result.rows[0]) return error('Scheduled note not found or cannot be cancelled.', 404, 'not_found');
      return json({ ok: true, note: result.rows[0] });
    });
  }

  if (request.method === 'GET') {
    return withDb(env, async (db) => {
      const result = await db.query(
        `SELECT id,note_title,note_content,scheduled_date,scheduled_time,scheduled_timezone,
                recipient_phone,delivery_method,note_language,status,attempts,last_attempt_at,
                sent_at,failure_reason,created_at,updated_at
         FROM public.scheduled_love_notes WHERE user_id=$1::uuid
         ORDER BY scheduled_date DESC,scheduled_time DESC LIMIT 200`,
        [auth.user.id],
      );
      return json({ ok: true, notes: result.rows });
    });
  }

  if (request.method === 'POST') {
    const body = await readJson(request);
    const title = cleanText(body.note_title, 250, true);
    const content = cleanText(body.note_content, 10000, true);
    const scheduledDate = cleanText(body.scheduled_date, 10, true);
    const scheduledTime = cleanText(body.scheduled_time, 8, true);
    const scheduledTimezone = cleanText(body.scheduled_timezone || 'UTC', 100, true);
    const recipientPhone = cleanText(body.recipient_phone, 100, true);
    const deliveryMethod = cleanText(body.delivery_method || 'sms', 20, true);
    const language = cleanText(body.note_language || 'en', 10, true);
    if (!new Set(['sms', 'email', 'whatsapp']).has(deliveryMethod)) return error('Invalid delivery_method.');

    // Validate that Postgres recognizes the supplied IANA timezone before insert.
    return withDb(env, async (db) => {
      const zone = await db.query(`SELECT 1 FROM pg_timezone_names WHERE name=$1 LIMIT 1`, [scheduledTimezone]);
      if (!zone.rowCount) return error('Invalid scheduled_timezone.');
      const result = await db.query(
        `INSERT INTO public.scheduled_love_notes
          (user_id,note_title,note_content,scheduled_date,scheduled_time,scheduled_timezone,
           recipient_phone,delivery_method,note_language,status)
         VALUES ($1::uuid,$2,$3,$4::date,$5::time,$6,$7,$8,$9,'scheduled')
         RETURNING id,note_title,note_content,scheduled_date,scheduled_time,scheduled_timezone,
                   recipient_phone,delivery_method,note_language,status,created_at,updated_at`,
        [auth.user.id, title, content, scheduledDate, scheduledTime, scheduledTimezone,
         recipientPhone, deliveryMethod, language],
      );
      return json({ ok: true, note: result.rows[0] }, 201);
    });
  }

  return error('Method not allowed.', 405, 'method_not_allowed');
}

async function assetRoute(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return error('Method not allowed.', 405, 'method_not_allowed');
  }
  if (url.pathname !== '/api/assets/brand/logo') return error('Asset not found.', 404, 'not_found');
  const object = await env.MEDIA.get('brand/one2onelove-logo.png');
  if (!object) return error('Official logo is not available.', 404, 'not_found');
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=86400');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

async function healthRoute(env) {
  return withDb(env, async (db) => {
    const result = await db.query(
      `SELECT current_database() AS database,
              EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') AS users_ready,
              EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='scheduled_love_notes') AS love_notes_ready,
              (SELECT count(*)::int FROM public.app_migrations) AS migration_count`,
    );
    return json({
      ok: true,
      service: 'one2onelove-api',
      database: result.rows[0]?.database,
      users_ready: result.rows[0]?.users_ready,
      love_notes_ready: result.rows[0]?.love_notes_ready,
      migration_count: result.rows[0]?.migration_count,
      auth_proxy: true,
      storage: 'r2',
    });
  });
}

async function dueLoveNotesCheck(env) {
  return withDb(env, async (db) => {
    const result = await db.query(`SELECT count(*)::int AS due_count FROM public.due_scheduled_love_notes`);
    return result.rows[0]?.due_count || 0;
  });
}

async function handleFetch(request, env) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/auth')) return proxyAuth(request, env, url);
  if (url.pathname === '/api/health') return healthRoute(env);
  if (url.pathname.startsWith('/api/assets/')) return assetRoute(request, env, url);

  if (!url.pathname.startsWith('/api/')) return error('Not found.', 404, 'not_found');

  const required = await requireUser(request, env);
  if (required.response) return required.response;
  const auth = required.auth;

  if (url.pathname === '/api/profile') return profileRoute(request, env, auth);
  if (url.pathname === '/api/love-notes/sent') return sentLoveNotesRoute(request, env, auth);
  if (url.pathname === '/api/love-notes/scheduled' || url.pathname.includes('/api/love-notes/scheduled/')) {
    return scheduledLoveNotesRoute(request, env, auth, url);
  }

  return error('API route not found.', 404, 'not_found');
}

export default {
  async fetch(request, env) {
    try {
      return await handleFetch(request, env);
    } catch (err) {
      console.error('One2OneLove API error', err);
      return error('Unexpected server error.', 500, 'internal_error');
    }
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const dueCount = await dueLoveNotesCheck(env);
        console.log(`One2OneLove scheduled Love Notes due: ${dueCount}. Delivery remains disabled until an approved provider is configured.`);
      } catch (err) {
        console.error('Scheduled Love Notes queue check failed', err);
      }
    })());
  },
};
