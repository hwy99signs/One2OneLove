-- ============================================================================
-- DEBUG: Why aren't Success Stories showing?
-- ============================================================================

-- 1. Check if success_stories table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'success_stories'
) as table_exists;

-- 2. Count total stories
SELECT 
    COUNT(*) as total_stories,
    COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as approved_stories,
    COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending_stories,
    COUNT(CASE WHEN moderation_status IS NULL THEN 1 END) as null_status_stories
FROM public.success_stories;

-- 3. Show sample stories with their status
SELECT 
    id,
    title,
    SUBSTRING(content, 1, 50) as content_preview,
    story_type,
    moderation_status,
    created_at,
    user_id,
    likes_count,
    views_count
FROM public.success_stories
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check RLS policies on success_stories
SELECT 
    policyname,
    cmd as operation,
    SUBSTRING(qual::text, 1, 100) as using_clause
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'success_stories'
ORDER BY policyname;

-- 5. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'success_stories';

-- 6. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'success_stories'
ORDER BY ordinal_position;

-- ============================================================================
-- DIAGNOSIS:
-- - If total_stories = 0, we need to add sample stories
-- - If approved_stories = 0, we need to approve existing stories
-- - If RLS policies are wrong, we need to fix them
-- ============================================================================

