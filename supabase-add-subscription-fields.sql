-- ============================================
-- ADD SUBSCRIPTION FIELDS TO USERS TABLE
-- ============================================
-- This script adds subscription plan tracking to the users table
-- Run this in Supabase SQL Editor

-- Add subscription fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'Basis',
ADD COLUMN IF NOT EXISTS subscription_price DECIMAL(10,2) DEFAULT 9.99,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Add check constraint for subscription plan
ALTER TABLE public.users
ADD CONSTRAINT check_subscription_plan 
CHECK (subscription_plan IN ('Basis', 'Premiere', 'Exclusive'));

-- Add check constraint for subscription status
ALTER TABLE public.users
ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired', 'trial'));

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status 
ON public.users(subscription_status);

CREATE INDEX IF NOT EXISTS idx_users_subscription_plan 
ON public.users(subscription_plan);

-- Add comment to columns
COMMENT ON COLUMN public.users.subscription_plan IS 'User subscription tier: Basis, Premiere, or Exclusive';
COMMENT ON COLUMN public.users.subscription_price IS 'Monthly price of the subscription plan';
COMMENT ON COLUMN public.users.subscription_status IS 'Current status of subscription: active, inactive, cancelled, expired, or trial';
COMMENT ON COLUMN public.users.subscription_start_date IS 'Date when subscription started';
COMMENT ON COLUMN public.users.subscription_end_date IS 'Date when subscription ends/expired';

-- ============================================
-- VERIFY THE CHANGES
-- ============================================
-- Run this to verify the columns were added
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

-- ============================================
-- OPTIONAL: UPDATE EXISTING USERS
-- ============================================
-- If you have existing users without subscription data, update them
UPDATE public.users
SET 
  subscription_plan = 'Basis',
  subscription_price = 9.99,
  subscription_status = 'active',
  subscription_start_date = created_at
WHERE subscription_plan IS NULL;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Check subscription distribution
SELECT 
  subscription_plan,
  subscription_status,
  COUNT(*) as user_count,
  AVG(subscription_price) as avg_price
FROM public.users
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan;

-- ============================================
-- COMPLETED!
-- ============================================
-- Subscription fields have been added to the users table.
-- Users can now sign up with a selected plan!

