// @ts-nocheck
import { Client } from 'pg';
import { scheduledSmsReadiness } from './scheduled-love-notes';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

export async function handleLaunchReadinessRequest(request, env, url) {
  if (url.pathname !== '/api/launch-readiness') return null;
  if (request.method !== 'GET') {
    return json({ ok: false, error: { code: 'method_not_allowed', message: 'Method not allowed.' } }, 405);
  }

  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    const result = await db.query(`
      SELECT
        to_regclass('public.users') IS NOT NULL AS users_ready,
        to_regclass('public.signup_consents') IS NOT NULL AS consents_ready,
        to_regclass('public.love_note_category_preferences') IS NOT NULL AS category_preferences_ready,
        to_regclass('public.suggestions') IS NOT NULL AS suggestions_ready,
        COALESCE((pc.email_and_password->>'requireEmailVerification')::boolean,false) AS email_required,
        COALESCE((pc.email_and_password->>'sendVerificationEmailOnSignUp')::boolean,false) AS email_on_signup,
        COALESCE(pc.email_and_password->>'emailVerificationMethod','') AS email_method,
        COALESCE(pc.email_provider->>'type','') AS email_provider_type,
        COALESCE(pc.email_and_password->>'enabled','') AS email_password_enabled,
        COALESCE(pc.email_and_password->>'minPasswordLength','') AS min_password_length,
        COALESCE(pc.email_and_password->>'maxPasswordLength','') AS max_password_length,
        COALESCE(to_jsonb(pc)->'trusted_origins','[]'::jsonb) AS trusted_origins,
        (
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_number') AND
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_number_verified')
        ) AS phone_schema_ready,
        (
          SELECT count(*)::int FROM public.users
          WHERE stripe_subscription_id IS NULL
            AND lower(COALESCE(subscription_status,'')) IN ('active','trial','trialing')
        ) AS legacy_entitlement_rows,
        COALESCE((
          SELECT column_default = '''Premiere''::text'
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='subscription_plan'
        ),false) AS premiere_default_ready,
        COALESCE((
          SELECT column_default = '9.99'
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='subscription_price'
        ),false) AS price_default_ready,
        COALESCE((
          SELECT column_default = '''inactive''::text'
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='subscription_status'
        ),false) AS status_default_ready
      FROM neon_auth.project_config pc
      WHERE pc.name='One2OneLove'
      LIMIT 1
    `);
    const row = result.rows[0] || {};

    const memberAuditResult = await db.query(`
      SELECT
        (SELECT count(*)::int FROM neon_auth."user") AS auth_total,
        (SELECT count(*)::int FROM public.users) AS profile_total,
        (SELECT count(*)::int FROM neon_auth."user" a FULL OUTER JOIN public.users u ON u.id=a.id) AS combined_total,
        (SELECT count(*)::int FROM neon_auth."user" WHERE "createdAt" >= now()-interval '24 hours') AS auth_new_24h,
        (SELECT count(*)::int FROM public.users WHERE created_at >= now()-interval '24 hours') AS profile_new_24h,
        (SELECT max("createdAt") FROM neon_auth."user") AS newest_auth_at,
        (SELECT max(created_at) FROM public.users) AS newest_profile_at,
        (SELECT count(*)::int FROM public.signup_consents) AS consent_total,
        (SELECT max(terms_accepted_at) FROM public.signup_consents) AS newest_consent_at,
        EXISTS (
          SELECT 1
            FROM pg_constraint con
           WHERE con.contype='f'
             AND con.conrelid='public.signup_consents'::regclass
             AND con.confrelid='public.users'::regclass
        ) AS consent_fk_users,
        EXISTS (
          SELECT 1
            FROM pg_constraint con
           WHERE con.contype='f'
             AND con.conrelid='public.users'::regclass
             AND con.confrelid='neon_auth."user"'::regclass
        ) AS users_fk_auth
    `);
    const memberAudit = memberAuditResult.rows[0] || {};

    const emailVerificationReady = Boolean(row.consents_ready && row.email_required && row.email_on_signup && row.email_method);
    const emailDeliveryReady = Boolean(row.email_provider_type && row.email_provider_type !== 'shared');
    const phoneVerificationProviderConfigured = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
    const phoneVerificationSchemaReady = row.phone_schema_ready === true;
    const phoneVerificationReady = phoneVerificationProviderConfigured && phoneVerificationSchemaReady;
    const identityReady = emailVerificationReady && emailDeliveryReady && phoneVerificationReady;

    const billingDefaultsReady = Boolean(row.premiere_default_ready && row.price_default_ready && row.status_default_ready);
    const stripeCheckoutReady = Boolean(
      env.STRIPE_SECRET_KEY &&
      env.STRIPE_PRICE_PREMIERE &&
      env.STRIPE_PRICE_EXCLUSIVE
    );
    const stripeWebhookReady = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
    const billingProviderReady = stripeCheckoutReady && stripeWebhookReady;

    const sms = scheduledSmsReadiness(env);
    const aiProviderReady = Boolean(env.OPENAI_API_KEY);
    const requiredDatabaseReady = Boolean(
      row.users_ready &&
      row.consents_ready &&
      row.category_preferences_ready &&
      row.suggestions_ready &&
      billingDefaultsReady
    );

    const requiredLaunchReady = Boolean(identityReady && billingProviderReady && requiredDatabaseReady);

    return json({
      ok: true,
      readiness: {
        requiredLaunchReady,
        productionPromotionReady: requiredLaunchReady,
        database: {
          coreUsersReady: row.users_ready === true,
          signupConsentsReady: row.consents_ready === true,
          loveNoteCategoryPreferencesReady: row.category_preferences_ready === true,
          suggestionsReady: row.suggestions_ready === true,
          billingDefaultsReady,
          requiredDatabaseReady,
        },
        identity: {
          emailVerificationReady,
          emailDeliveryReady,
          emailProviderMode: row.email_provider_type || null,
          phoneVerificationReady,
          emailPasswordEnabled: row.email_password_enabled || null,
          minPasswordLength: row.min_password_length || null,
          maxPasswordLength: row.max_password_length || null,
          trustedOrigins: row.trusted_origins || [],
          phoneVerificationProviderConfigured,
          phoneVerificationSchemaReady,
          requiredIdentityReady: identityReady,
        },
        billing: {
          stripeCheckoutReady,
          stripeWebhookReady,
          billingProviderReady,
          legacyEntitlementRows: Number(row.legacy_entitlement_rows || 0),
          legacyRowsProtectedByStripeGates: true,
        },
        memberAudit: {
          authTotal: Number(memberAudit.auth_total || 0),
          profileTotal: Number(memberAudit.profile_total || 0),
          combinedTotal: Number(memberAudit.combined_total || 0),
          authNew24h: Number(memberAudit.auth_new_24h || 0),
          profileNew24h: Number(memberAudit.profile_new_24h || 0),
          newestAuthAt: memberAudit.newest_auth_at || null,
          newestProfileAt: memberAudit.newest_profile_at || null,
          consentTotal: Number(memberAudit.consent_total || 0),
          newestConsentAt: memberAudit.newest_consent_at || null,
          consentFkUsers: memberAudit.consent_fk_users === true,
          usersFkAuth: memberAudit.users_fk_auth === true,
        },
        optionalProviders: {
          aiProviderReady,
          scheduledSmsEnabled: sms.enabled,
          scheduledSmsProviderConfigured: sms.providerConfigured,
          scheduledSmsReady: sms.scheduledSmsReady,
        },
      },
    });
  } finally {
    await db.end();
  }
}
