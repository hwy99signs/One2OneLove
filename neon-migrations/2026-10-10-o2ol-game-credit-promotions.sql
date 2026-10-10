-- One2OneLove Game Credit + Promotions + Leaderboards
-- Owner-approved 2026-10-10 blueprint.

CREATE TABLE IF NOT EXISTS public.o2ol_game_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('signup_bonus','admin_grant','promo_grant','spend','expire')),
  amount_cents integer NOT NULL,
  remaining_cents integer,
  game text,
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz,
  source_grant_id uuid REFERENCES public.o2ol_game_credit_ledger(id) ON DELETE SET NULL,
  actor text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind IN ('signup_bonus','admin_grant','promo_grant') AND amount_cents > 0 AND remaining_cents >= 0)
    OR
    (kind IN ('spend','expire') AND amount_cents < 0 AND remaining_cents IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_o2ol_game_credit_grants
  ON public.o2ol_game_credit_ledger(user_id,expires_at,created_at)
  WHERE kind IN ('signup_bonus','admin_grant','promo_grant') AND remaining_cents > 0;
CREATE INDEX IF NOT EXISTS idx_o2ol_game_credit_user_created
  ON public.o2ol_game_credit_ledger(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.o2ol_game_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('free_play','percent_off','credit_grant')),
  percent integer CHECK (percent IS NULL OR percent BETWEEN 0 AND 100),
  grant_cents integer CHECK (grant_cents IS NULL OR grant_cents > 0),
  grant_expiry_days integer CHECK (grant_expiry_days IS NULL OR grant_expiry_days BETWEEN 1 AND 365),
  starts_at timestamptz,
  ends_at timestamptz,
  recurrence text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','weekly')),
  recurrence_day integer CHECK (recurrence_day IS NULL OR recurrence_day BETWEEN 0 AND 6),
  timezone_basis text NOT NULL DEFAULT 'member_local' CHECK (timezone_basis='member_local'),
  games jsonb NOT NULL DEFAULT '"ALL"'::jsonb,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','new_members')),
  active boolean NOT NULL DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_o2ol_game_promotions_active
  ON public.o2ol_game_promotions(active,kind,recurrence);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS timezone_name text;

ALTER TABLE public.o2ol_game_access_passes
  ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES public.o2ol_game_promotions(id) ON DELETE SET NULL;
ALTER TABLE public.o2ol_game_access_passes
  ADD COLUMN IF NOT EXISTS game_credit_cents integer NOT NULL DEFAULT 0 CHECK(game_credit_cents >= 0);
ALTER TABLE public.o2ol_game_access_passes
  ADD COLUMN IF NOT EXISTS credit_cents integer NOT NULL DEFAULT 0 CHECK(credit_cents >= 0);
ALTER TABLE public.o2ol_game_access_passes
  ADD COLUMN IF NOT EXISTS promo_free boolean NOT NULL DEFAULT false;

ALTER TABLE public.o2ol_game_launch_tickets
  ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES public.o2ol_game_promotions(id) ON DELETE SET NULL;
ALTER TABLE public.o2ol_game_launch_tickets
  ADD COLUMN IF NOT EXISTS game_credit_cents integer NOT NULL DEFAULT 0 CHECK(game_credit_cents >= 0);
ALTER TABLE public.o2ol_game_launch_tickets
  ADD COLUMN IF NOT EXISTS credit_cents integer NOT NULL DEFAULT 0 CHECK(credit_cents >= 0);
ALTER TABLE public.o2ol_game_launch_tickets
  ADD COLUMN IF NOT EXISTS promo_free boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.o2ol_game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game text NOT NULL,
  score integer NOT NULL CHECK(score >= 0),
  session_ref uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game,user_id,session_ref)
);
CREATE INDEX IF NOT EXISTS idx_o2ol_game_scores_game_score
  ON public.o2ol_game_scores(game,score DESC,created_at ASC);

INSERT INTO public.o2ol_game_promotions(
  name,kind,recurrence,recurrence_day,timezone_basis,games,audience,active,created_by
)
SELECT 'Friday Free-Up','free_play','weekly',5,'member_local','"ALL"'::jsonb,'all',false,'system'
WHERE NOT EXISTS (
  SELECT 1 FROM public.o2ol_game_promotions WHERE lower(name)=lower('Friday Free-Up')
);
