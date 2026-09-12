-- One2OneLove Neon migration: relationship/social core
-- Adapted from legacy Supabase schemas for Cloudflare Worker + Neon architecture.
-- Authorization is enforced by the Cloudflare Worker API, not Supabase RLS.

-- Buddy / friend requests
CREATE TABLE IF NOT EXISTS public.buddy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_buddy_request UNIQUE (from_user_id, to_user_id),
  CONSTRAINT no_self_requests CHECK (from_user_id <> to_user_id)
);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_from_user ON public.buddy_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_to_user ON public.buddy_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_status ON public.buddy_requests(status);
DROP TRIGGER IF EXISTS update_buddy_requests_updated_at ON public.buddy_requests;
CREATE TRIGGER update_buddy_requests_updated_at BEFORE UPDATE ON public.buddy_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Couples / personal calendar
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  event_type text NOT NULL CHECK (event_type IN ('date','anniversary','milestone','reminder','appointment','activity','other')),
  location text,
  notes text,
  color text NOT NULL DEFAULT 'pink',
  reminder_enabled boolean NOT NULL DEFAULT true,
  reminder_days_before integer NOT NULL DEFAULT 1 CHECK (reminder_days_before >= 0),
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern IN ('daily','weekly','monthly','yearly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Relationship goals and action steps
CREATE TABLE IF NOT EXISTS public.relationship_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('communication','quality_time','intimacy','personal_growth','financial','family','health','adventure','home','career')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date date NOT NULL,
  completed_date timestamptz,
  partner_email text,
  shared_with_partner boolean NOT NULL DEFAULT false,
  reminder_enabled boolean NOT NULL DEFAULT false,
  reminder_phone text,
  reminder_frequency text CHECK (reminder_frequency IN ('daily','weekly','biweekly')),
  last_reminder_sent timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_relationship_goals_user_status ON public.relationship_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_relationship_goals_target_date ON public.relationship_goals(target_date);

CREATE TABLE IF NOT EXISTS public.goal_action_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.relationship_goals(id) ON DELETE CASCADE,
  step_text text NOT NULL,
  step_order integer NOT NULL CHECK (step_order > 0),
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(goal_id, step_order)
);
CREATE INDEX IF NOT EXISTS idx_goal_action_steps_goal_order ON public.goal_action_steps(goal_id, step_order);
DROP TRIGGER IF EXISTS update_relationship_goals_updated_at ON public.relationship_goals;
CREATE TRIGGER update_relationship_goals_updated_at BEFORE UPDATE ON public.relationship_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_goal_action_steps_updated_at ON public.goal_action_steps;
CREATE TRIGGER update_goal_action_steps_updated_at BEFORE UPDATE ON public.goal_action_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_goal_completed_date()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    NEW.completed_date = now();
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_date = NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_goal_completed_date ON public.relationship_goals;
CREATE TRIGGER set_goal_completed_date BEFORE UPDATE ON public.relationship_goals
FOR EACH ROW EXECUTE FUNCTION public.update_goal_completed_date();

CREATE OR REPLACE VIEW public.goals_with_steps AS
SELECT g.*,
  COALESCE(
    json_agg(json_build_object(
      'id', s.id,
      'step_text', s.step_text,
      'step_order', s.step_order,
      'is_completed', s.is_completed,
      'completed_at', s.completed_at
    ) ORDER BY s.step_order) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) AS action_steps
FROM public.relationship_goals g
LEFT JOIN public.goal_action_steps s ON s.goal_id = g.id
GROUP BY g.id;

-- Relationship milestones / anniversaries
CREATE TABLE IF NOT EXISTS public.relationship_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  milestone_type text NOT NULL CHECK (milestone_type IN ('first_date','first_kiss','first_love','moving_in','engagement','wedding','anniversary','first_vacation','met_family','custom')),
  date date NOT NULL,
  description text,
  location text,
  partner_email text,
  media_urls text[] NOT NULL DEFAULT '{}',
  is_recurring boolean NOT NULL DEFAULT false,
  reminder_enabled boolean NOT NULL DEFAULT true,
  reminder_days_before integer NOT NULL DEFAULT 7 CHECK (reminder_days_before >= 0),
  last_reminder_sent timestamptz,
  celebration_ideas text[] NOT NULL DEFAULT '{}',
  celebration_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_user_date ON public.relationship_milestones(user_id, date);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_type ON public.relationship_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_recurring ON public.relationship_milestones(is_recurring) WHERE is_recurring = true;
DROP TRIGGER IF EXISTS update_relationship_milestones_updated_at ON public.relationship_milestones;
CREATE TRIGGER update_relationship_milestones_updated_at BEFORE UPDATE ON public.relationship_milestones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.milestones_with_next_date AS
SELECT m.*,
  CASE WHEN m.is_recurring THEN
    CASE WHEN CURRENT_DATE <= make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM m.date)::int,
      LEAST(EXTRACT(DAY FROM m.date)::int,
        EXTRACT(DAY FROM (date_trunc('month', make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM m.date)::int, 1)) + interval '1 month - 1 day'))::int))
    THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM m.date)::int,
      LEAST(EXTRACT(DAY FROM m.date)::int,
        EXTRACT(DAY FROM (date_trunc('month', make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM m.date)::int, 1)) + interval '1 month - 1 day'))::int))
    ELSE make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, EXTRACT(MONTH FROM m.date)::int,
      LEAST(EXTRACT(DAY FROM m.date)::int,
        EXTRACT(DAY FROM (date_trunc('month', make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, EXTRACT(MONTH FROM m.date)::int, 1)) + interval '1 month - 1 day'))::int))
    END
  ELSE m.date END AS next_occurrence
