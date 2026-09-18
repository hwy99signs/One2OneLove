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
        COALESCE((pc.plugin_configs->'phoneNumber'->>'enabled')::boolean,false) AS phone_enabled,
        (
          SELECT count(*)::int FROM public.users
          WHERE stripe_subscription_id IS NULL
            AND lower(COALESCE(subscription_status,'')) IN ('active','trial','trialing')
        ) AS legacy_entitlement_rows,
        COALESCE((
          SELECT column_default = '''Basic''::text'
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='subscription_plan'
        ),false) AS basic_default_ready,
        COALESCE((
          SELECT column_default = '4.99'
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

    const emailVerificationReady = Boolean(row.consents_ready && row.email_required && row.email_on_signup && row.email_method);
    const emailDeliveryReady = Boolean(row.email_provider_type && row.email_provider_type !== 'shared');
    const phoneVerificationReady = row.phone_enabled === true;
    const identityReady = emailVerificationReady && emailDeliveryReady && phoneVerificationReady;

    const billingDefaultsReady = Boolean(row.basic_default_ready && row.price_default_ready && row.status_default_ready);
    const stripeCheckoutReady = Boolean(
      env.STRIPE_SECRET_KEY &&
      env.STRIPE_PRICE_BASIC &&
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
          requiredIdentityReady: identityReady,
        },
        billing: {
          stripeCheckoutReady,
          stripeWebhookReady,
          billingProviderReady,
          legacyEntitlementRows: Number(row.legacy_entitlement_rows || 0),
          legacyRowsProtectedByStripeGates: true,
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
