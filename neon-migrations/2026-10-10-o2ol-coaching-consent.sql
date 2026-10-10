-- O2OL shared coaching consent for Bianca + Amora.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS coaching_consent_version text,
  ADD COLUMN IF NOT EXISTS coaching_consent_accepted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.coaching_consent_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'coaching_gate',
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_consent_history_user_idx
  ON public.coaching_consent_history(user_id, accepted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS coaching_consent_history_user_version_uidx
  ON public.coaching_consent_history(user_id, consent_version);
