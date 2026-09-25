// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function randomToken(bytes=32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2,'0')).join('');
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
}

async function authSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && session ? { user, session } : null;
}

async function ensureTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_game_launch_tickets (
      token_hash text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      game text NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_game_launch_tickets_user
      ON public.o2ol_game_launch_tickets(user_id, expires_at DESC)
  `);
}

export async function handleGameAccessRequest(request, env, url) {
  if (url.pathname !== '/api/games/scratch/launch') return null;
  if (request.method !== 'POST') return json({ ok:false, error:{ code:'method_not_allowed', message:'Method not allowed.' } },405);

  const auth = await authSession(request, env);
  if (!auth) return json({ ok:false, error:{ code:'unauthorized', message:'Sign in required.' } },401);

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    await ensureTable(db);
    await db.query('DELETE FROM public.o2ol_game_launch_tickets WHERE expires_at < now()');
    await db.query(
      `INSERT INTO public.o2ol_game_launch_tickets(token_hash,user_id,game,expires_at)
       VALUES($1,$2::uuid,'scratch',$3)`,
      [tokenHash,auth.user.id,expiresAt.toISOString()],
    );
    return json({ ok:true, token, expiresAt:expiresAt.toISOString() });
  } finally {
    await db.end();
  }
}
