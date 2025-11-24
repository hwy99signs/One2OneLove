-- =====================================================
-- VERIFY AND FIX BUDDY SYSTEM RLS POLICIES
-- =====================================================
-- Run this to check and fix RLS issues with buddy system
-- =====================================================

-- First, let's check what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('buddy_requests', 'users')
ORDER BY tablename, policyname;

-- =====================================================
-- FIX: Ensure buddy_requests policies are correct
-- =====================================================

-- Drop existing policies if they're wrong
DROP POLICY IF EXISTS "Users can view their buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can create buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can delete their sent requests" ON public.buddy_requests;

-- Re-create correct policies

-- 1. View policy - users can see requests where they are sender OR receiver
CREATE POLICY "Users can view their buddy requests"
ON public.buddy_requests
FOR SELECT
TO authenticated
USING (
    auth.uid() = from_user_id 
    OR auth.uid() = to_user_id
);

-- 2. Insert policy - users can send requests
CREATE POLICY "Users can create buddy requests"
ON public.buddy_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- 3. Update policy - users can update requests they received
CREATE POLICY "Users can update their received requests"
ON public.buddy_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- 4. Delete policy - users can delete requests they sent
CREATE POLICY "Users can delete their sent requests"
ON public.buddy_requests
FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id);

-- =====================================================
-- VERIFY: Check users table policies
-- =====================================================

-- Make sure users can view all other users' profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true); -- All authenticated users can view all profiles

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- Run these to test (replace 'YOUR-USER-ID' with actual user ID):

-- Test 1: Check if you can see buddy_requests table
-- SELECT * FROM public.buddy_requests WHERE from_user_id = 'YOUR-USER-ID' OR to_user_id = 'YOUR-USER-ID';

-- Test 2: Check if you can see users table  
-- SELECT id, name, email FROM public.users LIMIT 5;

-- Test 3: Check accepted buddies
-- SELECT * FROM public.buddy_requests WHERE status = 'accepted' AND (from_user_id = 'YOUR-USER-ID' OR to_user_id = 'YOUR-USER-ID');

-- =====================================================
-- DEBUG: Check if there are any buddy requests at all
-- =====================================================

SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
FROM public.buddy_requests;

-- Show all buddy requests (to check if any exist)
SELECT 
    id,
    from_user_id,
    to_user_id,
    status,
    created_at,
    updated_at
FROM public.buddy_requests
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

