-- Check your user type and profile data
-- Run this in Supabase SQL Editor

SELECT 
  id,
  email,
  name,
  user_type,
  location,
  bio,
  relationship_status,
  love_language,
  partner_email,
  anniversary_date
FROM public.users
WHERE email = 'jumatomosanya@icloud.com';

-- If user_type is NULL or anything other than 'regular', fix it:
UPDATE public.users
SET user_type = 'regular'
WHERE email = 'jumatomosanya@icloud.com' 
AND (user_type IS NULL OR user_type != 'regular');

-- Verify the fix:
SELECT 
  email,
  user_type,
  'Fixed! You can now update your profile' as status
FROM public.users
WHERE email = 'jumatomosanya@icloud.com';

