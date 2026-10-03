-- One2OneLove Founding Members + current billing defaults.
-- This migration is additive and preserves existing member/subscription rows.

ALTER TABLE public.users ALTER COLUMN subscription_plan SET DEFAULT 'Premiere';
ALTER TABLE public.users ALTER COLUMN subscription_price SET DEFAULT 9.99;
ALTER TABLE public.users ALTER COLUMN subscription_status SET DEFAULT 'inactive';

CREATE TABLE IF NOT EXISTS public.founding_members (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  founding_number integer UNIQUE NOT NULL CHECK (founding_number BETWEEN 1 AND 200),
  cohort text NOT NULL CHECK (cohort IN ('first100','second100')),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','active','cancelled')),
  badge_retained boolean NOT NULL DEFAULT true,
  founding_rate_forfeited boolean NOT NULL DEFAULT false,
  reservation_expires_at timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_o2ol_founding_members_number
  ON public.founding_members(founding_number);

CREATE INDEX IF NOT EXISTS idx_o2ol_founding_members_status
  ON public.founding_members(status);
