-- ============================================================================
-- COMPREHENSIVE FIX: Allow Authenticated Users to See All Content
-- ============================================================================
-- This fixes RLS policies that are blocking legitimate access to data
-- ============================================================================

-- ============================================================================
-- STEP 1: COMPLETELY RESET USERS TABLE POLICIES
-- ============================================================================

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create simple, permissive SELECT policy for authenticated users
CREATE POLICY "authenticated_users_select_all" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "authenticated_users_insert_own" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "authenticated_users_update_own" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: COMPLETELY RESET SUCCESS STORIES POLICIES
-- ============================================================================

-- Drop ALL existing policies on success_stories table
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;
DROP POLICY IF EXISTS "Everyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.success_stories;
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON public.success_stories;
DROP POLICY IF EXISTS "All users can view approved stories" ON public.success_stories;

-- Create simple, permissive SELECT policy for approved stories
CREATE POLICY "authenticated_select_approved_stories" 
ON public.success_stories 
FOR SELECT 
TO authenticated 
USING (moderation_status = 'approved');

-- Allow users to view their own stories (any status)
CREATE POLICY "authenticated_select_own_stories" 
ON public.success_stories 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to insert their own stories
CREATE POLICY "authenticated_insert_own_stories" 
ON public.success_stories 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own stories
CREATE POLICY "authenticated_update_own_stories" 
ON public.success_stories 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: ENSURE PROPER GRANTS
-- ============================================================================

-- Grant full permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.success_stories TO authenticated;

-- Grant usage on sequences if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'success_stories_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE public.success_stories_id_seq TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: TEST DATA ACCESS (Run as authenticated user)
-- ============================================================================

-- This should now return ALL users
SELECT COUNT(*) as total_users FROM public.users;

-- This should return all approved stories
SELECT COUNT(*) as approved_stories 
FROM public.success_stories 
WHERE moderation_status = 'approved';

-- Show sample users (limited columns for privacy)
SELECT 
    id, 
    name, 
    relationship_status, 
    location,
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Show sample stories
SELECT 
    id, 
    title, 
    story_type, 
    moderation_status,
    likes_count,
    created_at
FROM public.success_stories 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================================================
-- STEP 5: VERIFY POLICIES ARE CORRECT
-- ============================================================================

-- Check users table policies
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY cmd, policyname;

-- Check success_stories policies
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'success_stories'
ORDER BY cmd, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ RLS policies reset! All authenticated users can now view all users and approved stories.' as status;

