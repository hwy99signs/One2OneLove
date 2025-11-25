-- ============================================================================
-- COMMUNITIES & FORUMS - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This creates tables for user-created communities with posts, comments, likes, and shares
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. COMMUNITIES TABLE (User-created communities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Community Details
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon identifier
  category TEXT CHECK (category IN (
    'long_distance',
    'premarital',
    'marriage',
    'dating',
    'lgbtq',
    'parenting',
    'conflict_resolution',
    'intimacy',
    'communication',
    'general'
  )),
  
  -- Settings
  is_public BOOLEAN DEFAULT TRUE, -- Public communities can be joined by anyone
  requires_approval BOOLEAN DEFAULT FALSE, -- Require approval to join
  allow_member_posts BOOLEAN DEFAULT TRUE, -- Allow members to create posts
  
  -- Statistics (auto-updated by triggers)
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communities_creator_id ON public.communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities(category);
CREATE INDEX IF NOT EXISTS idx_communities_is_public ON public.communities(is_public);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON public.communities(created_at DESC);

-- ============================================================================
-- 2. COMMUNITY MEMBERS TABLE (Track who joined which communities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Member Role
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned', 'left')),
  
  -- Metadata
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id) -- Prevent duplicate memberships
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON public.community_members(status);

-- ============================================================================
-- 3. COMMUNITY POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Post Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Author Information
  author_name TEXT, -- User's name (null if anonymous)
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Post Details
  tags TEXT[], -- Array of tags
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT FALSE, -- Pinned posts appear at top
  is_locked BOOLEAN DEFAULT FALSE, -- Locked posts can't be commented on
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN (
    'pending',
    'approved',
    'rejected',
    'hidden'
  )),
  
  -- Engagement (auto-updated by triggers)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_moderation_status ON public.community_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON public.community_posts USING GIN(tags);

-- ============================================================================
-- 4. POST COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- For nested replies
  
  -- Comment Content
  content TEXT NOT NULL,
  
  -- Author Information
  author_name TEXT, -- User's name (null if anonymous)
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Moderation
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN (
    'pending',
    'approved',
    'rejected',
    'hidden'
  )),
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON public.post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_comment_id ON public.post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at);

-- ============================================================================
-- 5. POST LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- ============================================================================
-- 6. POST SHARES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_to_community_id UUID REFERENCES public.communities(id), -- If shared to another community
  shared_via TEXT, -- 'internal', 'facebook', 'twitter', 'email', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON public.post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON public.post_shares(user_id);

-- ============================================================================
-- 7. COMMENT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id) -- Prevent duplicate likes
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view communities they joined" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Creators can update own communities" ON public.communities;
DROP POLICY IF EXISTS "Creators can delete own communities" ON public.communities;

-- Anyone can view public communities
CREATE POLICY "Anyone can view public communities" ON public.communities
  FOR SELECT USING (is_public = true);

-- Users can view communities they joined (even if private)
CREATE POLICY "Users can view communities they joined" ON public.communities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'active'
    )
  );

-- Users can create communities
CREATE POLICY "Users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Creators can update their communities
CREATE POLICY "Creators can update own communities" ON public.communities
  FOR UPDATE USING (auth.uid() = creator_id);

-- Creators can delete their communities
CREATE POLICY "Creators can delete own communities" ON public.communities
  FOR DELETE USING (auth.uid() = creator_id);

-- Enable RLS on community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;

CREATE POLICY "Users can view community members" ON public.community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_members.community_id
      AND (communities.is_public = true OR communities.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON public.community_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
      AND cm.status = 'active'
    )
  );

-- Enable RLS on community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view approved posts in joined communities" ON public.community_posts;
DROP POLICY IF EXISTS "Users can view own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.community_posts;

CREATE POLICY "Users can view approved posts in joined communities" ON public.community_posts
  FOR SELECT USING (
    moderation_status = 'approved' AND
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = community_posts.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'active'
    )
  );

CREATE POLICY "Users can view own posts" ON public.community_posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Members can create posts" ON public.community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = community_posts.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'active'
    )
  );

