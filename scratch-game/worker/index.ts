import { Client } from "pg";

interface Env {
  ASSETS: Fetcher;
  HYPERDRIVE: Hyperdrive;
  ADMIN_KEY_HASH?: string;
  DEBUG_ERRORS?: string;
}

const RELATIONSHIPS = new Set([
  "Dating",
  "Engaged",
  "Married",
  "Committed / Unmarried"
]);

const CATEGORIES = new Set([
  "Communication",
  "Trust",
  "Fun",
  "Intimacy",
  "Money",
  "Future",
  "Conflict",
  "Deep Questions",
  "Digital Communication",
  "Electronic Devices",
  "Social Media",
  "AI Bot Relationships"
]);

const EVENT_TYPES = new Set([
  "account_created",
  "login",
  "game_started",
  "card_drawn",
  "card_revealed",
  "next_card",
  "deck_completed",
  "game_home",
  "app_installed"
]);

const SESSION_COOKIE = "o2ol_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 60000;

function json(data: unknown, status = 200, extraHeaders: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "referrer-policy": "same-origin",
      ...extraHeaders
    }
  });
}

function textResponse(text: string, status = 200, headers: Record<string,string> = {}) {
  return new Response(text, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      ...headers
    }
  });
}

async function withDb(env: Env, fn: (client: Client) => Promise<Response>) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    try { await client.end(); } catch {}
  }
}

