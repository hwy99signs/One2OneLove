-- ============================================================================
-- CREATE FRIEND_REQUESTS TABLE 
-- ============================================================================
-- The app uses 'friend_requests' table, not 'buddy_requests'
-- This creates the missing table with proper structure
-- ============================================================================

-- Create the friend_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate requests
    CONSTRAINT unique_friend_request UNIQUE(sender_id, receiver_id),
    -- Prevent self-requests
    CONSTRAINT no_self_friend_requests CHECK (sender_id != receiver_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP OLD POLICIES IF THEY EXIST
-- ============================================================================

DROP POLICY IF EXISTS "Users can view friend requests involving them" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests they received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete friend requests they sent" ON public.friend_requests;
DROP POLICY IF EXISTS "allow_involved_select_requests" ON public.friend_requests;
DROP POLICY IF EXISTS "allow_own_insert_requests" ON public.friend_requests;
DROP POLICY IF EXISTS "allow_receiver_update_requests" ON public.friend_requests;
DROP POLICY IF EXISTS "allow_sender_delete_requests" ON public.friend_requests;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- SELECT: Users can view requests involving them (sender or receiver)
CREATE POLICY "allow_involved_select_requests"
ON public.friend_requests
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- INSERT: Users can send requests (must be the sender)
CREATE POLICY "allow_own_insert_requests"
ON public.friend_requests
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- UPDATE: Receivers can update requests (to accept/reject)
CREATE POLICY "allow_receiver_update_requests"
ON public.friend_requests
FOR UPDATE
USING (auth.uid() = receiver_id);

-- DELETE: Senders can delete their own pending requests
CREATE POLICY "allow_sender_delete_requests"
ON public.friend_requests
FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.friend_requests TO authenticated;
GRANT SELECT ON public.friend_requests TO anon;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ friend_requests table created successfully! Now refresh your browser.' as status;

