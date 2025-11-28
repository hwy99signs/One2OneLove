-- ============================================================================
-- DEBUG: Check What Current User Can Actually See
-- ============================================================================
-- This runs queries AS the authenticated user to see what they can access
-- ============================================================================

-- Show current user info
SELECT 
    auth.uid() as my_user_id,
    auth.jwt() ->> 'email' as my_email,
    auth.role() as my_role;

-- Try to select from users table (what can I see?)
SELECT 
    'USERS TABLE ACCESS' as test,
    COUNT(*) as records_i_can_see,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ RLS is blocking access'
        ELSE '✅ RLS allows access'
    END as status
FROM public.users;

-- Try to select from success_stories (what can I see?)
SELECT 
    'SUCCESS STORIES ACCESS' as test,
    COUNT(*) as records_i_can_see,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ RLS is blocking access'
        ELSE '✅ RLS allows access'
    END as status
FROM public.success_stories
WHERE moderation_status = 'approved';

-- Show actual users (if any are visible)
SELECT 
    id,
    name,
    email,
    location,
    user_type,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Show actual stories (if any are visible)
SELECT 
    id,
    title,
    story_type,
    moderation_status,
    created_at
FROM public.success_stories
ORDER BY created_at DESC
LIMIT 10;

-- Check active policies on users table
SELECT 
    policyname,
    cmd,
    roles::text,
    SUBSTRING(qual::text, 1, 100) as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY cmd, policyname;

-- Check active policies on success_stories table
SELECT 
    policyname,
    cmd,
    roles::text,
    SUBSTRING(qual::text, 1, 100) as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'success_stories'
ORDER BY cmd, policyname;

