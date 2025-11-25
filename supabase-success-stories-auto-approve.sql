-- ============================================================================
-- AUTO-APPROVE SUCCESS STORIES
-- ============================================================================
-- This updates the database to auto-approve all success stories
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Update the default value for moderation_status column
ALTER TABLE public.success_stories 
ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Step 2: Approve all existing pending stories (optional - uncomment if needed)
-- UPDATE public.success_stories 
-- SET moderation_status = 'approved'
-- WHERE moderation_status = 'pending';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this:
-- 1. All new stories will automatically have moderation_status = 'approved'
-- 2. Stories will be immediately visible to all users when posted
-- 3. No admin approval needed
-- ============================================================================

