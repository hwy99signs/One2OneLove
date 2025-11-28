-- ============================================
-- FINAL FIX: Drop constraint, fix data, re-add constraint
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Drop the existing constraint (even if it has wrong values)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_subscription_plan;

-- Step 2: Fix ALL data FIRST (before adding constraint back)
-- This will update any 'Basis', NULL, or invalid values to 'Basic'
UPDATE public.users 
SET subscription_plan = 'Basic' 
WHERE subscription_plan IS NULL 
   OR subscription_plan = 'Basis'
   OR subscription_plan NOT IN ('Basic', 'Premiere', 'Exclusive');

-- Step 3: Ensure all users have Basic plan if still NULL
UPDATE public.users 
SET subscription_plan = 'Basic' 
WHERE subscription_plan IS NULL;

-- Step 4: Now add the constraint back with correct values
ALTER TABLE public.users 
ADD CONSTRAINT check_subscription_plan 
CHECK (subscription_plan IN ('Basic', 'Premiere', 'Exclusive'));

-- Step 5: Verify - this should show all users with 'Basic', 'Premiere', or 'Exclusive'
SELECT 
  subscription_plan,
  COUNT(*) as user_count
FROM public.users
GROUP BY subscription_plan
ORDER BY subscription_plan;

-- Success message
SELECT '✅ All fixed! Users can now sign up successfully.' as status;