CREATE POLICY "Authors can update own posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts" ON public.community_posts
  FOR DELETE USING (auth.uid() = author_id);

-- Enable RLS on post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view approved comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Authors can update own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Authors can delete own comments" ON public.post_comments;

CREATE POLICY "Users can view approved comments" ON public.post_comments
  FOR SELECT USING (
    moderation_status = 'approved' AND
    EXISTS (
      SELECT 1 FROM public.community_posts
      JOIN public.community_members ON community_members.community_id = community_posts.community_id
      WHERE community_posts.id = post_comments.post_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'active'
    )
  );

CREATE POLICY "Users can view own comments" ON public.post_comments
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create comments" ON public.post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.community_posts
      JOIN public.community_members ON community_members.community_id = community_posts.community_id
      WHERE community_posts.id = post_comments.post_id
      AND community_members.user_id = auth.uid()
      AND community_members.status = 'active'
      AND community_posts.is_locked = false
    )
  );

CREATE POLICY "Authors can update own comments" ON public.post_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;

CREATE POLICY "Anyone can view post likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on post_shares
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shares" ON public.post_shares;
DROP POLICY IF EXISTS "Users can share posts" ON public.post_shares;

CREATE POLICY "Users can view own shares" ON public.post_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can share posts" ON public.post_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;

CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON public.comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" ON public.comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_communities_updated_at ON public.communities;
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update community member_count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.communities 
    SET member_count = GREATEST(0, member_count - 1) 
    WHERE id = OLD.community_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE public.communities 
      SET member_count = GREATEST(0, member_count - 1) 
      WHERE id = NEW.community_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE public.communities 
      SET member_count = member_count + 1 
      WHERE id = NEW.community_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_member_count_insert ON public.community_members;
DROP TRIGGER IF EXISTS community_member_count_delete ON public.community_members;
DROP TRIGGER IF EXISTS community_member_count_update ON public.community_members;

CREATE TRIGGER community_member_count_insert
  AFTER INSERT ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

CREATE TRIGGER community_member_count_delete
  AFTER DELETE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

CREATE TRIGGER community_member_count_update
  AFTER UPDATE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

-- Function to update community post_count
CREATE OR REPLACE FUNCTION update_community_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities 
    SET post_count = post_count + 1 
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities 
    SET post_count = GREATEST(0, post_count - 1) 
    WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_post_count_insert ON public.community_posts;
DROP TRIGGER IF EXISTS community_post_count_delete ON public.community_posts;

CREATE TRIGGER community_post_count_insert
  AFTER INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_post_count();

CREATE TRIGGER community_post_count_delete
  AFTER DELETE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_post_count();

-- Function to update post likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_likes_count_insert ON public.post_likes;
DROP TRIGGER IF EXISTS post_likes_count_delete ON public.post_likes;

CREATE TRIGGER post_likes_count_insert
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER post_likes_count_delete
  AFTER DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Function to update post comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_comments_count_insert ON public.post_comments;
DROP TRIGGER IF EXISTS post_comments_count_delete ON public.post_comments;

CREATE TRIGGER post_comments_count_insert
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER post_comments_count_delete
  AFTER DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Function to update post shares_count
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET shares_count = GREATEST(0, shares_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_shares_count_insert ON public.post_shares;
DROP TRIGGER IF EXISTS post_shares_count_delete ON public.post_shares;

CREATE TRIGGER post_shares_count_insert
  AFTER INSERT ON public.post_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_post_shares_count();

CREATE TRIGGER post_shares_count_delete
  AFTER DELETE ON public.post_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_post_shares_count();

-- Function to update comment likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_likes_count_insert ON public.comment_likes;
DROP TRIGGER IF EXISTS comment_likes_count_delete ON public.comment_likes;

CREATE TRIGGER comment_likes_count_insert
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

CREATE TRIGGER comment_likes_count_delete
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Run this entire SQL script in your Supabase SQL Editor
-- 2. Verify tables were created: communities, community_members, community_posts,
--    post_comments, post_likes, post_shares, comment_likes
-- 3. Use the communityService.js file to interact with these tables
-- ============================================================================

