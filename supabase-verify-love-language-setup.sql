-- ============================================================================
-- VERIFY AND SET UP LOVE LANGUAGE COLUMN
-- ============================================================================
-- This script ensures the love_language column is properly configured
-- ============================================================================

-- Check if love_language column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'love_language'
  ) THEN
    ALTER TABLE public.users ADD COLUMN love_language TEXT 
      CHECK (love_language IN ('words_of_affirmation', 'quality_time', 'receiving_gifts', 'acts_of_service', 'physical_touch') OR love_language IS NULL);
    RAISE NOTICE 'Added love_language column';
  ELSE
    RAISE NOTICE 'love_language column already exists';
  END IF;
END $$;

-- Verify the setup
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name = 'love_language';

-- Check current love language values
SELECT 
  love_language,
  COUNT(*) as user_count
FROM public.users
GROUP BY love_language
ORDER BY user_count DESC;

