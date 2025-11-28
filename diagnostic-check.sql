-- ============================================================================
-- DIAGNOSTIC: Check Database Content and RLS Policies
-- ============================================================================
-- Run this script to diagnose why Success Stories and Find Buddies are empty
-- ============================================================================

-- ============================================================================
-- 1. CHECK IF THERE'S ANY DATA IN TABLES
-- ============================================================================

-- Count users in database
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE user_type = 'regular') as regular_users,
    COUNT(*) FILTER (WHERE user_type IS NULL) as null_type_users
FROM public.users;

-- Count success stories
SELECT 
    COUNT(*) as total_stories,
    COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_stories,
    COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_stories,
    COUNT(*) FILTER (WHERE moderation_status IS NULL) as null_status_stories
FROM public.success_stories;

-- ============================================================================
-- 2. SHOW SAMPLE DATA
-- ============================================================================

-- Show first 5 users (with limited info)
SELECT 
    id,
    name,
    email,
    user_type,
    relationship_status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- Show first 5 success stories
SELECT 
    id,
    title,
    story_type,
    moderation_status,
    user_id,
    created_at
FROM public.success_stories
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 3. CHECK RLS POLICIES
-- ============================================================================

-- Check users table policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY cmd, policyname;

-- Check success_stories policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'success_stories'
ORDER BY cmd, policyname;

-- ============================================================================
-- 4. CHECK IF RLS IS ENABLED
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('users', 'success_stories')
ORDER BY tablename;

-- ============================================================================
-- 5. CHECK TABLE PERMISSIONS
-- ============================================================================

SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
AND table_name IN ('users', 'success_stories')
AND grantee IN ('authenticated', 'anon', 'public')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Diagnostic check complete! Review the results above.' as status;

