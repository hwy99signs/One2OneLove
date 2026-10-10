// @ts-nocheck
import { Client } from 'pg';
import { grantSignupGameCreditInTx, ensureGameEconomySchema } from './game-economy';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const SEND_COOLDOWN_SECONDS = 60;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

function cleanPhone(value) {
  const compact = String(value || '').trim().replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

export function phoneVerificationProviderConfigured(env) {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

async function schemaReady(db) {
  const result = await db.query(`
    SELECT
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_number')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_number_verified')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_verified_at')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_verification_last_sent_at')
      AS ready
  `);
  return result.rows[0]?.ready === true;
}

async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    method: 'GET',
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  if (!user?.id || !active || user.emailVerified !== true) return null;
  return { user, session: active };
}

async function phoneAlreadyUsedByAnotherMember(db, userId, phoneNumber) {
  const result = await db.query(
    `SELECT 1
       FROM public.users u
       JOIN neon_auth."user" a ON a.id=u.id
      WHERE u.id<>$1::uuid
        AND u.phone_number=$2
        AND COALESCE(u.phone_number_verified,false)=true
        AND COALESCE(a.role,'user')<>'admin'
      LIMIT 1`,
    [userId, phoneNumber],
  );
  return result.rowCount > 0;
}

async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}

async function twilioVerifyPost(env, suffix, fields) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) params.set(key, String(value));
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  let response;
  try {
    response = await fetch(
      `https://verify.twilio.com/v2/Services/${encodeURIComponent(env.TWILIO_VERIFY_SERVICE_SID)}/${suffix}`,
      {
        method: 'POST',
        headers: {
          authorization: `Basic ${auth}`,
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        body: params,
      },
    );
  } catch (cause) {
    const error = new Error('Phone verification provider could not be reached.');
    error.status = 503;
    error.code = 'phone_provider_unavailable';
    error.cause = cause;
    throw error;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      response.status === 429
        ? 'Too many verification attempts. Please wait and try again.'
        : (payload?.message || 'Phone verification provider rejected the request.')
    );
    error.status = response.status === 429 ? 429 : 502;
    error.code = response.status === 429 ? 'rate_limited' : 'phone_provider_error';
    throw error;
  }
  return payload || {};
}

async function sendVerification(request, env, auth) {
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
  if (!phoneVerificationProviderConfigured(env)) {
    return fail('Phone verification is not configured yet.', 503, 'phone_verification_not_configured');
  }

  const body = await readJson(request);
  const phoneNumber = cleanPhone(body.phoneNumber);
  if (!phoneNumber) return fail('Enter a valid mobile number with country code.', 400, 'invalid_phone');

  return withDb(env, async db => {
    if (!(await schemaReady(db))) {
      return fail('Phone verification storage is not ready yet.', 503, 'phone_verification_schema_not_ready');
    }

    const row = await db.query(
      `SELECT NULLIF(to_jsonb(u)->>'phone_verification_last_sent_at','')::timestamptz AS last_sent_at
         FROM public.users u WHERE id=$1::uuid LIMIT 1`,
      [auth.user.id],
    );
    if (!row.rows[0]) return fail('Member profile was not found.', 409, 'profile_not_ready');

    if (String(auth.user.role || '').toLowerCase() !== 'admin' && await phoneAlreadyUsedByAnotherMember(db, auth.user.id, phoneNumber)) {
      return fail('This mobile number is already verified on another One2OneLove member account. Use the existing account or a different mobile number.', 409, 'phone_already_in_use');
    }

    const lastSent = row.rows[0].last_sent_at ? new Date(row.rows[0].last_sent_at).getTime() : 0;
    if (lastSent && Date.now() - lastSent < SEND_COOLDOWN_SECONDS * 1000) {
      return fail('Please wait before requesting another verification code.', 429, 'verification_cooldown');
    }

    const result = await twilioVerifyPost(env, 'Verifications', { To: phoneNumber, Channel: 'sms' });
    if (result.status && result.status !== 'pending') {
      return fail('Verification code could not be sent.', 502, 'verification_send_failed');
    }

    await db.query(
      'UPDATE public.users SET phone_verification_last_sent_at=now(), updated_at=now() WHERE id=$1::uuid',
      [auth.user.id],
    );

    return json({ ok: true, success: true, status: 'pending' });
  });
}

