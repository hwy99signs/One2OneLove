-- One2OneLove Neon migration: auditable launch signup consent records.
-- Keeps legal/age/language/country acceptance separate from editable profile data.

CREATE TABLE IF NOT EXISTS public.signup_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  email text NOT NULL,
  country text NOT NULL,
  preferred_language text NOT NULL,
  terms_version text NOT NULL,
  terms_accepted_at timestamptz NOT NULL,
  privacy_policy_acknowledged boolean NOT NULL CHECK (privacy_policy_acknowledged = true),
  age_18_confirmed boolean NOT NULL CHECK (age_18_confirmed = true),
  signup_source text NOT NULL DEFAULT 'one2onelove_prelaunch',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, terms_version)
);

CREATE INDEX IF NOT EXISTS idx_signup_consents_email ON public.signup_consents(email);
CREATE INDEX IF NOT EXISTS idx_signup_consents_created_at ON public.signup_consents(created_at DESC);

INSERT INTO public.app_migrations(migration_key, notes)
VALUES ('20260912_launch_signup_consents', 'Adds auditable 18+, terms, privacy, country and language acceptance for launch signup')
ON CONFLICT (migration_key) DO NOTHING;
