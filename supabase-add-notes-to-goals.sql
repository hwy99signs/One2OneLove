-- ============================================================================
-- ADD NOTES COLUMN TO RELATIONSHIP GOALS
-- ============================================================================
-- This migration adds a notes field to store progress update notes
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add notes column to relationship_goals table
ALTER TABLE public.relationship_goals 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN public.relationship_goals.notes IS 'Optional notes for progress updates';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify the column was added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'relationship_goals' 
--   AND column_name = 'notes';
-- ============================================================================

