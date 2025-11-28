-- ============================================================================
-- CREATE MISSING TABLES: buddy_requests and friend_requests
-- ============================================================================
-- These tables are needed for the Find Buddies feature to work
-- ============================================================================

-- ============================================================================
-- 1. CREATE BUDDY_REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.buddy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate requests
    UNIQUE(from_user_id, to_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_buddy_requests_from_user ON public.buddy_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_to_user ON public.buddy_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_status ON public.buddy_requests(status);

-- ============================================================================
-- 2. CREATE FRIEND_REQUESTS TABLE (if needed for other features)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate requests
    UNIQUE(sender_id, receiver_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- ============================================================================
-- 3. CREATE RLS POLICIES FOR BUDDY_REQUESTS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

-- Users can view buddy requests involving them
CREATE POLICY "Users can view buddy requests involving them"
ON public.buddy_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = from_user_id OR 
  auth.uid() = to_user_id
);

-- Users can send buddy requests
CREATE POLICY "Users can send buddy requests"
ON public.buddy_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- Users can update buddy requests they received
CREATE POLICY "Users can update buddy requests they received"
ON public.buddy_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- Users can delete buddy requests they sent
CREATE POLICY "Users can delete buddy requests they sent"
ON public.buddy_requests
FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id);

-- ============================================================================
-- 4. CREATE RLS POLICIES FOR FRIEND_REQUESTS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can view friend requests involving them
CREATE POLICY "Users can view friend requests involving them"
ON public.friend_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friend_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Users can update friend requests they received
CREATE POLICY "Users can update friend requests they received"
ON public.friend_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Users can delete friend requests they sent
CREATE POLICY "Users can delete friend requests they sent"
ON public.friend_requests
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.buddy_requests TO authenticated;
GRANT ALL ON public.friend_requests TO authenticated;

-- ============================================================================
-- 6. RE-ENABLE RLS ON USERS AND SUCCESS_STORIES
-- ============================================================================

-- Re-enable RLS (in case it was disabled for testing)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that tables exist
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('buddy_requests', 'friend_requests', 'users', 'success_stories')
ORDER BY tablename;

-- Check policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('buddy_requests', 'friend_requests')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Missing tables created! Refresh your Find Buddies page now.' as status;

