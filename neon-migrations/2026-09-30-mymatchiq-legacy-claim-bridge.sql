-- O2OL / MyMatchIQ Prelaunch: legacy migration claim bridge
-- Never copy password/auth credentials between Neon projects.
-- Legacy data is claimed only after a verified O2OL identity matches the normalized email.

CREATE TABLE IF NOT EXISTS public.mmiq_legacy_migration_queue (
  source_user_id uuid PRIMARY KEY,
  normalized_email text NOT NULL UNIQUE,
  source_name text,
  source_tier text,
  source_locale text,
  source_verification_status text,
  source_onboarding_complete boolean NOT NULL DEFAULT false,
  passport_payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  compatibility_payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  invitation_payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  claim_status text NOT NULL DEFAULT 'pending' CHECK (claim_status IN ('pending','claimed','review','skipped')),
  claimed_o2ol_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmiq_legacy_migration_queue_status
  ON public.mmiq_legacy_migration_queue(claim_status, normalized_email);

CREATE TABLE IF NOT EXISTS public.mmiq_legacy_import_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id uuid NOT NULL,
  o2ol_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
