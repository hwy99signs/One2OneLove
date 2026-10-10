-- One2OneLove game economy v1 — 2026-10-10
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone text;

CREATE TABLE IF NOT EXISTS public.o2ol_game_credit_ledger(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('signup_bonus','admin_grant','promo_grant','spend','expire')),
  amount_cents integer NOT NULL,
  remaining_cents integer,
  game text,
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor text,
  note text
);
CREATE INDEX IF NOT EXISTS idx_o2ol_game_credit_user_expiry ON public.o2ol_game_credit_ledger(user_id,expires_at,created_at);

CREATE TABLE IF NOT EXISTS public.o2ol_game_promotions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK(kind IN ('free_play','percent_off','credit_grant')),
  percent integer,
  grant_cents integer,
  grant_expiry_days integer,
  starts_at timestamptz,
  ends_at timestamptz,
  recurrence text NOT NULL DEFAULT 'none' CHECK(recurrence IN ('none','weekly')),
  recurrence_day integer CHECK(recurrence_day BETWEEN 0 AND 6),
  timezone_basis text NOT NULL DEFAULT 'member_local',
  games jsonb NOT NULL DEFAULT '"ALL"'::jsonb,
  audience text NOT NULL DEFAULT 'all' CHECK(audience IN ('all','new_members')),
  active boolean NOT NULL DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.o2ol_game_scores(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game text NOT NULL,
  score integer NOT NULL CHECK(score>=0),
  session_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,game,session_ref)
);
CREATE INDEX IF NOT EXISTS idx_o2ol_game_scores_board ON public.o2ol_game_scores(game,score DESC,created_at ASC);

ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS promotion_id uuid;
ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS game_credit_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS credit_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS promo_free boolean NOT NULL DEFAULT false;

INSERT INTO public.o2ol_game_promotions(name,kind,recurrence,recurrence_day,timezone_basis,games,audience,active,created_by)
SELECT 'Friday Free-Up','free_play','weekly',5,'member_local','"ALL"'::jsonb,'all',false,'system'
WHERE NOT EXISTS (SELECT 1 FROM public.o2ol_game_promotions WHERE lower(name)=lower('Friday Free-Up'));
