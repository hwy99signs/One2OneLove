-- ============================================================================
-- ENABLE RLS AND FIX POLICIES ON EXISTING TABLES
-- ============================================================================

-- Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

-- Verify what we have
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('users', 'success_stories', 'buddy_requests')
ORDER BY tablename;

SELECT '✅ RLS is now enabled on all tables!' as status;

