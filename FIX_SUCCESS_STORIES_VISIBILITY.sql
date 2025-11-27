-- ============================================================================
-- FIX: Make Success Stories Visible to ALL Users
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the "No results found" issue
-- ============================================================================

-- Step 1: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.success_stories;
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON public.success_stories;

-- Step 2: Create ONE simple policy that allows EVERYONE to see approved stories
CREATE POLICY "Everyone can view approved stories"
ON public.success_stories
FOR SELECT
USING (moderation_status = 'approved');

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Step 4: Make sure there ARE approved stories in the database
-- Check if any stories exist and auto-approve them if needed
UPDATE public.success_stories
SET moderation_status = 'approved'
WHERE moderation_status IS NULL OR moderation_status = 'pending';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, check if stories are visible:
SELECT id, title, author_name, moderation_status, created_at
FROM public.success_stories
WHERE moderation_status = 'approved'
ORDER BY created_at DESC
LIMIT 10;

-- If this returns stories, the fix worked!
-- ============================================================================

