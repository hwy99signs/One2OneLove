-- ============================================================================
-- PROFILE COMPLETION TRACKING - BACKEND SETUP
-- ============================================================================
-- This script adds profile completion tracking to the users table
-- It automatically calculates and updates completion percentage when profile fields change
-- ============================================================================

-- Step 1: Add profile completion columns to users table
DO $$ 
BEGIN
  -- Add profile_completion_percentage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'profile_completion_percentage'
  ) THEN
    ALTER TABLE public.users ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0 
      CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);
    RAISE NOTICE 'Added profile_completion_percentage column';
  ELSE
    RAISE NOTICE 'profile_completion_percentage column already exists';
  END IF;

  -- Add profile_completed_fields column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'profile_completed_fields'
  ) THEN
    ALTER TABLE public.users ADD COLUMN profile_completed_fields INTEGER DEFAULT 0;
    RAISE NOTICE 'Added profile_completed_fields column';
  ELSE
    RAISE NOTICE 'profile_completed_fields column already exists';
  END IF;

  -- Add profile_total_fields column (for reference)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'profile_total_fields'
  ) THEN
    ALTER TABLE public.users ADD COLUMN profile_total_fields INTEGER DEFAULT 14;
    RAISE NOTICE 'Added profile_total_fields column';
  ELSE
    RAISE NOTICE 'profile_total_fields column already exists';
  END IF;
END $$;

-- Step 2: Ensure all required profile fields exist
-- Add missing fields if they don't exist
DO $$ 
BEGIN
  -- Add date_frequency if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'date_frequency'
  ) THEN
    ALTER TABLE public.users ADD COLUMN date_frequency TEXT;
  END IF;

  -- Add communication_style if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'communication_style'
  ) THEN
    ALTER TABLE public.users ADD COLUMN communication_style TEXT;
  END IF;

  -- Add conflict_resolution if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'conflict_resolution'
  ) THEN
    ALTER TABLE public.users ADD COLUMN conflict_resolution TEXT;
  END IF;

  -- Add partner_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'partner_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN partner_name TEXT;
  END IF;

  -- Add interests if missing (as JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'interests'
  ) THEN
    ALTER TABLE public.users ADD COLUMN interests JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Step 3: Create function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_record public.users)
RETURNS TABLE(completed_fields INTEGER, total_fields INTEGER, completion_percentage INTEGER) AS $$
DECLARE
  completed_count INTEGER := 0;
  total_count INTEGER := 14; -- Total number of profile fields
BEGIN
  -- Count completed fields (non-null and non-empty)
  -- Field 1: name (required, always present)
  IF user_record.name IS NOT NULL AND user_record.name != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 2: email (required, always present)
  IF user_record.email IS NOT NULL AND user_record.email != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 3: location
  IF user_record.location IS NOT NULL AND user_record.location != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 4: partner_email
  IF user_record.partner_email IS NOT NULL AND user_record.partner_email != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 5: anniversary_date
  IF user_record.anniversary_date IS NOT NULL THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 6: love_language
  IF user_record.love_language IS NOT NULL AND user_record.love_language != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 7: relationship_status
  IF user_record.relationship_status IS NOT NULL AND user_record.relationship_status != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 8: avatar_url
  IF user_record.avatar_url IS NOT NULL AND user_record.avatar_url != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 9: date_frequency
  IF user_record.date_frequency IS NOT NULL AND user_record.date_frequency != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 10: communication_style
  IF user_record.communication_style IS NOT NULL AND user_record.communication_style != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 11: conflict_resolution
  IF user_record.conflict_resolution IS NOT NULL AND user_record.conflict_resolution != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 12: interests (check if array has items)
  IF user_record.interests IS NOT NULL AND jsonb_array_length(user_record.interests) > 0 THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 13: bio
  IF user_record.bio IS NOT NULL AND user_record.bio != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Field 14: partner_name
  IF user_record.partner_name IS NOT NULL AND user_record.partner_name != '' THEN
    completed_count := completed_count + 1;
  END IF;

  -- Calculate percentage (rounded)
  RETURN QUERY SELECT 
    completed_count,
    total_count,
    ROUND((completed_count::DECIMAL / total_count::DECIMAL) * 100)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to update profile completion
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_data RECORD;
BEGIN
  -- Calculate completion for the updated user
  SELECT * INTO completion_data
  FROM calculate_profile_completion(NEW);

  -- Update the completion fields
  NEW.profile_completed_fields := completion_data.completed_fields;
  NEW.profile_total_fields := completion_data.total_fields;
  NEW.profile_completion_percentage := completion_data.completion_percentage;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically update completion on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.users;

CREATE TRIGGER trigger_update_profile_completion
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

-- Step 6: Update existing users with their current completion status
DO $$
DECLARE
  user_record RECORD;
  completion_data RECORD;
BEGIN
  FOR user_record IN SELECT * FROM public.users LOOP
    SELECT * INTO completion_data
    FROM calculate_profile_completion(user_record);

    UPDATE public.users
    SET 
      profile_completed_fields = completion_data.completed_fields,
      profile_total_fields = completion_data.total_fields,
      profile_completion_percentage = completion_data.completion_percentage
    WHERE id = user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Updated profile completion for all existing users';
END $$;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.users.profile_completion_percentage IS 'Percentage of profile completion (0-100), automatically calculated';
COMMENT ON COLUMN public.users.profile_completed_fields IS 'Number of completed profile fields, automatically calculated';
COMMENT ON COLUMN public.users.profile_total_fields IS 'Total number of profile fields (default: 14)';
COMMENT ON FUNCTION calculate_profile_completion IS 'Calculates profile completion based on filled fields';
COMMENT ON FUNCTION update_profile_completion IS 'Trigger function that updates profile completion when user profile changes';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the setup:
-- SELECT 
--   id, 
--   name, 
--   profile_completed_fields, 
--   profile_total_fields, 
--   profile_completion_percentage 
-- FROM public.users 
-- LIMIT 10;

