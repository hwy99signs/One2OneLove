-- ============================================================================
-- FIX: Success Stories RLS - Allow All Users to View Approved Stories
-- ============================================================================
-- Run this in your Supabase SQL Editor to fix the visibility issue
-- This ensures ALL users on the platform can see ALL approved success stories
-- ============================================================================

-- Step 1: Drop all existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;

-- Step 2: Create a policy that allows ANYONE (authenticated or anonymous) 
-- to view approved stories
-- This policy has no auth.uid() check, so it works for everyone
CREATE POLICY "Anyone can view approved stories" ON public.success_stories
  FOR SELECT 
  TO public  -- 'public' role includes both authenticated and anonymous users
  USING (moderation_status = 'approved');

-- Step 3: Create a separate policy for users to view their own stories
-- (even if not approved yet)
CREATE POLICY "Users can view own stories" ON public.success_stories
  FOR SELECT 
  TO authenticated  -- Only for authenticated users
  USING (
    auth.uid() = user_id OR 
    moderation_status = 'approved'
  );

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, test with:
-- 1. As an authenticated user: Should see all approved stories + own stories
-- 2. As an anonymous user: Should see all approved stories
-- 
-- Run this query to verify:
-- SELECT id, title, user_id, moderation_status, author_name 
-- FROM public.success_stories 
-- WHERE moderation_status = 'approved';
-- 
-- This should return ALL approved stories regardless of who is querying
-- ============================================================================

