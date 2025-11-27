-- ============================================================================
-- SIMPLE FIX: Make Success Stories Visible to Everyone
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.success_stories;
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON public.success_stories;
DROP POLICY IF EXISTS "Everyone can view approved stories" ON public.success_stories;

-- Create ONE simple policy
CREATE POLICY "Everyone can view approved stories"
ON public.success_stories
FOR SELECT
USING (moderation_status = 'approved');

-- Enable RLS
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Auto-approve all stories
UPDATE public.success_stories
SET moderation_status = 'approved'
WHERE moderation_status IS NULL OR moderation_status != 'approved';

-- Verify
SELECT COUNT(*) as approved_stories FROM public.success_stories WHERE moderation_status = 'approved';

