-- Like Minded launch hardening
-- Idempotent production migration for usage metering, resume/history support and cleanup.

CREATE TABLE IF NOT EXISTS public.like_minded_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  usage_key varchar(220) NOT NULL,
  mode varchar(20) NOT NULL CHECK (mode IN ('solo','multiplayer')),
  question_id varchar(180) NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_key)
);

CREATE INDEX IF NOT EXISTS idx_like_minded_usage_user_day
  ON public.like_minded_usage(user_id, used_at DESC);

CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_user_activity
  ON public.like_minded_rooms(host_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_guest_activity
  ON public.like_minded_rooms(guest_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_like_minded_rooms_status_activity
  ON public.like_minded_rooms(status, updated_at DESC);
