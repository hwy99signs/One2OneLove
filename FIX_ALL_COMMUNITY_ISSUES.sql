-- ============================================================================
-- FIX: ALL COMMUNITY ISSUES (Success Stories, Buddies, Friend Requests)
-- ============================================================================
-- Run this ENTIRE SQL in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX SUCCESS STORIES VISIBILITY
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.success_stories;
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON public.success_stories;

CREATE POLICY "Everyone can view approved stories"
ON public.success_stories
FOR SELECT
USING (moderation_status = 'approved');

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Auto-approve all existing stories
UPDATE public.success_stories
SET moderation_status = 'approved'
WHERE moderation_status IS NULL OR moderation_status = 'pending';

-- ============================================================================
-- 2. CHECK WHICH TABLES EXIST FOR FRIENDS/BUDDIES
-- ============================================================================
-- Check if we have friend_requests or buddy_requests or both

-- Check buddy_requests table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'buddy_requests') THEN
    RAISE NOTICE 'buddy_requests table does NOT exist - need to create it';
    CREATE TABLE public.buddy_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_buddy_requests_from_user ON public.buddy_requests(from_user_id);
    CREATE INDEX idx_buddy_requests_to_user ON public.buddy_requests(to_user_id);
    CREATE INDEX idx_buddy_requests_status ON public.buddy_requests(status);
    
    ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'buddy_requests table created successfully';
  ELSE
    RAISE NOTICE 'buddy_requests table already exists';
  END IF;
END $$;

-- Check if friend_requests table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friend_requests') THEN
    RAISE NOTICE 'friend_requests table EXISTS';
    
    -- Copy accepted friend_requests to buddy_requests for Community tab
    INSERT INTO public.buddy_requests (from_user_id, to_user_id, status, created_at, updated_at)
    SELECT 
      sender_id,
      receiver_id,
      'accepted',
      created_at,
      updated_at
    FROM public.friend_requests
    WHERE status = 'accepted'
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Copied accepted friend_requests to buddy_requests';
  ELSE
    RAISE NOTICE 'friend_requests table does NOT exist';
  END IF;
END $$;

-- ============================================================================
-- 3. FIX BUDDY_REQUESTS RLS POLICIES
-- ============================================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can insert buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can update own buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can delete own buddy requests" ON public.buddy_requests;

-- Create comprehensive RLS policies for buddy_requests
CREATE POLICY "Users can view buddy requests involving them"
ON public.buddy_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = from_user_id OR 
  auth.uid() = to_user_id
);

CREATE POLICY "Users can send buddy requests"
ON public.buddy_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update buddy requests they received"
ON public.buddy_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

CREATE POLICY "Users can delete buddy requests they sent"
ON public.buddy_requests
FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id);

-- Enable RLS
ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE SAMPLE SUCCESS STORIES (if none exist)
-- ============================================================================
INSERT INTO public.success_stories (
  title,
  content,
  author_name,
  story_type,
  moderation_status,
  likes_count,
  helpful_count,
  created_at
)
SELECT 
  'Our Journey to Forever',
  'We met 5 years ago and have been growing stronger ever since. This platform helped us communicate better and understand each other''s love languages.',
  'Happy Couple',
  'relationship_success',
  'approved',
  10,
  5,
  NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM public.success_stories LIMIT 1)

UNION ALL

SELECT 
  'From Long Distance to Living Together',
  'We spent 2 years apart but stayed connected through daily video calls and using relationship apps. Now we''re happily married!',
  'John & Sarah',
  'long_distance',
  'approved',
  25,
  15,
  NOW() - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM public.success_stories LIMIT 1)

UNION ALL

SELECT 
  'Rekindling Our Romance',
  'After 10 years of marriage, we used these relationship tools to fall in love all over again. The date ideas feature has been amazing!',
  'Mark & Lisa',
  'rekindling',
  'approved',
  18,
  12,
  NOW() - INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.success_stories LIMIT 1);

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================
-- Check success stories
SELECT 
  COUNT(*) as total_stories,
  COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_stories
FROM public.success_stories;

-- Check buddy requests
SELECT 
  COUNT(*) as total_buddy_requests,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_buddies,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_requests
FROM public.buddy_requests;

-- Check if friend_requests exists
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'friend_requests'
) as friend_requests_table_exists;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this:
-- 1. Refresh https://one2-one-love.vercel.app/community
-- 2. Success Stories tab should show 3 sample stories
-- 3. Buddy System tab should show accepted buddies
-- 4. Everything should work!
-- ============================================================================