async function ensureSchema(client: Client) {
  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_scratch_questions (
      id text PRIMARY KEY,
      relationship_type text NOT NULL,
      category text NOT NULL,
      depth text NOT NULL,
      question text NOT NULL,
      footer text NOT NULL DEFAULT '',
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_questions_draw
      ON public.o2ol_scratch_questions (relationship_type, category, active)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_scratch_users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      username text NOT NULL,
      username_key text NOT NULL UNIQUE,
      password_salt text NOT NULL,
      password_hash text NOT NULL,
      marketing_opt_in boolean NOT NULL DEFAULT false,
      marketing_opted_at timestamptz NULL,
      terms_accepted_at timestamptz NOT NULL DEFAULT now(),
      is_test boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_login_at timestamptz NULL
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_users_created
      ON public.o2ol_scratch_users (created_at DESC)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_scratch_sessions (
      token_hash text PRIMARY KEY,
      user_id text NOT NULL REFERENCES public.o2ol_scratch_users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_sessions_user
      ON public.o2ol_scratch_sessions (user_id, expires_at DESC)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_scratch_events (
      id bigserial PRIMARY KEY,
      user_id text NOT NULL REFERENCES public.o2ol_scratch_users(id) ON DELETE CASCADE,
      event_type text NOT NULL,
      game_session_id text NULL,
      player_count int NULL,
      relationship_type text NULL,
      category text NULL,
      card_id text NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_events_time
      ON public.o2ol_scratch_events (created_at DESC)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_events_user_type
      ON public.o2ol_scratch_events (user_id, event_type, created_at DESC)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_events_game
      ON public.o2ol_scratch_events (game_session_id, event_type)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_scratch_auth_attempts (
      id bigserial PRIMARY KEY,
      key_hash text NOT NULL,
      action text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_auth_attempts_lookup
      ON public.o2ol_scratch_auth_attempts (key_hash, action, created_at DESC)
  `);
}

function normalizeEmail(v: unknown) {
  return String(v || "").trim().toLowerCase();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function normalizeUsername(v: unknown) {
  return String(v || "").trim();
}

function validUsername(username: string) {
  return /^[A-Za-z0-9_.-]{3,24}$/.test(username);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function randomHex(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

async function derivePassword(password: string, saltBase64: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBytes(saltBase64),
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256"
    },
    key,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseCookies(req: Request) {
  const raw = req.headers.get("cookie") || "";
  const out: Record<string,string> = {};
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

async function createSession(client: Client, userId: string) {
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  await client.query(
    `INSERT INTO public.o2ol_scratch_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + interval '30 days')`,
    [tokenHash, userId]
  );
  return token;
}

async function getUser(client: Client, req: Request) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const result = await client.query(
    `SELECT u.id, u.email, u.username, u.marketing_opt_in
       FROM public.o2ol_scratch_sessions s
       JOIN public.o2ol_scratch_users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()
      LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

async function recordEvent(
  client: Client,
  userId: string,
  eventType: string,
  fields: {
    gameSessionId?: string | null;
    playerCount?: number | null;
    relationship?: string | null;
    category?: string | null;
    cardId?: string | null;
    metadata?: Record<string,unknown>;
  } = {}
) {
  await client.query(
    `INSERT INTO public.o2ol_scratch_events
      (user_id, event_type, game_session_id, player_count, relationship_type, category, card_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [
      userId,
      eventType,
      fields.gameSessionId || null,
      fields.playerCount || null,
      fields.relationship || null,
      fields.category || null,
      fields.cardId || null,
      JSON.stringify(fields.metadata || {})
    ]
  );
}

async function enforceRateLimit(
  client: Client,
  req: Request,
  action: string,
  identity: string,
  limit: number,
  minutes: number
) {
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const keyHash = await sha256Hex(`${action}|${ip}|${identity}`);
  const result = await client.query(
    `SELECT count(*)::int AS count
       FROM public.o2ol_scratch_auth_attempts
      WHERE key_hash=$1
        AND action=$2
        AND created_at > now() - ($3::text || ' minutes')::interval`,
    [keyHash, action, String(minutes)]
  );
  const count = Number(result.rows[0]?.count || 0);
  if (count >= limit) return false;
  await client.query(
    `INSERT INTO public.o2ol_scratch_auth_attempts (key_hash, action) VALUES ($1,$2)`,
    [keyHash, action]
  );
  return true;
}

async function health(env: Env) {
  try {
    return await withDb(env, async client => {
      await ensureSchema(client);
      const result = await client.query(
        "SELECT count(*)::int AS count FROM public.o2ol_scratch_questions WHERE active = TRUE"
      );
      const count = Number(result.rows[0]?.count || 0);
      return json({
        ok: count === 4800,
        service: "one2onelove-scratch-game",
        stack: "cloudflare-worker-neon-hyperdrive",
        questionCount: count,
        accountGate: "required",
        analytics: "enabled"
      }, count === 4800 ? 200 : 503);
    });
  } catch (error) {
    console.error("health error", error);
    return json({ ok: false, service: "one2onelove-scratch-game" }, 503);
  }
}

async function signup(req: Request, env: Env) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const email = normalizeEmail(body?.email);
  const username = normalizeUsername(body?.username);
  const password = String(body?.password || "");
  const marketingOptIn = body?.marketingOptIn === true;
  const acceptTerms = body?.acceptTerms === true;

  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!validUsername(username)) return json({ error: "Username must be 3–24 characters using letters, numbers, dots, underscores, or hyphens." }, 400);
  if (password.length < 8 || password.length > 12) return json({ error: "Password must be 8–12 characters." }, 400);
  if (!acceptTerms) return json({ error: "You must agree to the Terms and Privacy Policy." }, 400);

  try {
    return await withDb(env, async client => {
    await ensureSchema(client);
    const rateOk = await enforceRateLimit(client, req, "signup", email, 6, 60);
    if (!rateOk) return json({ error: "Too many signup attempts. Please try again later." }, 429);

    const hashResult = await client.query(
      "SELECT crypt(encode(digest($1, 'sha256'), 'hex'), gen_salt('bf', 10)) AS hash",
      [password]
    );
    const passwordHash = String(hashResult.rows[0]?.hash || "");
    if (!passwordHash) throw new Error("Password hashing unavailable");
    const salt = "pgcrypto-bf10-sha256-v1";
    const userId = crypto.randomUUID();
    const isTest = email.endsWith("@example.invalid");

    try {
      await client.query(
        `INSERT INTO public.o2ol_scratch_users
          (id,email,username,username_key,password_salt,password_hash,marketing_opt_in,marketing_opted_at,terms_accepted_at,is_test)
         VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $7 THEN now() ELSE NULL END,now(),$8)`,
        [userId, email, username, username.toLowerCase(), salt, passwordHash, marketingOptIn, isTest]
      );
    } catch (error: any) {
      if (error?.code === "23505") {
        const field = String(error?.constraint || "").includes("username") ? "username" : "email";
        return json({ error: `That ${field} is already in use.` }, 409);
      }
      throw error;
    }

    await recordEvent(client, userId, "account_created", { metadata: { marketingOptIn } });
    const token = await createSession(client, userId);

    return json({
      ok: true,
      user: { id: userId, email, username, marketingOptIn }
    }, 201, { "set-cookie": sessionCookie(token) });
    });
  } catch (error: any) {
    console.error("signup error", error);
    return json({ error: "Could not create account.", ...(env.DEBUG_ERRORS === "true" ? { detail: String(error?.message || error) } : {}) }, 500);
  }
}

async function login(req: Request, env: Env) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || "");
  if (!validEmail(email) || !password) return json({ error: "Email and password are required." }, 400);

  try {
    return await withDb(env, async client => {
    await ensureSchema(client);
    const rateOk = await enforceRateLimit(client, req, "login", email, 12, 15);
    if (!rateOk) return json({ error: "Too many login attempts. Please try again later." }, 429);

    const result = await client.query(
      `SELECT id,email,username,password_hash,password_salt,marketing_opt_in,
              CASE
                WHEN password_salt = 'pgcrypto-bf10-sha256-v1'
                  THEN (password_hash = crypt(encode(digest($2, 'sha256'), 'hex'), password_hash))
                ELSE (password_hash = crypt($2, password_hash))
              END AS password_ok
         FROM public.o2ol_scratch_users WHERE email=$1 LIMIT 1`,
      [email, password]
    );
    const row = result.rows[0];
    if (!row || row.password_ok !== true) return json({ error: "Email or password is incorrect." }, 401);

    await client.query("UPDATE public.o2ol_scratch_users SET last_login_at=now() WHERE id=$1", [row.id]);
    await recordEvent(client, row.id, "login");
    const token = await createSession(client, row.id);

    return json({
      ok: true,
      user: {
        id: row.id,
        email: row.email,
        username: row.username,
        marketingOptIn: row.marketing_opt_in
      }
    }, 200, { "set-cookie": sessionCookie(token) });
    });
  } catch (error: any) {
    console.error("login error", error);
    return json({ error: "Could not sign in.", ...(env.DEBUG_ERRORS === "true" ? { detail: String(error?.message || error) } : {}) }, 500);
  }
}

async function logout(req: Request, env: Env) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const token = parseCookies(req)[SESSION_COOKIE];
  return withDb(env, async client => {
    await ensureSchema(client);
    if (token) {
      const hash = await sha256Hex(token);
      await client.query("DELETE FROM public.o2ol_scratch_sessions WHERE token_hash=$1", [hash]);
    }
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
  });
}

async function me(req: Request, env: Env) {
  return withDb(env, async client => {
    await ensureSchema(client);
    const user = await getUser(client, req);
    if (!user) return json({ authenticated: false });
    return json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        marketingOptIn: user.marketing_opt_in
      }
    });
  });
}

async function drawQuestion(req: Request, env: Env) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const relationship = String(body?.relationship || "");
  const category = String(body?.category || "");
  const exclude = Array.isArray(body?.exclude) ? body.exclude.slice(-1200).map(String) : [];
  const avoidId = body?.avoidId ? String(body.avoidId) : null;

  if (!RELATIONSHIPS.has(relationship)) return json({ error: "Invalid relationship type" }, 400);
  if (!(CATEGORIES.has(category) || category === "Shuffle All")) return json({ error: "Invalid category" }, 400);

  try {
    return await withDb(env, async client => {
      await ensureSchema(client);
      const user = await getUser(client, req);
      if (!user) return json({ error: "Sign in required" }, 401);

      const params: any[] = [relationship, exclude, avoidId];
      let categoryClause = "";
      if (category !== "Shuffle All") {
        params.push(category);
        categoryClause = "AND category = $4";
      }

      const result = await client.query(
        `
          SELECT id, category, depth, question, footer
          FROM public.o2ol_scratch_questions
          WHERE active = TRUE
            AND relationship_type = $1
            ${categoryClause}
            AND NOT (id = ANY($2::text[]))
            AND ($3::text IS NULL OR id <> $3)
          ORDER BY random()
          LIMIT 1
        `,
        params
      );

      if (!result.rows.length) return json({ deckComplete: true }, 409);
      const row = result.rows[0];
      return json({
        card: {
          id: row.id,
          question: row.question,
          category: row.category,
          depth: row.depth,
          footer: row.footer || ""
        }
      });
    });
  } catch (error) {
    console.error("draw error", error);
    return json({ error: "Card unavailable" }, 503);
  }
}

async function analyticsEvent(req: Request, env: Env) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const eventType = String(body?.eventType || "");
  if (!EVENT_TYPES.has(eventType)) return json({ error: "Invalid event" }, 400);

  const gameSessionId = body?.gameSessionId ? String(body.gameSessionId).slice(0, 80) : null;
  const playerCount = Number.isFinite(Number(body?.playerCount)) ? Number(body.playerCount) : null;
  const relationship = body?.relationship ? String(body.relationship) : null;
  const category = body?.category ? String(body.category) : null;
  const cardId = body?.cardId ? String(body.cardId).slice(0, 120) : null;
  const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

  if (playerCount !== null && (playerCount < 1 || playerCount > 4)) return json({ error: "Invalid player count" }, 400);
  if (relationship && !RELATIONSHIPS.has(relationship)) return json({ error: "Invalid relationship type" }, 400);
  if (category && !(CATEGORIES.has(category) || category === "Shuffle All")) return json({ error: "Invalid category" }, 400);
  if (JSON.stringify(metadata).length > 2000) return json({ error: "Metadata too large" }, 400);

  return withDb(env, async client => {
    await ensureSchema(client);
    const user = await getUser(client, req);
    if (!user) return json({ error: "Sign in required" }, 401);
    await recordEvent(client, user.id, eventType, {
      gameSessionId, playerCount, relationship, category, cardId, metadata
    });
    return json({ ok: true });
  });
}

async function verifyAdmin(req: Request, env: Env) {
  const supplied = req.headers.get("x-o2ol-admin-key") || "";
  if (!supplied || !env.ADMIN_KEY_HASH) return false;
  const hash = await sha256Hex(supplied);
  return safeEqual(hash, env.ADMIN_KEY_HASH);
}

async function adminAnalytics(req: Request, env: Env) {
  if (!(await verifyAdmin(req, env))) return json({ error: "Unauthorized" }, 401);

  return withDb(env, async client => {
    await ensureSchema(client);

    const summary = await client.query(`
      SELECT
        (SELECT count(*)::int FROM public.o2ol_scratch_users WHERE is_test=FALSE) AS registered_users,
        (SELECT count(*)::int FROM public.o2ol_scratch_users WHERE is_test=FALSE AND marketing_opt_in=TRUE) AS marketing_opt_ins,
        (SELECT count(*)::int FROM public.o2ol_scratch_users WHERE is_test=FALSE AND created_at >= now()-interval '7 days') AS new_users_7d,
        (SELECT count(*)::int FROM public.o2ol_scratch_users WHERE is_test=FALSE AND created_at >= now()-interval '30 days') AS new_users_30d,
        (SELECT count(*)::int FROM public.o2ol_scratch_events e JOIN public.o2ol_scratch_users u ON u.id=e.user_id WHERE u.is_test=FALSE AND e.event_type='game_started') AS games_all,
        (SELECT count(*)::int FROM public.o2ol_scratch_events e JOIN public.o2ol_scratch_users u ON u.id=e.user_id WHERE u.is_test=FALSE AND e.event_type='game_started' AND e.created_at>=now()-interval '7 days') AS games_7d,
        (SELECT count(*)::int FROM public.o2ol_scratch_events e JOIN public.o2ol_scratch_users u ON u.id=e.user_id WHERE u.is_test=FALSE AND e.event_type='game_started' AND e.created_at>=now()-interval '30 days') AS games_30d,
        (SELECT count(*)::int FROM public.o2ol_scratch_events e JOIN public.o2ol_scratch_users u ON u.id=e.user_id WHERE u.is_test=FALSE AND e.event_type='card_revealed') AS cards_all,
        (SELECT count(*)::int FROM public.o2ol_scratch_events e JOIN public.o2ol_scratch_users u ON u.id=e.user_id WHERE u.is_test=FALSE AND e.event_type='card_revealed' AND e.created_at>=now()-interval '30 days') AS cards_30d,
        (SELECT count(DISTINCT e.user_id)::int FROM public.o2ol_scratch_events e JOIN public.o2ol_scratch_users u ON u.id=e.user_id WHERE u.is_test=FALSE AND e.event_type='game_started' AND e.created_at>=now()-interval '30 days') AS active_players_30d,
        (
          SELECT count(*)::int FROM (
            SELECT e.user_id
            FROM public.o2ol_scratch_events e
            JOIN public.o2ol_scratch_users u ON u.id=e.user_id
            WHERE u.is_test=FALSE AND e.event_type='game_started'
            GROUP BY e.user_id
            HAVING count(DISTINCT e.created_at::date) >= 2
          ) q
        ) AS returning_players
    `);

    const categories = await client.query(`
      SELECT e.category, count(*)::int AS games
      FROM public.o2ol_scratch_events e
      JOIN public.o2ol_scratch_users u ON u.id=e.user_id
      WHERE u.is_test=FALSE
        AND e.event_type='game_started'
        AND e.created_at>=now()-interval '30 days'
        AND e.category IS NOT NULL
      GROUP BY e.category
      ORDER BY games DESC, e.category
    `);

    const relationships = await client.query(`
      SELECT e.relationship_type AS relationship, count(*)::int AS games
      FROM public.o2ol_scratch_events e
      JOIN public.o2ol_scratch_users u ON u.id=e.user_id
      WHERE u.is_test=FALSE
        AND e.event_type='game_started'
        AND e.created_at>=now()-interval '30 days'
        AND e.relationship_type IS NOT NULL
      GROUP BY e.relationship_type
      ORDER BY games DESC, e.relationship_type
    `);

    const players = await client.query(`
      SELECT e.player_count, count(*)::int AS games
      FROM public.o2ol_scratch_events e
      JOIN public.o2ol_scratch_users u ON u.id=e.user_id
      WHERE u.is_test=FALSE
        AND e.event_type='game_started'
        AND e.created_at>=now()-interval '30 days'
        AND e.player_count IS NOT NULL
      GROUP BY e.player_count
      ORDER BY e.player_count
    `);

    const daily = await client.query(`
      WITH days AS (
        SELECT generate_series((current_date-29)::date,current_date::date,'1 day'::interval)::date AS day
      ),
      totals AS (
        SELECT e.created_at::date AS day, count(*)::int AS games
        FROM public.o2ol_scratch_events e
        JOIN public.o2ol_scratch_users u ON u.id=e.user_id
        WHERE u.is_test=FALSE
          AND e.event_type='game_started'
          AND e.created_at>=current_date-29
        GROUP BY e.created_at::date
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS day, coalesce(totals.games,0)::int AS games
      FROM days LEFT JOIN totals USING(day)
      ORDER BY days.day
    `);

    const avgCards = await client.query(`
      SELECT coalesce(round(avg(card_count)::numeric,1),0) AS avg_cards_per_game
      FROM (
        SELECT e.game_session_id, count(*)::int AS card_count
        FROM public.o2ol_scratch_events e
        JOIN public.o2ol_scratch_users u ON u.id=e.user_id
        WHERE u.is_test=FALSE
          AND e.event_type='card_revealed'
          AND e.created_at>=now()-interval '30 days'
          AND e.game_session_id IS NOT NULL
        GROUP BY e.game_session_id
      ) q
    `);

    return json({
      summary: {
        ...summary.rows[0],
        avg_cards_per_game: Number(avgCards.rows[0]?.avg_cards_per_game || 0)
      },
      categories: categories.rows,
      relationships: relationships.rows,
      playerCounts: players.rows,
      daily: daily.rows
    });
  });
}

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  return '"' + s.replace(/"/g, '""') + '"';
}

async function adminMarketingCsv(req: Request, env: Env) {
  if (!(await verifyAdmin(req, env))) return json({ error: "Unauthorized" }, 401);

  return withDb(env, async client => {
    await ensureSchema(client);
    const result = await client.query(`
      SELECT email, username, marketing_opted_at, created_at
      FROM public.o2ol_scratch_users
      WHERE is_test=FALSE AND marketing_opt_in=TRUE
      ORDER BY created_at DESC
    `);
    const lines = [
      ["email","username","marketing_opted_at","created_at"].map(csvEscape).join(","),
      ...result.rows.map(r => [r.email,r.username,r.marketing_opted_at,r.created_at].map(csvEscape).join(","))
    ];
    return textResponse(lines.join("\n"), 200, {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="one2onelove-marketing-opt-ins.csv"'
    });
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/health") return health(env);
    if (url.pathname === "/api/auth/signup") return signup(req, env);
    if (url.pathname === "/api/auth/login") return login(req, env);
    if (url.pathname === "/api/auth/logout") return logout(req, env);
    if (url.pathname === "/api/auth/me") return me(req, env);
    if (url.pathname === "/api/draw-question") return drawQuestion(req, env);
    if (url.pathname === "/api/analytics/event") return analyticsEvent(req, env);
    if (url.pathname === "/api/admin/analytics") return adminAnalytics(req, env);
    if (url.pathname === "/api/admin/marketing.csv") return adminMarketingCsv(req, env);

    if (url.pathname === "/privacy") {
      return Response.redirect("https://one2onelove-prelaunch.hwy99signs.workers.dev/PrivacyPolicy", 302);
    }
    if (url.pathname === "/terms") {
      return Response.redirect("https://one2onelove-prelaunch.hwy99signs.workers.dev/TermsOfService", 302);
    }

    return env.ASSETS.fetch(req);
  }
};
