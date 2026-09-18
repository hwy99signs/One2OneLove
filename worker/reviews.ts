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
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}

export async function handleReviewsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/reviews')) return null;
  try {
    if (url.pathname === '/api/reviews' && request.method === 'GET') {
      return await withDb(env, async db => {
        const r = await db.query(`SELECT id,user_id,reviewer_name,city,country,rating,review_text,created_at FROM public.reviews WHERE is_published=true ORDER BY created_at DESC LIMIT 200`);
        return json({ ok: true, reviews: r.rows });
      });
    }

    if (url.pathname !== '/api/reviews' || request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
    const auth = await session(request, env);
    if (!auth) return fail('Please sign in before leaving a review.', 401, 'unauthorized');
    const input = await readJson(request);
    const rating = Number(input?.rating);
    const reviewText = String(input?.review_text || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Please select a rating from 1 to 5 stars.');
    if (reviewText.length < 10 || reviewText.length > 2000) return fail('Review must be between 10 and 2,000 characters.');

    return await withDb(env, async db => {
      const profile = await db.query('SELECT name,location FROM public.users WHERE id=$1::uuid', [auth.user.id]);
      const p = profile.rows[0];
      if (!p?.name || !p?.location) return fail('Please complete your name and location in your profile before leaving a review.', 422, 'profile_incomplete');
      const pieces = String(p.location).split(',').map(v => v.trim()).filter(Boolean);
      const city = pieces[0] || null;
      const country = pieces.length > 1 ? pieces[pieces.length - 1] : null;
      try {
        const r = await db.query(
          `INSERT INTO public.reviews(user_id,reviewer_name,city,country,rating,review_text,is_published)
           VALUES($1::uuid,$2,$3,$4,$5,$6,false)
           RETURNING id,user_id,reviewer_name,city,country,rating,review_text,is_published,created_at`,
          [auth.user.id, p.name, city, country, rating, reviewText],
        );
        return json({ ok: true, review: r.rows[0] }, 201);
      } catch (err) {
        if (err?.code === '23505') return fail('You have already submitted a review.', 409, 'review_exists');
        throw err;
      }
    });
  } catch (err) {
    console.error('One2OneLove reviews API error', err);
    return fail(err?.message || 'Unable to process review.', 400, 'review_error');
  }
}
