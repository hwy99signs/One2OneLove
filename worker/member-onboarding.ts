// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function sessionFromRequest(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && session ? { user, session } : null;
}

export async function handleMemberOnboarding(request, env, url) {
  if (url.pathname !== '/api/onboarding/member') return null;
  if (request.method !== 'POST' && request.method !== 'PATCH') {
    return fail('Method not allowed.', 405, 'method_not_allowed');
  }

  const auth = await sessionFromRequest(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Invalid request body.');

  const relationship = body.relationshipStatus ?? body.relationship_status ?? null;
  const allowedRelationships = new Set(['single', 'dating', 'engaged', 'married', 'complicated']);
  const relationshipStatus = relationship && allowedRelationships.has(relationship) ? relationship : null;
  const anniversaryDate = body.anniversaryDate ?? body.anniversary_date ?? null;
  const partnerEmail = String(body.partnerEmail ?? body.partner_email ?? '').trim() || null;
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(
      `INSERT INTO public.users
        (id,email,name,user_type,relationship_status,anniversary_date,partner_email,
         subscription_plan,subscription_price,subscription_status,is_active)
       VALUES ($1::uuid,$2,$3,'regular',$4,$5::date,$6,'Basic',4.99,'inactive',true)
       ON CONFLICT (id) DO UPDATE SET
         email=EXCLUDED.email,
         name=COALESCE(NULLIF(EXCLUDED.name,''),public.users.name),
         user_type='regular',
         relationship_status=EXCLUDED.relationship_status,
         anniversary_date=EXCLUDED.anniversary_date,
         partner_email=EXCLUDED.partner_email,
         is_active=true,
         updated_at=now()
       RETURNING *`,
      [
        auth.user.id,
        auth.user.email,
        String(body.name || auth.user.name || auth.user.email?.split('@')[0] || 'Member').trim(),
        relationshipStatus,
        anniversaryDate || null,
        partnerEmail,
      ],
    );
    return json({ ok: true, profile: result.rows[0] }, request.method === 'POST' ? 201 : 200);
  } catch (err) {
    console.error('One2OneLove member onboarding error', err);
    return fail('Unable to save member profile.', 400, 'profile_error');
  } finally {
    await db.end();
  }
}
