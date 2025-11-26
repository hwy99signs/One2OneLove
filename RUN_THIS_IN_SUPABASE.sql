-- =====================================================
-- FIX: Allow Receivers to Mark Messages as Read/Delivered
-- =====================================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Then click "Run"
-- =====================================================

-- Step 1: Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;

-- Step 2: Create new policy that allows BOTH senders AND receivers to update
CREATE POLICY "Users can update messages they sent or received"
ON public.messages
FOR UPDATE
TO authenticated
USING (
    -- Allow if user is the sender (for editing their own messages)
    auth.uid() = sender_id
    OR
    -- Allow if user is the receiver (for marking as read/delivered)
    auth.uid() = receiver_id
);

-- Step 3: Verify it worked (optional - you can run this to check)
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd
-- FROM pg_policies 
-- WHERE tablename = 'messages' 
-- AND policyname = 'Users can update messages they sent or received';

-- =====================================================
-- DONE! Now refresh your browser and test the chat
-- =====================================================

