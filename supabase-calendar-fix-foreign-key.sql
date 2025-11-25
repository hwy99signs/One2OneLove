-- ============================================================================
-- FIX CALENDAR EVENTS FOREIGN KEY
-- ============================================================================
-- This script fixes the foreign key reference in calendar_events table
-- If the table references public.users, it will be changed to auth.users
-- ============================================================================

-- Check if foreign key exists and drop it
DO $$
BEGIN
  -- Drop the old foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'calendar_events_user_id_fkey'
    AND table_name = 'calendar_events'
  ) THEN
    ALTER TABLE public.calendar_events 
    DROP CONSTRAINT calendar_events_user_id_fkey;
    
    RAISE NOTICE 'Dropped old foreign key constraint';
  END IF;
END $$;

-- Add new foreign key constraint to auth.users
ALTER TABLE public.calendar_events
ADD CONSTRAINT calendar_events_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================================================
-- VERIFY THE FIX
-- ============================================================================
-- Run this query to verify the foreign key is correct:
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.table_name = 'calendar_events'
-- AND tc.constraint_type = 'FOREIGN KEY';
-- 
-- You should see: foreign_table_name = 'users' and it should be in 'auth' schema
-- ============================================================================