FROM public.relationship_milestones m;

-- Shared journals
CREATE TABLE IF NOT EXISTS public.shared_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  entry_date date NOT NULL,
  mood text NOT NULL CHECK (mood IN ('happy','grateful','reflective','excited','peaceful','challenged','loving')),
  tags text[] NOT NULL DEFAULT '{}',
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shared_journals_user_date ON public.shared_journals(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_shared_journals_mood ON public.shared_journals(mood);
CREATE INDEX IF NOT EXISTS idx_shared_journals_favorite ON public.shared_journals(user_id, is_favorite) WHERE is_favorite = true;
DROP TRIGGER IF EXISTS update_shared_journals_updated_at ON public.shared_journals;
CREATE TRIGGER update_shared_journals_updated_at BEFORE UPDATE ON public.shared_journals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Community success stories
CREATE TABLE IF NOT EXISTS public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  story_type text NOT NULL CHECK (story_type IN ('success','challenge','advice','milestone','transformation')),
  author_name text,
  is_anonymous boolean NOT NULL DEFAULT false,
  relationship_length text,
  tags text[] NOT NULL DEFAULT '{}',
  moderation_status text NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending','approved','rejected')),
  moderation_notes text,
  moderated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  views_count integer NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_success_stories_user ON public.success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_status_created ON public.success_stories(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_type ON public.success_stories(story_type);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON public.success_stories(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_success_stories_tags ON public.success_stories USING gin(tags);

CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.success_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON public.story_likes(user_id);

CREATE TABLE IF NOT EXISTS public.story_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.success_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_story_helpful_user ON public.story_helpful(user_id);
DROP TRIGGER IF EXISTS update_success_stories_updated_at ON public.success_stories;
CREATE TRIGGER update_success_stories_updated_at BEFORE UPDATE ON public.success_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_story_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.success_stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
    RETURN NEW;
  ELSE
    UPDATE public.success_stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS story_likes_count_insert ON public.story_likes;
DROP TRIGGER IF EXISTS story_likes_count_delete ON public.story_likes;
CREATE TRIGGER story_likes_count_insert AFTER INSERT ON public.story_likes
FOR EACH ROW EXECUTE FUNCTION public.update_story_likes_count();
CREATE TRIGGER story_likes_count_delete AFTER DELETE ON public.story_likes
FOR EACH ROW EXECUTE FUNCTION public.update_story_likes_count();

CREATE OR REPLACE FUNCTION public.update_story_helpful_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.success_stories SET helpful_count = helpful_count + 1 WHERE id = NEW.story_id;
    RETURN NEW;
  ELSE
    UPDATE public.success_stories SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS story_helpful_count_insert ON public.story_helpful;
DROP TRIGGER IF EXISTS story_helpful_count_delete ON public.story_helpful;
CREATE TRIGGER story_helpful_count_insert AFTER INSERT ON public.story_helpful
FOR EACH ROW EXECUTE FUNCTION public.update_story_helpful_count();
CREATE TRIGGER story_helpful_count_delete AFTER DELETE ON public.story_helpful
FOR EACH ROW EXECUTE FUNCTION public.update_story_helpful_count();

-- User presence. Realtime transport will be handled outside Postgres by the Cloudflare layer.
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','away','busy')),
  last_seen timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_presence_status_active ON public.user_presence(status, last_active DESC);

CREATE OR REPLACE FUNCTION public.update_user_presence(p_user_id uuid, p_status text DEFAULT 'online')
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_status NOT IN ('online','offline','away','busy') THEN
    RAISE EXCEPTION 'invalid presence status';
  END IF;
  INSERT INTO public.user_presence(user_id,status,last_seen,last_active,updated_at)
  VALUES (p_user_id,p_status,now(),now(),now())
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = CASE WHEN EXCLUDED.status = 'offline' THEN now() ELSE public.user_presence.last_seen END,
    last_active = now(),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_user_presence(p_user_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_presence(user_id,status,last_active,updated_at)
  VALUES (p_user_id,'online',now(),now())
  ON CONFLICT (user_id) DO UPDATE SET status='online', last_active=now(), updated_at=now();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.user_presence
  SET status='offline', last_seen=last_active, updated_at=now()
  WHERE status='online' AND last_active < now() - interval '5 minutes';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE VIEW public.user_presence_view AS
SELECT up.user_id, up.status, up.last_seen, up.last_active, up.updated_at,
       u.name, u.avatar_url,
       (up.last_active > now() - interval '5 minutes' AND up.status='online') AS is_online
FROM public.user_presence up
JOIN public.users u ON u.id = up.user_id;

INSERT INTO public.app_migrations(migration_key, notes)
VALUES ('20260905_relationship_social_core', 'Buddy, calendar, goals, milestones, journals, success stories, and presence adapted for Neon/Cloudflare')
ON CONFLICT (migration_key) DO NOTHING;
