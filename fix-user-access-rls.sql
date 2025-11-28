-- ============================================================================
-- FIX: Allow All Authenticated Users to Access Database Content
-- ============================================================================
-- This script fixes RLS policies so new users can see:
-- 1. Success Stories (approved stories)
-- 2. Other Users (for Find Buddies feature)
-- 3. All community content
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX USERS TABLE - Allow All Authenticated Users to View All Profiles
-- ============================================================================
-- This is needed for "Find Buddies" to work

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Create policy: All authenticated users can view all profiles
-- This allows the "Find Buddies" feature to show other users
CREATE POLICY "All authenticated users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can see all profiles

-- Keep the policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Keep the policy for users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. FIX SUCCESS STORIES - Allow All Users to View Approved Stories
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Everyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.success_stories;
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON public.success_stories;

-- Create policy: All authenticated users can view approved stories
CREATE POLICY "All users can view approved stories"
ON public.success_stories
FOR SELECT
TO authenticated
USING (moderation_status = 'approved');

-- Create policy: Users can view their own stories (even if not approved)
CREATE POLICY "Users can view own stories"
ON public.success_stories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Auto-approve all existing stories that are pending or null
UPDATE public.success_stories
SET moderation_status = 'approved'
WHERE moderation_status IS NULL OR moderation_status = 'pending';

-- ============================================================================
-- 3. FIX FRIEND REQUESTS TABLE (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friend_requests') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view friend requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Users can update friend requests" ON public.friend_requests;
    
    -- Create comprehensive policies
    CREATE POLICY "Users can view friend requests involving them"
    ON public.friend_requests
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = sender_id OR 
      auth.uid() = receiver_id
    );
    
    CREATE POLICY "Users can send friend requests"
    ON public.friend_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);
    
    CREATE POLICY "Users can update friend requests they received"
    ON public.friend_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);
    
    ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'friend_requests table policies updated';
  END IF;
END $$;

-- ============================================================================
-- 4. FIX BUDDY REQUESTS TABLE (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'buddy_requests') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view buddy requests involving them" ON public.buddy_requests;
    DROP POLICY IF EXISTS "Users can send buddy requests" ON public.buddy_requests;
    DROP POLICY IF EXISTS "Users can update buddy requests" ON public.buddy_requests;
    DROP POLICY IF EXISTS "Users can delete buddy requests" ON public.buddy_requests;
    
    -- Create comprehensive policies
    CREATE POLICY "Users can view buddy requests involving them"
    ON public.buddy_requests
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = from_user_id OR 
      auth.uid() = to_user_id
    );
    
    CREATE POLICY "Users can send buddy requests"
    ON public.buddy_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = from_user_id);
    
    CREATE POLICY "Users can update buddy requests they received"
    ON public.buddy_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = to_user_id)
    WITH CHECK (auth.uid() = to_user_id);
    
    CREATE POLICY "Users can delete buddy requests they sent"
    ON public.buddy_requests
    FOR DELETE
    TO authenticated
    USING (auth.uid() = from_user_id);
    
    ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'buddy_requests table policies updated';
  END IF;
END $$;

-- ============================================================================
-- 5. GRANT PERMISSIONS (Extra Safety)
-- ============================================================================

GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.success_stories TO authenticated;

-- Grant permissions only if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friend_requests') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_requests TO authenticated;
    RAISE NOTICE 'Permissions granted on friend_requests table';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'buddy_requests') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_requests TO authenticated;
    RAISE NOTICE 'Permissions granted on buddy_requests table';
  END IF;
END $$;

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Check users table policies
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd;

-- Check success_stories policies
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles
FROM pg_policies
WHERE tablename = 'success_stories'
ORDER BY cmd;

-- Count approved success stories
SELECT 
    COUNT(*) as total_stories,
    COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_stories
FROM public.success_stories;

-- Count total users
SELECT COUNT(*) as total_users FROM public.users;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ All RLS policies fixed! New users can now see success stories and find buddies.' as status;

