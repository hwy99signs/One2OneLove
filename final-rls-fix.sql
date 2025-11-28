-- ============================================================================
-- FINAL FIX: Re-enable RLS and Ensure All Policies Are Correct
-- ============================================================================

-- ============================================================================
-- 1. RE-ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ENSURE SUCCESS_STORIES HAS CORRECT POLICIES
-- ============================================================================

-- Drop and recreate to ensure clean state
DROP POLICY IF EXISTS "authenticated_select_approved_stories" ON public.success_stories;
DROP POLICY IF EXISTS "authenticated_select_own_stories" ON public.success_stories;
DROP POLICY IF EXISTS "authenticated_insert_own_stories" ON public.success_stories;
DROP POLICY IF EXISTS "authenticated_update_own_stories" ON public.success_stories;

-- All authenticated users can see approved stories
CREATE POLICY "authenticated_select_approved_stories" 
ON public.success_stories 
FOR SELECT 
TO authenticated 
USING (moderation_status = 'approved');

-- Users can see their own stories (any status)
CREATE POLICY "authenticated_select_own_stories" 
ON public.success_stories 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can insert their own stories
CREATE POLICY "authenticated_insert_own_stories" 
ON public.success_stories 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "authenticated_update_own_stories" 
ON public.success_stories 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. ENSURE USERS TABLE HAS CORRECT POLICIES
-- ============================================================================

-- Drop and recreate to ensure clean state
DROP POLICY IF EXISTS "authenticated_users_select_all" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_insert_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON public.users;

-- All authenticated users can view all profiles
CREATE POLICY "authenticated_users_select_all" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

-- Users can insert their own profile
CREATE POLICY "authenticated_users_insert_own" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "authenticated_users_update_own" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 4. VERIFY EVERYTHING
-- ============================================================================

-- Check RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('users', 'success_stories', 'buddy_requests')
ORDER BY tablename;

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(DISTINCT cmd::text, ', ') as commands
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('users', 'success_stories', 'buddy_requests')
GROUP BY tablename
ORDER BY tablename;

-- Show data counts
SELECT 'users' as table_name, COUNT(*) as record_count FROM public.users
UNION ALL
SELECT 'success_stories', COUNT(*) FROM public.success_stories
UNION ALL
SELECT 'buddy_requests', COUNT(*) FROM public.buddy_requests;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ All RLS policies are now properly configured! Refresh your app.' as status;

