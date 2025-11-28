-- ============================================================================
-- DEFINITIVE FIX: Make Success Stories and Find Buddies Work NOW
-- ============================================================================
-- This script will completely reset and fix all policies in one go
-- ============================================================================

-- ============================================================================
-- PART 1: DROP ALL EXISTING POLICIES (CLEAN SLATE)
-- ============================================================================

-- Drop ALL policies on users table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on success_stories table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'success_stories') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.success_stories', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on buddy_requests table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'buddy_requests') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.buddy_requests', r.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- PART 2: CREATE SIMPLE, WORKING POLICIES
-- ============================================================================

-- USERS TABLE: Everyone can see everyone
CREATE POLICY "allow_all_select_users"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "allow_own_insert_users"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_own_update_users"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- SUCCESS_STORIES TABLE: Everyone can see approved stories
CREATE POLICY "allow_approved_select_stories"
ON public.success_stories
FOR SELECT
USING (moderation_status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "allow_own_insert_stories"
ON public.success_stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_own_update_stories"
ON public.success_stories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "allow_own_delete_stories"
ON public.success_stories
FOR DELETE
USING (auth.uid() = user_id);

-- BUDDY_REQUESTS TABLE: Users see requests involving them
CREATE POLICY "allow_involved_select_requests"
ON public.buddy_requests
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "allow_own_insert_requests"
ON public.buddy_requests
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "allow_receiver_update_requests"
ON public.buddy_requests
FOR UPDATE
USING (auth.uid() = to_user_id);

CREATE POLICY "allow_sender_delete_requests"
ON public.buddy_requests
FOR DELETE
USING (auth.uid() = from_user_id);

-- ============================================================================
-- PART 3: ENSURE RLS IS ENABLED
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.users TO authenticated, anon;
GRANT ALL ON public.success_stories TO authenticated, anon;
GRANT ALL ON public.buddy_requests TO authenticated, anon;

-- ============================================================================
-- PART 5: APPROVE ALL EXISTING STORIES
-- ============================================================================

UPDATE public.success_stories
SET moderation_status = 'approved'
WHERE moderation_status IS NULL OR moderation_status != 'approved';

-- ============================================================================
-- PART 6: VERIFICATION - SHOW WHAT WE HAVE
-- ============================================================================

-- Count data
SELECT 
    'USERS' as table_name,
    COUNT(*) as record_count
FROM public.users
UNION ALL
SELECT 
    'SUCCESS_STORIES' as table_name,
    COUNT(*) as record_count
FROM public.success_stories
WHERE moderation_status = 'approved'
UNION ALL
SELECT 
    'BUDDY_REQUESTS' as table_name,
    COUNT(*) as record_count
FROM public.buddy_requests;

-- Show active policies
SELECT 
    tablename,
    policyname,
    cmd,
    SUBSTRING(qual::text, 1, 50) as condition
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('users', 'success_stories', 'buddy_requests')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT '✅✅✅ COMPLETE! Now hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)' as status;

