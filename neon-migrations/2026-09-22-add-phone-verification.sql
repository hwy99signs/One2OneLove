ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS phone_number_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verification_last_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_phone_number_verified
  ON public.users (phone_number_verified);
