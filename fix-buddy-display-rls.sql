-- =====================================================
-- FIX BUDDY SYSTEM RLS POLICIES
-- =====================================================
-- This will fix the issue where accepted buddies don't show up
-- =====================================================

-- Enable RLS on buddy_requests if not already enabled
ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on buddy_requests
DROP POLICY IF EXISTS "Users can view their buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can view buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can create buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can insert buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can update buddy requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can delete their sent requests" ON public.buddy_requests;
DROP POLICY IF EXISTS "Users can delete buddy requests" ON public.buddy_requests;

-- Create CORRECT policies

-- 1. SELECT - Users can view requests where they are sender OR receiver
CREATE POLICY "Users can view their buddy requests"
ON public.buddy_requests
FOR SELECT
TO authenticated
USING (
    auth.uid() = from_user_id 
    OR auth.uid() = to_user_id
);

-- 2. INSERT - Users can send requests
CREATE POLICY "Users can create buddy requests"
ON public.buddy_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- 3. UPDATE - Users can update requests they received (to accept/reject)
CREATE POLICY "Users can update received requests"
ON public.buddy_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- 4. DELETE - Users can delete requests they sent
CREATE POLICY "Users can delete sent requests"
ON public.buddy_requests
FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id);

-- =====================================================
-- VERIFY USERS TABLE POLICIES
-- =====================================================

-- Ensure users can view all profiles (needed to show buddy names)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;

-- Create policy to allow all authenticated users to view all profiles
CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- TEST THE FIX
-- =====================================================

-- Test 1: Check if policies are now correct
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('buddy_requests', 'users')
ORDER BY tablename, cmd;

-- Test 2: Check accepted buddy requests (should return at least 1)
SELECT 
    id,
    from_user_id,
    to_user_id,
    status,
    created_at,
    updated_at
FROM public.buddy_requests
WHERE status = 'accepted'
ORDER BY updated_at DESC;

-- =====================================================
-- GRANT PERMISSIONS (just to be safe)
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_requests TO authenticated;
GRANT SELECT ON public.users TO authenticated;

-- =====================================================
-- DONE! Now refresh your Community page
-- =====================================================

