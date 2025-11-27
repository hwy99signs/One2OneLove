-- ============================================================================
-- FIX: Allow Users to Create Their Own Profile During Signup
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Check existing INSERT policies on users table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- Drop old INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to create profile during signup" ON public.users;

-- Create INSERT policy to allow users to create their own profile
CREATE POLICY "Users can create their own profile during signup"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- ============================================================================
-- IMPORTANT: After running this, try signing up again!
-- ============================================================================