async function verifyCode(request, env, auth) {
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
  if (!phoneVerificationProviderConfigured(env)) {
    return fail('Phone verification is not configured yet.', 503, 'phone_verification_not_configured');
  }

  const body = await readJson(request);
  const phoneNumber = cleanPhone(body.phoneNumber);
  const code = String(body.code || '').trim();
  if (!phoneNumber) return fail('Enter a valid mobile number with country code.', 400, 'invalid_phone');
  if (!/^\d{4,10}$/.test(code)) return fail('Enter the verification code from the SMS.', 400, 'invalid_code');

  return withDb(env, async db => {
    if (!(await schemaReady(db))) {
      return fail('Phone verification storage is not ready yet.', 503, 'phone_verification_schema_not_ready');
    }

    const result = await twilioVerifyPost(env, 'VerificationCheck', { To: phoneNumber, Code: code });
    if (result.status !== 'approved') {
      return fail('The verification code is invalid or expired.', 400, 'invalid_code');
    }

    await db.query('BEGIN');
    try {
      await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [phoneNumber]);
      if (String(auth.user.role || '').toLowerCase() !== 'admin' && await phoneAlreadyUsedByAnotherMember(db, auth.user.id, phoneNumber)) {
        await db.query('ROLLBACK');
        return fail('This mobile number is already verified on another One2OneLove member account. Use the existing account or a different mobile number.', 409, 'phone_already_in_use');
      }

      const updated = await db.query(
        `UPDATE public.users
            SET phone_number=$2,
                phone_number_verified=true,
                phone_verified_at=now(),
                updated_at=now()
          WHERE id=$1::uuid
          RETURNING id,phone_number,phone_number_verified,phone_verified_at`,
        [auth.user.id, phoneNumber],
      );
      if (!updated.rows[0]) {
        await db.query('ROLLBACK');
        return fail('Member profile was not found.', 409, 'profile_not_ready');
      }

      // A Founder slot is only activated after the account completes the full
      // verified identity path. The reserved number is retained as the badge;
      // Token economics remain pending calibration.
      const founder=(await db.query(
        `UPDATE public.founding_members
            SET status='active',activated_at=COALESCE(activated_at,now()),
                reservation_expires_at=NULL,updated_at=now()
          WHERE user_id=$1::uuid
            AND status='reserved'
            AND (reservation_expires_at IS NULL OR reservation_expires_at>now())
          RETURNING founding_number,cohort,status,badge_retained`,
        [auth.user.id],
      )).rows[0]||null;
      if(founder){
        await db.query(
          `UPDATE public.o2ol_founding_token_benefits
              SET status='active',
                  metadata=metadata||$2::jsonb,
                  updated_at=now()
            WHERE user_id=$1::uuid`,
          [auth.user.id,JSON.stringify({
            founding_number:Number(founder.founding_number),
            founding_cohort:founder.cohort,
            badge_activated:true,
            economics_pending_calibration:true,
          })],
        );
      }

      const gameCreditBonus=await grantSignupGameCreditInTx(db,auth.user.id);
      await db.query('COMMIT');
      return json({ ok: true, success: true, verified: true,
        gameCreditBonus:gameCreditBonus ? {
          amountCents:500,
          expiresAt:gameCreditBonus.expires_at,
          welcome:'Welcome! You received $5.00 in FREE Game Credits. Play any One2OneLove game — your Game Credits are used first. They expire in 14 days, so come play soon.'
        } : null,
        founder:founder ? {
        foundingNumber:Number(founder.founding_number),
        cohort:founder.cohort,
        badgeRetained:founder.badge_retained!==false,
        tokenEconomicsPendingCalibration:true,
      } : null });
    } catch (error) {
      await db.query('ROLLBACK').catch(() => {});
      if (error?.code === '23505') {
        return fail('This mobile number is already verified on another One2OneLove member account. Use the existing account or a different mobile number.', 409, 'phone_already_in_use');
      }
      throw error;
    }
  });
}

export async function handlePhoneVerificationRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/phone-verification')) return null;

  const auth = await session(request, env);
  if (!auth) return fail('Verified sign-in is required.', 401, 'unauthorized');

  try {
    if (url.pathname === '/api/phone-verification/send') return await sendVerification(request, env, auth);
    if (url.pathname === '/api/phone-verification/verify') return await verifyCode(request, env, auth);
    return fail('Phone verification route not found.', 404, 'not_found');
  } catch (error) {
    return fail(
      error?.message || 'Phone verification failed.',
      Number(error?.status || 500),
      error?.code || 'phone_verification_failed',
    );
  }
}
