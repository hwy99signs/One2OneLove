-- ============================================
-- FIX SUBSCRIPTION COLUMN FOR SIGNUP
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This will add the subscription_plan column and fix any existing data

-- Step 1: Add subscription_plan column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN subscription_plan TEXT DEFAULT 'Basic';
    
    RAISE NOTICE 'Added subscription_plan column to users table';
  ELSE
    RAISE NOTICE 'subscription_plan column already exists';
  END IF;
END $$;

-- Step 2: Fix any existing 'Basis' typos to 'Basic'
UPDATE public.users 
SET subscription_plan = 'Basic' 
WHERE subscription_plan = 'Basis' OR subscription_plan IS NULL;

-- Step 3: Add other subscription fields if they don't exist
DO $$ 
BEGIN
  -- Add subscription_price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'subscription_price'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN subscription_price DECIMAL(10,2) DEFAULT 0.00;
  END IF;

  -- Add subscription_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN subscription_status TEXT DEFAULT 'active';
  END IF;

  -- Add subscription_start_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'subscription_start_date'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN subscription_start_date TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add subscription_end_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN subscription_end_date TIMESTAMPTZ;
  END IF;
END $$;

-- Step 4: Update existing users to have Basic plan if they don't have one
UPDATE public.users 
SET 
  subscription_plan = 'Basic',
  subscription_price = 0.00,
  subscription_status = 'active',
  subscription_start_date = COALESCE(subscription_start_date, created_at, NOW())
WHERE subscription_plan IS NULL;

-- Step 5: Drop and recreate the check constraint to allow 'Basic' instead of 'Basis'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_subscription_plan'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT check_subscription_plan;
  END IF;

  -- Add new constraint with 'Basic' instead of 'Basis'
  ALTER TABLE public.users
  ADD CONSTRAINT check_subscription_plan 
  CHECK (subscription_plan IN ('Basic', 'Premiere', 'Exclusive'));
END $$;

-- Step 6: Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name LIKE 'subscription%'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Subscription columns have been added and fixed! Users can now sign up successfully.' as status;

