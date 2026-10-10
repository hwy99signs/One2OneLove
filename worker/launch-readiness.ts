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
        to_regclass('public.o2ol_token_wallets') IS NOT NULL AS token_wallets_ready,
        to_regclass('public.o2ol_token_transactions') IS NOT NULL AS token_transactions_ready,
        to_regclass('public.o2ol_token_feature_prices') IS NOT NULL AS token_prices_ready,
        to_regclass('public.o2ol_token_packages') IS NOT NULL AS token_packages_ready,
        COALESCE((pc.email_and_password->>'requireEmailVerification')::boolean,false) AS email_required,
        COALESCE((pc.email_and_password->>'sendVerificationEmailOnSignUp')::boolean,false) AS email_on_signup,
        COALESCE(pc.email_and_password->>'emailVerificationMethod','') AS email_method,
        COALESCE((pc.email_and_password->>'disableSignUp')::boolean,false) AS signup_disabled,
        COALESCE((pc.email_and_password->>'autoSignInAfterVerification')::boolean,false) AS auto_signin_after_verification,
        COALESCE(pc.email_provider->>'type','') AS email_provider_type,
        COALESCE(pc.email_and_password->>'enabled','') AS email_password_enabled,
        COALESCE(pc.email_and_password->>'minPasswordLength','') AS min_password_length,
        COALESCE(pc.email_and_password->>'maxPasswordLength','') AS max_password_length,
        COALESCE(to_jsonb(pc)->'trusted_origins','[]'::jsonb) AS trusted_origins,
        COALESCE(to_jsonb(pc)->>'project_id','') AS project_id_hint,
        COALESCE(to_jsonb(pc)->'plugins','[]'::jsonb) AS auth_plugins,
        CASE WHEN jsonb_typeof(COALESCE(to_jsonb(pc)->'plugin_configs','{}'::jsonb))='object'
          THEN (SELECT COALESCE(jsonb_agg(k ORDER BY k),'[]'::jsonb) FROM jsonb_object_keys(COALESCE(to_jsonb(pc)->'plugin_configs','{}'::jsonb)) AS k)
          ELSE '[]'::jsonb END AS plugin_config_keys,
        CASE WHEN jsonb_typeof(COALESCE(pc.email_and_password,'{}'::jsonb))='object'
          THEN (SELECT COALESCE(jsonb_agg(k ORDER BY k),'[]'::jsonb) FROM jsonb_object_keys(COALESCE(pc.email_and_password,'{}'::jsonb)) AS k)
          ELSE '[]'::jsonb END AS email_password_keys,
        (SELECT jsonb_agg(k ORDER BY k) FROM jsonb_object_keys(to_jsonb(pc)) AS k) AS project_config_keys,
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
        ) AS users_fk_auth,
        (SELECT count(*)::int FROM neon_auth.verification) AS verification_total,
        (SELECT max("createdAt") FROM neon_auth.verification) AS newest_verification_at,
        (SELECT count(*)::int FROM neon_auth.verification WHERE "createdAt" >= now()-interval '24 hours') AS verification_new_24h,
        (SELECT count(*)::int
           FROM neon_auth.verification v
          WHERE v."createdAt" >= now()-interval '24 hours'
            AND EXISTS (
              SELECT 1 FROM neon_auth."user" u
               WHERE lower(v.identifier) LIKE '%' || lower(u.email) || '%'
            )) AS verification_new_24h_existing_users,
        (SELECT array_agg(DISTINCT regexp_replace(identifier,'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+','<email>','g'))
           FROM neon_auth.verification
          WHERE "createdAt" >= now()-interval '24 hours') AS verification_identifier_shapes,
        (SELECT count(*)::int FROM neon_auth.account) AS account_total,
        (SELECT max("createdAt") FROM neon_auth.account) AS newest_account_at,
        (SELECT jsonb_object_agg(role,count) FROM (
          SELECT COALESCE(role,'user') AS role,count(*)::int AS count
          FROM neon_auth."user" GROUP BY COALESCE(role,'user')
        ) roles) AS auth_roles,
        (SELECT count(*)::int FROM public.waitlist) AS waitlist_total,
        (SELECT count(*)::int FROM public.waitlist WHERE created_at >= now()-interval '7 days') AS waitlist_new_7d,
        (SELECT max(created_at) FROM public.waitlist) AS newest_waitlist_at,
        (SELECT count(*)::int FROM public.therapist_profiles) AS therapist_total,
        (SELECT count(*)::int FROM public.professional_profiles) AS professional_total,
        (SELECT count(*)::int FROM public.influencer_profiles) AS contributor_total,
        current_setting('neon.project_id', true) AS neon_project_id_setting,
        current_setting('neon.branch_id', true) AS neon_branch_id_setting,
        (SELECT jsonb_object_agg(name,setting) FROM pg_settings WHERE name ILIKE '%neon%' OR name ILIKE '%project%') AS neon_related_settings,
        (
          SELECT count(*)::int
          FROM neon_auth.verification v
          WHERE v."createdAt" >= now()-interval '48 hours'
            AND NOT EXISTS (
              SELECT 1 FROM neon_auth."user" u
              WHERE lower(v.identifier) LIKE '%' || lower(u.email) || '%'
            )
        ) AS verification_without_user_48h,
        (
          SELECT EXISTS (
            SELECT 1 FROM neon_auth."user" u
            WHERE lower(v.identifier) LIKE '%' || lower(u.email) || '%'
          )
          FROM neon_auth.verification v
          ORDER BY v."createdAt" DESC
          LIMIT 1
        ) AS latest_verification_matches_user,
        (
          SELECT lower(v.identifier) LIKE '%email-verification%'
          FROM neon_auth.verification v
          ORDER BY v."createdAt" DESC
          LIMIT 1
        ) AS latest_verification_is_email_verification,
        (
          SELECT lower(v.identifier) LIKE '%password%'
          FROM neon_auth.verification v
          ORDER BY v."createdAt" DESC
          LIMIT 1
        ) AS latest_verification_is_password_flow
    `);
    const memberAudit = memberAuditResult.rows[0] || {};

    const emailVerificationReady = Boolean(row.consents_ready && row.email_required && row.email_on_signup && row.email_method);
    const emailDeliveryReady = Boolean(row.email_provider_type && row.email_provider_type !== 'shared');
    const phoneVerificationProviderConfigured = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
    const phoneVerificationSchemaReady = row.phone_schema_ready === true;
    const phoneVerificationReady = phoneVerificationProviderConfigured && phoneVerificationSchemaReady;
    const identityReady = emailVerificationReady && emailDeliveryReady && phoneVerificationReady;

    const accountDefaultsReady = Boolean(row.free_default_ready && row.zero_price_default_ready && row.status_default_ready);
    const tokenSchemaReady = Boolean(
      row.token_wallets_ready &&
      row.token_transactions_ready &&
      row.token_prices_ready &&
      row.token_packages_ready
    );
    const stripeTokenCheckoutReady = Boolean(env.STRIPE_SECRET_KEY);
    const stripeWebhookReady = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
    const tokenPaymentProviderReady = stripeTokenCheckoutReady && stripeWebhookReady;

    const sms = scheduledSmsReadiness(env);
    const aiProviderReady = Boolean(env.OPENAI_API_KEY);
    const requiredDatabaseReady = Boolean(
      row.users_ready &&
      row.consents_ready &&
      row.category_preferences_ready &&
      row.suggestions_ready &&
      accountDefaultsReady &&
      tokenSchemaReady
    );

    const requiredLaunchReady = Boolean(identityReady && tokenPaymentProviderReady && requiredDatabaseReady);

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
          accountDefaultsReady,
          billingDefaultsReady: accountDefaultsReady,
          tokenSchemaReady,
          tokenWalletsReady: row.token_wallets_ready === true,
          tokenTransactionsReady: row.token_transactions_ready === true,
          tokenPricesReady: row.token_prices_ready === true,
          tokenPackagesReady: row.token_packages_ready === true,
          requiredDatabaseReady,
        },
        identity: {
          emailVerificationReady,
          emailDeliveryReady,
          emailProviderMode: row.email_provider_type || null,
          phoneVerificationReady,
          emailPasswordEnabled: row.email_password_enabled || null,
          signUpDisabled: row.signup_disabled === true,
          autoSignInAfterVerification: row.auto_signin_after_verification === true,
          minPasswordLength: row.min_password_length || null,
          maxPasswordLength: row.max_password_length || null,
          phoneVerificationProviderConfigured,
          phoneVerificationSchemaReady,
          requiredIdentityReady: identityReady,
        },
        billing: {
          accessModel: 'free_tokens',
          recurringSubscriptionCheckoutReady: false,
          stripeTokenCheckoutReady,
          stripeCheckoutReady: stripeTokenCheckoutReady,
          stripeWebhookReady,
          tokenPaymentProviderReady,
          billingProviderReady: tokenPaymentProviderReady,
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
