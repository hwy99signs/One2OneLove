-- One2OneLove Neon migration: fun/engagement foundation formerly supplied by Base44.

CREATE TABLE IF NOT EXISTS public.gamification_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points_earned integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  activity_type text NOT NULL,
  activity_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gamification_points_user_created ON public.gamification_points(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_points_activity ON public.gamification_points(activity_type);
DROP TRIGGER IF EXISTS update_gamification_points_updated_at ON public.gamification_points;
CREATE TRIGGER update_gamification_points_updated_at BEFORE UPDATE ON public.gamification_points
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_name text NOT NULL,
  badge_type text NOT NULL,
  badge_icon text,
  description text,
  earned_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_badges_user_earned ON public.badges(user_id, earned_date DESC);

CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  memory_date date NOT NULL,
  location text,
  media_urls text[] NOT NULL DEFAULT '{}',
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memories_user_date ON public.memories(user_id, memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_favorite ON public.memories(user_id, is_favorite) WHERE is_favorite=true;
DROP TRIGGER IF EXISTS update_memories_updated_at ON public.memories;
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.custom_date_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  budget text,
  location_type text,
  occasion text,
  relationship_stage text,
  is_favorite boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_custom_date_ideas_user_created ON public.custom_date_ideas(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_date_ideas_favorite ON public.custom_date_ideas(user_id, is_favorite) WHERE is_favorite=true;
DROP TRIGGER IF EXISTS update_custom_date_ideas_updated_at ON public.custom_date_ideas;
CREATE TRIGGER update_custom_date_ideas_updated_at BEFORE UPDATE ON public.custom_date_ideas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  country text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist(created_at DESC);

CREATE TABLE IF NOT EXISTS public.buddy_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buddy_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','blocked')),
  matched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,buddy_user_id),
  CHECK(user_id<>buddy_user_id)
);
CREATE INDEX IF NOT EXISTS idx_buddy_matches_user_status ON public.buddy_matches(user_id,status);
CREATE INDEX IF NOT EXISTS idx_buddy_matches_buddy_status ON public.buddy_matches(buddy_user_id,status);
DROP TRIGGER IF EXISTS update_buddy_matches_updated_at ON public.buddy_matches;
CREATE TRIGGER update_buddy_matches_updated_at BEFORE UPDATE ON public.buddy_matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.contest_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  contest_type text NOT NULL,
  period text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  activities_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_email,contest_type,period)
);
CREATE INDEX IF NOT EXISTS idx_contest_participants_period_score ON public.contest_participants(contest_type,period,score DESC);
DROP TRIGGER IF EXISTS update_contest_participants_updated_at ON public.contest_participants;
CREATE TRIGGER update_contest_participants_updated_at BEFORE UPDATE ON public.contest_participants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.contest_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  contest_type text NOT NULL,
  period text NOT NULL,
  rank integer NOT NULL CHECK (rank > 0),
  prize_description text,
  won_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contest_type,period,rank)
);
CREATE INDEX IF NOT EXISTS idx_contest_winners_period_rank ON public.contest_winners(contest_type,period,rank);

CREATE OR REPLACE VIEW public.user_point_totals AS
SELECT user_id, COALESCE(sum(CASE WHEN points_earned<>0 THEN points_earned ELSE points END),0)::bigint AS total_points
FROM public.gamification_points GROUP BY user_id;

INSERT INTO public.app_migrations(migration_key,notes)
VALUES ('20260905_fun_engagement','Gamification, badges, memories, date ideas, waitlist, buddy matches and contests adapted for Neon/Cloudflare')
ON CONFLICT (migration_key) DO NOTHING;
