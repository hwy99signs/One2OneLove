-- ============================================================================
-- SUCCESS STORIES - DATABASE SCHEMA
-- ============================================================================
-- This creates tables for community success stories with moderation, likes, and helpful tracking
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SUCCESS STORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.success_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Story Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  story_type TEXT NOT NULL CHECK (story_type IN (
    'success',
    'challenge',
    'advice',
    'milestone',
    'transformation'
  )),
  
  -- Author Information
  author_name TEXT, -- User's name (null if anonymous)
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Story Details
  relationship_length TEXT, -- e.g., "2 years, 6 months"
  tags TEXT[], -- Array of tags
  
  -- Moderation
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN (
    'pending',
    'approved',
    'rejected'
  )),
  moderation_notes TEXT, -- Admin notes for rejection
  moderated_by UUID REFERENCES public.users(id), -- Admin who moderated
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE, -- Featured stories appear prominently
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_success_stories_user_id 
  ON public.success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_moderation_status 
  ON public.success_stories(moderation_status);
CREATE INDEX IF NOT EXISTS idx_success_stories_story_type 
  ON public.success_stories(story_type);
CREATE INDEX IF NOT EXISTS idx_success_stories_created_at 
  ON public.success_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured 
  ON public.success_stories(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_success_stories_tags 
  ON public.success_stories USING GIN(tags); -- GIN index for array searches

-- ============================================================================
-- 2. STORY LIKES TABLE (Track who liked which stories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.story_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.success_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id) -- Prevent duplicate likes
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id 
  ON public.story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id 
  ON public.story_likes(user_id);

-- ============================================================================
-- 3. STORY HELPFUL TRACKING TABLE (Track who marked stories as helpful)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.story_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.success_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id) -- Prevent duplicate helpful marks
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_helpful_story_id 
  ON public.story_helpful(story_id);
CREATE INDEX IF NOT EXISTS idx_story_helpful_user_id 
  ON public.story_helpful(user_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on success_stories
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can create own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can update own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Admins can moderate stories" ON public.success_stories;

-- RLS Policies for success_stories
-- Anyone can view approved stories (public)
CREATE POLICY "Anyone can view approved stories" ON public.success_stories
  FOR SELECT USING (moderation_status = 'approved');

-- Users can view their own stories (even if pending/rejected)
CREATE POLICY "Users can view own stories" ON public.success_stories
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own stories
CREATE POLICY "Users can create own stories" ON public.success_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories (only if pending or approved)
CREATE POLICY "Users can update own stories" ON public.success_stories
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    moderation_status IN ('pending', 'approved')
  );

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories" ON public.success_stories
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can moderate any story (check user_type = 'admin' or similar)
-- Note: Adjust this based on your admin role system
CREATE POLICY "Admins can moderate stories" ON public.success_stories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Enable RLS on story_likes
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view story likes" ON public.story_likes;
DROP POLICY IF EXISTS "Users can like stories" ON public.story_likes;
DROP POLICY IF EXISTS "Users can unlike stories" ON public.story_likes;

CREATE POLICY "Anyone can view story likes" ON public.story_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like stories" ON public.story_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike stories" ON public.story_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on story_helpful
ALTER TABLE public.story_helpful ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view story helpful" ON public.story_helpful;
DROP POLICY IF EXISTS "Users can mark stories helpful" ON public.story_helpful;
DROP POLICY IF EXISTS "Users can unmark stories helpful" ON public.story_helpful;

CREATE POLICY "Anyone can view story helpful" ON public.story_helpful
  FOR SELECT USING (true);

CREATE POLICY "Users can mark stories helpful" ON public.story_helpful
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmark stories helpful" ON public.story_helpful
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_success_stories_updated_at ON public.success_stories;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_success_stories_updated_at
  BEFORE UPDATE ON public.success_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update likes_count when a like is added/removed
CREATE OR REPLACE FUNCTION update_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.success_stories 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.success_stories 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS story_likes_count_insert ON public.story_likes;
DROP TRIGGER IF EXISTS story_likes_count_delete ON public.story_likes;

-- Create triggers for likes count
CREATE TRIGGER story_likes_count_insert
  AFTER INSERT ON public.story_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_story_likes_count();

CREATE TRIGGER story_likes_count_delete
  AFTER DELETE ON public.story_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_story_likes_count();

-- Function to update helpful_count when helpful is added/removed
CREATE OR REPLACE FUNCTION update_story_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.success_stories 
    SET helpful_count = helpful_count + 1 
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.success_stories 
    SET helpful_count = GREATEST(0, helpful_count - 1) 
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS story_helpful_count_insert ON public.story_helpful;
DROP TRIGGER IF EXISTS story_helpful_count_delete ON public.story_helpful;

-- Create triggers for helpful count
CREATE TRIGGER story_helpful_count_insert
  AFTER INSERT ON public.story_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_story_helpful_count();

CREATE TRIGGER story_helpful_count_delete
  AFTER DELETE ON public.story_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_story_helpful_count();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Run this entire SQL script in your Supabase SQL Editor
-- 2. Verify tables were created: success_stories, story_likes, story_helpful
-- 3. Use the successStoriesService.js file to interact with these tables
-- ============================================================================

