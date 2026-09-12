-- One2OneLove Neon migration: communities and forums
-- Adapted from legacy Supabase community schema for Cloudflare Worker + Neon.
-- Authorization and moderation checks are enforced by the Cloudflare API.

CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN (
    'long_distance','premarital','marriage','dating','lgbtq','parenting',
    'conflict_resolution','intimacy','communication','general'
  )),
  is_public boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT false,
  allow_member_posts boolean NOT NULL DEFAULT true,
  member_count integer NOT NULL DEFAULT 0 CHECK (member_count >= 0),
  post_count integer NOT NULL DEFAULT 0 CHECK (post_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_communities_creator ON public.communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_communities_category_created ON public.communities(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_public_created ON public.communities(is_public, created_at DESC);
DROP TRIGGER IF EXISTS update_communities_updated_at ON public.communities;
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','banned','left')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_members_community_status ON public.community_members(community_id, status);
CREATE INDEX IF NOT EXISTS idx_community_members_user_status ON public.community_members(user_id, status);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author_name text,
  is_anonymous boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  moderation_status text NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending','approved','rejected','hidden')),
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count integer NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  shares_count integer NOT NULL DEFAULT 0 CHECK (shares_count >= 0),
  views_count integer NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_created ON public.community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_status_pinned_created ON public.community_posts(moderation_status, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON public.community_posts USING gin(tags);
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text,
  is_anonymous boolean NOT NULL DEFAULT false,
  moderation_status text NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending','approved','rejected','hidden')),
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON public.post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);

CREATE TABLE IF NOT EXISTS public.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_to_community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
  shared_via text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_shares_post ON public.post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user ON public.post_shares(user_id);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id);

-- Recompute counters from source-of-truth rows. This is slower than blind increments,
-- but safer during migration and avoids drift after retries/deletes/status changes.
CREATE OR REPLACE FUNCTION public.refresh_community_member_count(p_community_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.communities c
  SET member_count = (SELECT count(*)::integer FROM public.community_members m
                      WHERE m.community_id=p_community_id AND m.status='active')
  WHERE c.id=p_community_id;
$$;

CREATE OR REPLACE FUNCTION public.community_member_count_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.refresh_community_member_count(COALESCE(NEW.community_id, OLD.community_id));
  IF TG_OP='UPDATE' AND NEW.community_id IS DISTINCT FROM OLD.community_id THEN
    PERFORM public.refresh_community_member_count(OLD.community_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS refresh_community_member_count_after_change ON public.community_members;
CREATE TRIGGER refresh_community_member_count_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.community_member_count_trigger();

CREATE OR REPLACE FUNCTION public.refresh_community_post_count(p_community_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.communities c
  SET post_count = (SELECT count(*)::integer FROM public.community_posts p
                    WHERE p.community_id=p_community_id AND p.moderation_status='approved')
  WHERE c.id=p_community_id;
$$;

CREATE OR REPLACE FUNCTION public.community_post_count_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.refresh_community_post_count(COALESCE(NEW.community_id, OLD.community_id));
  IF TG_OP='UPDATE' AND NEW.community_id IS DISTINCT FROM OLD.community_id THEN
    PERFORM public.refresh_community_post_count(OLD.community_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS refresh_community_post_count_after_change ON public.community_posts;
CREATE TRIGGER refresh_community_post_count_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.community_post_count_trigger();

CREATE OR REPLACE FUNCTION public.refresh_post_engagement(p_post_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.community_posts p
  SET likes_count = (SELECT count(*)::integer FROM public.post_likes l WHERE l.post_id=p_post_id),
      comments_count = (SELECT count(*)::integer FROM public.post_comments c WHERE c.post_id=p_post_id AND c.moderation_status='approved'),
      shares_count = (SELECT count(*)::integer FROM public.post_shares s WHERE s.post_id=p_post_id)
  WHERE p.id=p_post_id;
$$;

CREATE OR REPLACE FUNCTION public.post_like_count_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.refresh_post_engagement(COALESCE(NEW.post_id, OLD.post_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS refresh_post_likes_after_change ON public.post_likes;
CREATE TRIGGER refresh_post_likes_after_change AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.post_like_count_trigger();

CREATE OR REPLACE FUNCTION public.post_comment_count_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.refresh_post_engagement(COALESCE(NEW.post_id, OLD.post_id));
  IF TG_OP='UPDATE' AND NEW.post_id IS DISTINCT FROM OLD.post_id THEN
    PERFORM public.refresh_post_engagement(OLD.post_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS refresh_post_comments_after_change ON public.post_comments;
CREATE TRIGGER refresh_post_comments_after_change AFTER INSERT OR UPDATE OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.post_comment_count_trigger();

CREATE OR REPLACE FUNCTION public.post_share_count_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.refresh_post_engagement(COALESCE(NEW.post_id, OLD.post_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS refresh_post_shares_after_change ON public.post_shares;
CREATE TRIGGER refresh_post_shares_after_change AFTER INSERT OR DELETE ON public.post_shares
FOR EACH ROW EXECUTE FUNCTION public.post_share_count_trigger();

CREATE OR REPLACE FUNCTION public.refresh_comment_likes_count(p_comment_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.post_comments c
  SET likes_count = (SELECT count(*)::integer FROM public.comment_likes l WHERE l.comment_id=p_comment_id)
  WHERE c.id=p_comment_id;
$$;

CREATE OR REPLACE FUNCTION public.comment_like_count_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.refresh_comment_likes_count(COALESCE(NEW.comment_id, OLD.comment_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS refresh_comment_likes_after_change ON public.comment_likes;
CREATE TRIGGER refresh_comment_likes_after_change AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.comment_like_count_trigger();

CREATE OR REPLACE FUNCTION public.increment_post_views(p_post_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.community_posts SET views_count = views_count + 1 WHERE id=p_post_id
  RETURNING views_count INTO v_count;
  RETURN v_count;
END;
$$;

INSERT INTO public.app_migrations(migration_key, notes)
VALUES ('20260905_communities', 'Communities, membership, posts, comments, likes, shares and reliable engagement counters adapted for Neon/Cloudflare')
ON CONFLICT (migration_key) DO NOTHING;
