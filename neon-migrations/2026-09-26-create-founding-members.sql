BEGIN;
CREATE TABLE IF NOT EXISTS public.founding_member_counter (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  last_member_number integer NOT NULL DEFAULT 0 CHECK (last_member_number BETWEEN 0 AND 200)
);
INSERT INTO public.founding_member_counter(singleton,last_member_number)
VALUES(true,0) ON CONFLICT(singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.founding_members (
 user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE RESTRICT,
 member_number integer NOT NULL UNIQUE CHECK (member_number BETWEEN 1 AND 200),
 club text NOT NULL CHECK (club IN ('FIRST_100','FOUNDING_MEMBER')),
 founding_plan text NOT NULL CHECK (founding_plan IN ('Exclusive','Premiere')),
 founding_rate_cents integer, joined_at timestamptz NOT NULL DEFAULT now(),
 trial_ends_at timestamptz, continuous_subscription boolean NOT NULL DEFAULT true,
 founding_rate_forfeited_at timestamptz, welcome_email_sent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS founding_members_club_idx ON public.founding_members(club);
COMMIT;