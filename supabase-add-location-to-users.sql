-- ============================================================================
-- ADD LOCATION AND OTHER FIELDS TO USERS TABLE
-- ============================================================================
-- Run this in your Supabase SQL Editor to add location and other fields
-- ============================================================================

-- Add location field if it doesn't exist
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

-- Add interests field if it doesn't exist (stored as JSON array)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'interests'
  ) THEN
    ALTER TABLE public.users ADD COLUMN interests JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add partner_email if it doesn't exist (for couples)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'partner_email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN partner_email TEXT;
  END IF;
END $$;

-- Create index for location searches
CREATE INDEX IF NOT EXISTS users_location_idx ON public.users USING gin (to_tsvector('english', location));

-- ============================================================================
-- DONE! Location and other fields added to users table
-- ============================================================================

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('location', 'interests', 'partner_email')
ORDER BY column_name;

