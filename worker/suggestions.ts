// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const TYPES = new Set(['feature', 'improvement', 'bug', 'other']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function clean(value, max) {
  const out = String(value || '').trim();
  if (out.length > max) throw Object.assign(new Error(`Value exceeds ${max} characters.`), { status: 400 });
  return out || null;
}

export async function handleSuggestionsRequest(request, env, url) {
  if (url.pathname !== '/api/suggestions') return null;
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return fail('Invalid request body.');

    const name = clean(body.name, 120);
    const email = clean(body.email, 320)?.toLowerCase() || null;
    const suggestionType = String(body.type || body.suggestion_type || 'other').trim().toLowerCase();
    const suggestion = clean(body.suggestion, 5000);

    if (!TYPES.has(suggestionType)) return fail('Invalid suggestion type.');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email address.');
    if (!suggestion || suggestion.length < 10) return fail('Please enter at least 10 characters.');

    const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await db.connect();
    try {
      const ready = await db.query(`SELECT to_regclass('public.suggestions') IS NOT NULL AS ready`);
      if (!ready.rows[0]?.ready) return fail('Suggestions are not available yet.', 503, 'suggestions_not_ready');

      const result = await db.query(
        `INSERT INTO public.suggestions(name,email,suggestion_type,suggestion)
         VALUES($1,$2,$3,$4)
         RETURNING id,status,created_at`,
        [name, email, suggestionType, suggestion],
      );
      return json({ ok: true, suggestion: result.rows[0] }, 201);
    } finally {
      await db.end();
    }
  } catch (error) {
    console.error('One2OneLove suggestions API error', error);
    return fail(error?.message || 'Unable to submit suggestion.', error?.status || 400, 'suggestion_error');
  }
}
