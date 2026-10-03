// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const AUTO_REINSTATEMENT_WINDOW = "48 hours";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function withDb(env, fn) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try { return await fn(client); } finally { await client.end(); }
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
    'https://one2onelove-prelaunch.hwy99signs.workers.dev',
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

async function readUpstream(upstream) {
  const text = await upstream.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  return { text, payload };
}

async function launchReadiness(env) {
  return withDb(env, async (db) => {
    const result = await db.query(`
      SELECT
        to_regclass('public.signup_consents') IS NOT NULL AS consent_table_ready,
        COALESCE((email_and_password->>'requireEmailVerification')::boolean, false) AS verification_required,
        COALESCE((email_and_password->>'sendVerificationEmailOnSignUp')::boolean, false) AS verification_email_on_signup,
        COALESCE(email_and_password->>'emailVerificationMethod','') AS verification_method,
        (
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_number') AND
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_number_verified')
        ) AS phone_verification_schema_ready,
        COALESCE(email_provider->>'type','') AS email_provider_type,
        (
          SELECT count(*)::int
          FROM public.users
          WHERE stripe_subscription_id IS NULL
            AND lower(COALESCE(subscription_status,'')) IN ('active','trial','trialing')
        ) AS legacy_entitlement_rows,
        COALESCE((
          SELECT column_default = '''Free''::text'
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='subscription_plan'
        ),false) AS free_default_ready,
        COALESCE((
          SELECT column_default = '0'
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='subscription_price'
        ),false) AS zero_price_default_ready,
        COALESCE((
          SELECT column_default = '''inactive''::text'
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='subscription_status'
        ),false) AS status_default_ready
      FROM neon_auth.project_config
      WHERE name='One2OneLove'
      LIMIT 1
    `);
    return result.rows[0] || {};
  });
}

function launchIdentityReady(readiness, env) {
  const emailReady = Boolean(
    readiness.consent_table_ready &&
    readiness.verification_required &&
    readiness.verification_email_on_signup &&
    readiness.verification_method &&
    readiness.email_provider_type &&
    readiness.email_provider_type !== 'shared'
  );
  const phoneReady = Boolean(
    readiness.phone_verification_schema_ready &&
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    env.TWILIO_VERIFY_SERVICE_SID
  );
  return { emailReady, phoneReady, ready: emailReady && phoneReady };
}

function registrationContext(body) {
  const name = clean(body.name, 200, true);
  const email = clean(body.email, 320, true)?.toLowerCase();
  const country = clean(body.country, 2, true)?.toUpperCase();
  const preferredLanguage = clean(body.preferredLanguage, 10, true)?.toLowerCase();
  const termsVersion = clean(body.termsVersion, 100, true);
  const termsAcceptedAt = clean(body.termsAcceptedAt, 100, true);
  const privacyAcknowledged = body.privacyPolicyAcknowledged === true;
  const age18Confirmed = body.age18Confirmed === true;
  const foundingIntent = body.foundingIntent === true;

  if (!/^\S+@\S+\.\S+$/.test(email || '')) throw new Error('Please enter a valid email address.');
  if (!/^[A-Z]{2}$/.test(country || '')) throw new Error('Please select a valid country.');
  if (!new Set(['en', 'es', 'fr', 'it', 'de']).has(preferredLanguage)) throw new Error('Please select one of the supported One2OneLove languages.');
  if (!privacyAcknowledged || !age18Confirmed) throw new Error('Privacy acknowledgement and 18+ confirmation are required.');

  const acceptedDate = new Date(termsAcceptedAt);
  if (Number.isNaN(acceptedDate.getTime())) throw new Error('Terms acceptance date is invalid.');

  return {
    name,
    email,
    country,
    preferredLanguage,
    termsVersion,
    termsAcceptedAt: acceptedDate.toISOString(),
    accessModel: 'free_tokens',
    foundingIntent,
  };
}

async function reserveFoundingTokenMember(db,userId) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('one2onelove_founding_members'))");
  await db.query(`
    DELETE FROM public.founding_members
     WHERE status='reserved'
       AND activated_at IS NULL
       AND reservation_expires_at IS NOT NULL
       AND reservation_expires_at<=now()
  `);
  const existing=(await db.query(
    `SELECT founding_number,cohort,status,badge_retained,reservation_expires_at
       FROM public.founding_members WHERE user_id=$1::uuid LIMIT 1`,
    [userId],
  )).rows[0]||null;
  if(existing)return existing;

  const next=(await db.query(`
    SELECT n
      FROM generate_series(1,200) n
     WHERE NOT EXISTS (SELECT 1 FROM public.founding_members f WHERE f.founding_number=n)
     ORDER BY n LIMIT 1
  `)).rows[0]?.n;
  if(!next)return null;
  const foundingNumber=Number(next);
  const cohort=foundingNumber<=100?'first100':'second100';
  return (await db.query(
    `INSERT INTO public.founding_members
      (user_id,founding_number,cohort,status,badge_retained,founding_rate_forfeited,reservation_expires_at)
     VALUES($1::uuid,$2,$3,'reserved',true,false,now()+interval '48 hours')
     RETURNING founding_number,cohort,status,badge_retained,reservation_expires_at`,
    [userId,foundingNumber,cohort],
  )).rows[0];
}

