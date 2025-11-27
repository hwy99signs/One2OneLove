-- ============================================================================
-- FIX: Profile Update RLS Policy
-- ============================================================================
-- Run this in Supabase SQL Editor to allow users to update their profiles
-- ============================================================================

-- Check existing policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Drop old update policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

-- Create a comprehensive UPDATE policy for users
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'UPDATE';

-- ============================================================================
-- Test the update (replace with your actual user ID)
-- ============================================================================
-- This should work after running the policy above:
-- UPDATE public.users
-- SET location = 'Lagos', updated_at = NOW()
-- WHERE email = 'jumatomosanya@icloud.com';
-- ============================================================================

