-- ============================================================================
-- CHECK SUCCESS STORIES DATA & POLICIES
-- ============================================================================
-- Run this to see what stories exist and what policies are active
-- ============================================================================

-- 1. Check if success_stories table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'success_stories'
) as table_exists;

-- 2. Count total stories
SELECT COUNT(*) as total_stories 
FROM public.success_stories;

-- 3. Count approved stories
SELECT COUNT(*) as approved_stories 
FROM public.success_stories 
WHERE moderation_status = 'approved';

-- 4. Show sample stories (first 5)
SELECT 
    id,
    title,
    SUBSTRING(content, 1, 50) as content_preview,
    story_type,
    moderation_status,
    created_at,
    user_id
FROM public.success_stories
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'success_stories';

-- 6. Show all active policies on success_stories
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
WHERE schemaname = 'public' 
AND tablename = 'success_stories'
ORDER BY policyname;

-- 7. Check table permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'success_stories';

-- ============================================================================
-- If you see issues above, uncomment and run the fix below:
-- ============================================================================

/*
-- Ensure all existing stories are approved
UPDATE public.success_stories
SET moderation_status = 'approved'
WHERE moderation_status IS NULL OR moderation_status != 'approved';

-- Show result
SELECT '✅ All stories are now approved!' as status;
*/