async function persistRegistration(db, user, registration) {
  await db.query('BEGIN');
  try {
    await db.query(
      `INSERT INTO public.signup_consents
        (user_id,email,country,preferred_language,terms_version,terms_accepted_at,
         privacy_policy_acknowledged,age_18_confirmed,signup_source)
       SELECT id,$2,$3,$4,$5,$6::timestamptz,true,true,'one2onelove_free_token_launch'
       FROM neon_auth."user" WHERE id=$1::uuid AND lower(email)=lower($2)
       ON CONFLICT (user_id, terms_version) DO UPDATE SET
         country=EXCLUDED.country,
         preferred_language=EXCLUDED.preferred_language,
         terms_accepted_at=EXCLUDED.terms_accepted_at,
         privacy_policy_acknowledged=true,
         age_18_confirmed=true`,
      [user.id, registration.email, registration.country, registration.preferredLanguage, registration.termsVersion, registration.termsAcceptedAt],
    );

    // New consumer accounts are FREE. Legacy paid tier fields remain only for
    // historical migration/reconciliation and are not an access entitlement.
    await db.query(
      `INSERT INTO public.users
        (id,email,name,user_type,is_active,subscription_plan,subscription_price,subscription_status)
       VALUES ($1::uuid,$2,$3,'regular',true,'Free',0,'inactive')
       ON CONFLICT (id) DO UPDATE SET
         email=EXCLUDED.email,
         name=COALESCE(NULLIF(public.users.name,''),EXCLUDED.name)`,
      [user.id, registration.email, registration.name],
    );

    await db.query(
      `INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid)
       ON CONFLICT(user_id) DO NOTHING`,
      [user.id],
    );
    await db.query(
      `INSERT INTO public.o2ol_auto_replenish_settings(user_id) VALUES($1::uuid)
       ON CONFLICT(user_id) DO NOTHING`,
      [user.id],
    );

    // Reserve the Founder number immediately, but do not activate the badge until
    // verified phone completion. Token economics remain deliberately unassigned.
    if (registration.foundingIntent) {
      const founding=await reserveFoundingTokenMember(db,user.id);
      if(founding){
        await db.query(
          `INSERT INTO public.o2ol_founding_token_benefits
            (user_id,monthly_tokens,months_total,months_granted,status,metadata)
           VALUES($1::uuid,0,6,0,'pending',$2::jsonb)
           ON CONFLICT(user_id) DO UPDATE SET
             metadata=public.o2ol_founding_token_benefits.metadata||EXCLUDED.metadata,
             updated_at=now()`,
          [user.id,JSON.stringify({
            founding_intent:true,
            founding_number:Number(founding.founding_number),
            founding_cohort:founding.cohort,
            badge_activation:'after_phone_verification',
            economics_pending_calibration:true,
          })],
        );
      }
    }

    await db.query('COMMIT');
    return true;
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function resumeUnverifiedRegistration(request, env, registration) {
  // A browser can lose the first response after Auth creates the account. In
  // that case, a second submit must take the member back to verification
  // rather than suggesting they create a second account.
  let user = null;
  try {
    user = await withDb(env, async db => {
      const result = await db.query(
        `SELECT a.id,a.email,a.name,a."emailVerified",a."createdAt",
                EXISTS (SELECT 1 FROM public.users p WHERE p.id=a.id) AS profile_ready,
                a."createdAt" >= now()-interval '${AUTO_REINSTATEMENT_WINDOW}' AS recovery_eligible
           FROM neon_auth."user" a
          WHERE lower(a.email)=lower($1)
          LIMIT 1`,
        [registration.email],
      );
      return result.rows[0] || null;
    });
  } catch (error) {
    console.error('One2OneLove duplicate signup recovery lookup failed', error);
    return null;
  }

  if (!user?.id || user.emailVerified === true) return null;

  if (!user.profile_ready && user.recovery_eligible !== true) {
    return { expired: true };
  }

  let profileReady = true;
  if (!user.profile_ready) {
    try {
      await withDb(env, db => persistRegistration(db, user, registration));
    } catch (error) {
      console.error('One2OneLove duplicate signup profile recovery deferred', error);
      profileReady = false;
    }
  }

  let resend;
  try {
    resend = await authPost(request, env, '/email-otp/send-verification-otp', {
      email: registration.email,
      type: 'email-verification',
    });
  } catch (error) {
    console.error('One2OneLove duplicate signup verification resend failed', error);
    return null;
  }
  if (!resend.ok) return null;

  return { user, profileReady };
}

async function launchReadinessResponse(request, env) {
  if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
  const readiness = await launchReadiness(env);
  const identity = launchIdentityReady(readiness, env);
  const emailVerificationReady = Boolean(readiness.consent_table_ready && readiness.verification_required && readiness.verification_email_on_signup && readiness.verification_method);
  const emailDeliveryReady = Boolean(readiness.email_provider_type && readiness.email_provider_type !== 'shared');
  const phoneVerificationProviderConfigured = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
  const phoneVerificationSchemaReady = readiness.phone_verification_schema_ready === true;
  const phoneVerificationReady = identity.phoneReady;
  const publicLaunchIdentityGateReady = identity.ready;
  const legacyEntitlementRows = Number(readiness.legacy_entitlement_rows || 0);
  const freeAccountDefaultsReady = Boolean(
    readiness.free_default_ready &&
    readiness.zero_price_default_ready &&
    readiness.status_default_ready
  );
  // Paid tier state is migration history only. Free account creation depends on
  // verified identity plus FREE/0 defaults; tokens are purchased separately.
  const billingDataReady = freeAccountDefaultsReady;

  return json({
    ok: true,
    readiness: {
      consentTableReady: readiness.consent_table_ready === true,
      emailVerificationReady,
      emailVerificationRequired: readiness.verification_required === true,
      verificationEmailOnSignup: readiness.verification_email_on_signup === true,
      emailVerificationMethod: readiness.verification_method || null,
      emailProviderMode: readiness.email_provider_type || null,
      emailDeliveryReady,
      phoneVerificationReady,
      phoneVerificationProviderConfigured,
      phoneVerificationSchemaReady,
      publicLaunchIdentityGateReady,
      legacyEntitlementRows,
      freeAccountDefaultsReady,
      billingDefaultsReady: freeAccountDefaultsReady,
      billingDataReady,
      accessModel: 'free_tokens',
    },
  });
}

async function registerLaunchUser(request, env) {
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');

  const readiness = await launchReadiness(env);
  if (!launchIdentityReady(readiness, env).ready) {
    return fail('One2OneLove verified registration is not ready yet.', 503, 'registration_not_ready');
  }

  const body = await readJson(request);
  let registration;
  try {
    registration = registrationContext(body);
  } catch (error) {
    return fail(error?.message || 'Registration details are invalid.', 400, 'invalid_registration');
  }
  const password = String(body.password || '');
  if (password.length < 8) return fail('Password must contain at least 8 characters.');

  const upstream = await authPost(request, env, '/sign-up/email', {
    email: registration.email,
    password,
    name: registration.name,
    callbackURL: callbackFor(request),
  });
  const { payload } = await readUpstream(upstream);

  if (!upstream.ok) {
    const resumed = await resumeUnverifiedRegistration(request, env, registration);
    if (resumed?.expired) {
      return fail('This account is outside the 48-hour automatic recovery window. Please contact support for help.', 410, 'reinstatement_window_expired');
    }
    if (resumed) {
      return json({
        ok: true,
        success: true,
        user: { id: resumed.user.id, email: resumed.user.email || registration.email, emailVerified: false },
        emailVerificationRequired: true,
        verificationMethod: readiness.verification_method || 'otp',
        verificationEmailExpected: true,
        openHouseBrowsingFree: true,
        accessModel: 'free_tokens',
        freeAccount: true,
        profileReady: resumed.profileReady,
        recoveryPending: !resumed.profileReady,
        resumed: true,
      }, 202);
    }
    const message = payload?.message || payload?.error?.message || 'Account creation failed.';
    return fail(message, upstream.status, payload?.code || payload?.error?.code || 'signup_failed');
  }

  const user = payload?.user || payload?.data?.user || null;
  if (!user?.id) return fail('Account creation did not return a user record.', 502, 'invalid_auth_response');

  let profileReady = true;
  try {
    await withDb(env, db => persistRegistration(db, user, registration));
  } catch (error) {
    // Authentication already accepted the account. Do not leave a member
    // stranded or invite a duplicate submission: email verification retries
    // the same idempotent profile/consent write with the verified email code.
    console.error('One2OneLove signup profile write deferred', error);
    profileReady = false;
  }

  return json({
    ok: true,
    success: true,
    user: { id: user.id, email: user.email || registration.email, emailVerified: user.emailVerified === true },
    emailVerificationRequired: true,
    verificationMethod: readiness.verification_method || 'otp',
    verificationEmailExpected: readiness.verification_email_on_signup === true,
    openHouseBrowsingFree: true,
    accessModel: 'free_tokens',
    freeAccount: true,
    profileReady,
    recoveryPending: !profileReady,
  }, profileReady ? 201 : 202);
}

async function resendVerification(request, env) {
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
  const readiness = await launchReadiness(env);
  const emailDeliveryReady = Boolean(readiness.email_provider_type && readiness.email_provider_type !== 'shared');
  if (!emailDeliveryReady) return fail('Verification email delivery is not ready yet.', 503, 'email_delivery_not_ready');
  const body = await readJson(request);
  const email = clean(body.email, 320, true)?.toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email || '')) return fail('Please enter a valid email address.');

  const upstream = await authPost(request, env, '/email-otp/send-verification-otp', {
    email,
    type: 'email-verification',
  });
  const { payload } = await readUpstream(upstream);
  if (!upstream.ok) {
    const message = payload?.message || payload?.error?.message || 'Verification code could not be sent.';
    return fail(message, upstream.status, payload?.code || payload?.error?.code || 'verification_send_failed');
  }
  return json({ ok: true, success: true });
}

