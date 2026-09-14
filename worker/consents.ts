// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request') { return json({ ok: false, error: { code, message } }, status); }
async function withDb(env, fn) { const db = new Client({ connectionString: env.HYPERDRIVE.connectionString }); await db.connect(); try { return await fn(db); } finally { await db.end(); } }
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
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}

export async function handleConsentsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/consents')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');
  if (url.pathname !== '/api/consents/adult-sensitive') return fail('Consent route not found.', 404, 'not_found');

  try {
    if (request.method === 'GET') {
      return await withDb(env, async db => {
        const r = await db.query('SELECT user_id,consent_version,accepted_at,age_18_plus,sensitive_content_acknowledged,source,updated_at FROM public.adult_sensitive_consents WHERE user_id=$1::uuid', [auth.user.id]);
        return json({ ok: true, consent: r.rows[0] || null });
      });
    }
    if (request.method === 'PUT') {
      const input = await readJson(request);
      const version = String(input?.version || input?.consent_version || '').trim().slice(0, 100);
      if (!version || input?.age_18_plus !== true || input?.sensitive_content_acknowledged !== true) {
        return fail('Both adult-content confirmations are required.');
      }
      const source = String(input?.source || 'adult_sensitive_content_gate').slice(0, 100);
      return await withDb(env, async db => {
        const r = await db.query(
          `INSERT INTO public.adult_sensitive_consents(user_id,consent_version,accepted_at,age_18_plus,sensitive_content_acknowledged,source,updated_at)
           VALUES($1::uuid,$2,now(),true,true,$3,now())
           ON CONFLICT(user_id) DO UPDATE SET consent_version=EXCLUDED.consent_version,accepted_at=now(),age_18_plus=true,sensitive_content_acknowledged=true,source=EXCLUDED.source,updated_at=now()
           RETURNING user_id,consent_version,accepted_at,age_18_plus,sensitive_content_acknowledged,source,updated_at`,
          [auth.user.id, version, source],
        );
        return json({ ok: true, consent: r.rows[0] });
      });
    }
    return fail('Method not allowed.', 405, 'method_not_allowed');
  } catch (err) {
    console.error('One2OneLove consent API error', err);
    return fail(err?.message || 'Unable to process consent.', 400, 'consent_error');
  }
}
