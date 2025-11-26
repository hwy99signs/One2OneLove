-- =====================================================
-- FIX: Allow Receivers to Mark Messages as Read/Delivered
-- =====================================================
-- The current RLS policy only allows senders to update messages
-- But receivers need to update messages to mark them as read/delivered
-- This SQL adds a new policy to allow that
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;

-- Create a new policy that allows BOTH senders and receivers to update
-- Senders can update for editing, receivers can update for read/delivered status
CREATE POLICY "Users can update messages they sent or received"
ON public.messages
FOR UPDATE
TO authenticated
USING (
    -- Allow if user is the sender (for editing messages)
    auth.uid() = sender_id
    OR
    -- Allow if user is the receiver (for marking as read/delivered)
    auth.uid() = receiver_id
);

-- Verify the policy was created
-- Run this to check:
-- SELECT * FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update messages they sent or received';