async function verifyLaunchEmail(request, env) {
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
  const body = await readJson(request);
  const email = clean(body.email, 320, true)?.toLowerCase();
  const otp = String(body.otp || '').trim();
  let registration = null;
  if (body.signupContext && typeof body.signupContext === 'object') {
    try {
      registration = registrationContext({ ...body.signupContext, email });
    } catch (error) {
      return fail(error?.message || 'Registration details are invalid.', 400, 'invalid_registration');
    }
  }
  if (!/^\S+@\S+\.\S+$/.test(email || '')) return fail('Please enter a valid email address.');
  if (!/^\d{6}$/.test(otp)) return fail('Enter the 6-digit verification code.', 400, 'invalid_otp');

  const upstream = await authPost(request, env, '/email-otp/verify-email', { email, otp });
  const { payload } = await readUpstream(upstream);
  if (!upstream.ok) {
    const message = payload?.message || payload?.error?.message || 'The verification code is invalid or expired.';
    return fail(message, upstream.status === 429 ? 429 : 400, payload?.code || payload?.error?.code || 'invalid_otp');
  }

  let verified = false;
  let profileReady = true;
  try {
    await withDb(env, async db => {
      const result = await db.query(
        `SELECT a.id,a.email,a.name,a."emailVerified",a."createdAt",
                EXISTS (SELECT 1 FROM public.users p WHERE p.id=a.id) AS profile_ready,
                a."createdAt" >= now()-interval '${AUTO_REINSTATEMENT_WINDOW}' AS recovery_eligible
           FROM neon_auth."user" a
          WHERE lower(a.email)=lower($1)
          LIMIT 1`,
        [email],
      );
      const user = result.rows[0] || null;
      verified = user?.emailVerified === true;
      if (!verified) return;
      if (!user.profile_ready && user.recovery_eligible !== true) {
        profileReady = false;
        return;
      }
      if (registration && !user.profile_ready) {
        await persistRegistration(db, user, registration);
      }
    });
  } catch (error) {
    // The email is already verified upstream. Sign-in remains a safe recovery
    // path because the protected profile route backfills the base member row.
    console.error('One2OneLove verified signup profile recovery deferred', error);
    profileReady = false;
  }

  if (!verified) return fail('Email verification did not complete. Request a new code and try again.', 409, 'verification_incomplete');
  if (!profileReady) return fail('Email verified, but this account is outside the 48-hour automatic recovery window. Please contact support for help.', 410, 'reinstatement_window_expired');
  return json({ ok: true, success: true, verified: true, profileReady, recoveryPending: !profileReady, accessModel:'free_tokens', freeAccount:true }, profileReady ? 200 : 202);
}

export async function handleLaunchAuthRequest(request, env, url) {
  if (url.pathname === '/api/launch-signup/readiness') return launchReadinessResponse(request, env);
  if (url.pathname === '/api/launch-signup') return registerLaunchUser(request, env);
  if (url.pathname === '/api/launch-signup/resend') return resendVerification(request, env);
  if (url.pathname === '/api/launch-signup/verify') return verifyLaunchEmail(request, env);
  return null;
}
