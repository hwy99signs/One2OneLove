-- Add missing profile fields to users table
-- Run this in your Supabase SQL Editor

-- Add location column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.users ADD COLUMN location TEXT;
  END IF;
END $$;

-- Add love_language column if it doesn't exist
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
  END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('location', 'love_language', 'avatar_url', 'partner_email', 'anniversary_date', 'relationship_status')
ORDER BY column_name;

