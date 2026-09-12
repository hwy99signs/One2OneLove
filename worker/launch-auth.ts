// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
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

async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}

function clean(value, max = 500, required = false) {
  if (value == null) {
    if (required) throw new Error('Required value is missing.');
    return null;
  }
  const text = String(value).trim();
  if (required && !text) throw new Error('Required value is empty.');
  if (text.length > max) throw new Error('Value is too long.');
  return text || null;
}

function callbackFor(request) {
  const allowed = new Set([
    'https://one2onelove.com',
    'https://www.one2onelove.com',
    'https://one2onelove-launch.hwy99signs.workers.dev',
    'https://one2onelove-preview-migration.hwy99signs.workers.dev',
  ]);
  const origin = request.headers.get('origin');
  const base = origin && allowed.has(origin) ? origin : 'https://one2onelove.com';
  return `${base}/SignIn?verified=1`;
}

function upstreamHeaders(request) {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  headers.set('accept', 'application/json');
  const origin = request.headers.get('origin');
  if (origin) headers.set('origin', origin);
  const userAgent = request.headers.get('user-agent');
  if (userAgent) headers.set('user-agent', userAgent);
  return headers;
}

async function authPost(request, env, path, body) {
  return fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + path, {
    method: 'POST',
    headers: upstreamHeaders(request),
    body: JSON.stringify(body),
    redirect: 'manual',
  });
}

async function launchReadiness(env) {
  return withDb(env, async (db) => {
    const result = await db.query(`
      SELECT
        to_regclass('public.signup_consents') IS NOT NULL AS consent_table_ready,
        COALESCE((email_and_password->>'requireEmailVerification')::boolean, false) AS verification_required,
        COALESCE((email_and_password->>'sendVerificationEmailOnSignUp')::boolean, false) AS verification_email_on_signup
      FROM neon_auth.project_config
      WHERE name='One2OneLove'
      LIMIT 1
    `);
    return result.rows[0] || {};
  });
}

async function registerLaunchUser(request, env) {
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');

  const readiness = await launchReadiness(env);
  if (!readiness.consent_table_ready || !readiness.verification_required) {
    return fail('One2OneLove verified registration is not ready yet.', 503, 'registration_not_ready');
  }

  const body = await readJson(request);
  const name = clean(body.name, 200, true);
  const email = clean(body.email, 320, true)?.toLowerCase();
  const password = String(body.password || '');
  const country = clean(body.country, 2, true)?.toUpperCase();
  const preferredLanguage = clean(body.preferredLanguage, 10, true)?.toLowerCase();
  const termsVersion = clean(body.termsVersion, 100, true);
  const termsAcceptedAt = clean(body.termsAcceptedAt, 100, true);
  const privacyAcknowledged = body.privacyPolicyAcknowledged === true;
  const age18Confirmed = body.age18Confirmed === true;

  if (!/^\S+@\S+\.\S+$/.test(email || '')) return fail('Please enter a valid email address.');
  if (password.length < 8) return fail('Password must contain at least 8 characters.');
  if (!new Set(['en', 'es', 'fr', 'it', 'de']).has(preferredLanguage)) {
    return fail('Please select one of the supported One2OneLove languages.');
  }
  if (!privacyAcknowledged || !age18Confirmed) {
    return fail('Privacy acknowledgement and 18+ confirmation are required.');
  }
  const acceptedDate = new Date(termsAcceptedAt);
  if (Number.isNaN(acceptedDate.getTime())) return fail('Terms acceptance date is invalid.');

  const callbackURL = callbackFor(request);
  const upstream = await authPost(request, env, '/sign-up/email', {
    email,
    password,
    name,
    callbackURL,
  });
  const text = await upstream.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }

  if (!upstream.ok) {
    const message = payload?.message || payload?.error?.message || 'Account creation failed.';
    return fail(message, upstream.status, payload?.code || payload?.error?.code || 'signup_failed');
  }

  const user = payload?.user || payload?.data?.user || null;
  if (!user?.id) {
    return fail('Account creation did not return a user record.', 502, 'invalid_auth_response');
  }

  await withDb(env, async (db) => {
    await db.query(
      `INSERT INTO public.signup_consents
        (user_id,email,country,preferred_language,terms_version,terms_accepted_at,
         privacy_policy_acknowledged,age_18_confirmed,signup_source)
       SELECT id,$2,$3,$4,$5,$6::timestamptz,true,true,'one2onelove_prelaunch'
       FROM neon_auth."user" WHERE id=$1::uuid AND lower(email)=lower($2)
       ON CONFLICT (user_id, terms_version) DO UPDATE SET
         country=EXCLUDED.country,
         preferred_language=EXCLUDED.preferred_language,
         terms_accepted_at=EXCLUDED.terms_accepted_at,
         privacy_policy_acknowledged=true,
         age_18_confirmed=true`,
      [user.id, email, country, preferredLanguage, termsVersion, acceptedDate.toISOString()],
    );
  });

  // Do not forward any signup session cookie. Launch policy requires email
  // verification before a browser receives an authenticated One2OneLove session.
  return json({
    ok: true,
    success: true,
    user: { id: user.id, email: user.email || email, emailVerified: user.emailVerified === true },
    emailVerificationRequired: true,
    verificationEmailExpected: readiness.verification_email_on_signup === true,
  }, 201);
}

async function resendVerification(request, env) {
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
  const body = await readJson(request);
  const email = clean(body.email, 320, true)?.toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email || '')) return fail('Please enter a valid email address.');

  const upstream = await authPost(request, env, '/send-verification-email', {
    email,
    callbackURL: callbackFor(request),
  });
  const text = await upstream.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }

  if (!upstream.ok) {
    const message = payload?.message || payload?.error?.message || 'Verification email could not be sent.';
    return fail(message, upstream.status, payload?.code || payload?.error?.code || 'verification_send_failed');
  }

  return json({ ok: true, success: true });
}

export async function handleLaunchAuthRequest(request, env, url) {
  if (url.pathname === '/api/launch-signup') return registerLaunchUser(request, env);
  if (url.pathname === '/api/launch-signup/resend') return resendVerification(request, env);
  return null;
}
