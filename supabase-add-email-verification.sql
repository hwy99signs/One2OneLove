-- ============================================================================
-- ADD EMAIL VERIFICATION TRACKING TO USERS TABLE
-- ============================================================================
-- This script adds email_verified column to track email verification status
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add email_verified column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    
    -- Set existing users' email_verified based on Supabase auth.users.email_confirmed_at
    UPDATE public.users u
    SET email_verified = TRUE
    FROM auth.users au
    WHERE u.id = au.id 
    AND au.email_confirmed_at IS NOT NULL;
    
    RAISE NOTICE 'Added email_verified column to users table';
  ELSE
    RAISE NOTICE 'email_verified column already exists';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Comment for documentation
COMMENT ON COLUMN public.users.email_verified IS 'Whether the user has verified their email address';

-- Display current status
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as verified_users,
  SUM(CASE WHEN NOT email_verified THEN 1 ELSE 0 END) as unverified_users
FROM public.users;

