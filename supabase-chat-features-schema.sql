-- =====================================================
-- CHAT FEATURES - MESSAGE REACTIONS, STARS, FORWARDS
-- =====================================================
-- Add support for reactions, stars, and message forwarding
-- =====================================================

-- =====================================================
-- MESSAGE REACTIONS TABLE
-- =====================================================
-- Stores emoji reactions on messages
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji) -- One reaction type per user per message
);

-- =====================================================
-- STARRED MESSAGES TABLE
-- =====================================================
-- Stores user's starred messages
CREATE TABLE IF NOT EXISTS public.starred_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id) -- One star per user per message
);

-- =====================================================
-- PINNED MESSAGES TABLE
-- =====================================================
-- Stores pinned messages in conversations
CREATE TABLE IF NOT EXISTS public.pinned_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ, -- Optional expiry date for pin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, conversation_id) -- One pin per message per conversation
);

-- =====================================================
-- FORWARDED MESSAGES TABLE
-- =====================================================
-- Tracks message forwarding history
CREATE TABLE IF NOT EXISTS public.forwarded_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    new_message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    forwarded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    forwarded_to_conversation UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Message reactions indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);

-- Starred messages indexes
CREATE INDEX IF NOT EXISTS idx_starred_messages_message ON public.starred_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_starred_messages_user ON public.starred_messages(user_id);

-- Pinned messages indexes
CREATE INDEX IF NOT EXISTS idx_pinned_messages_message ON public.pinned_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation ON public.pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_expires ON public.pinned_messages(expires_at);

-- Forwarded messages indexes
CREATE INDEX IF NOT EXISTS idx_forwarded_messages_original ON public.forwarded_messages(original_message_id);
CREATE INDEX IF NOT EXISTS idx_forwarded_messages_new ON public.forwarded_messages(new_message_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forwarded_messages ENABLE ROW LEVEL SECURITY;

-- MESSAGE REACTIONS POLICIES

-- Users can view reactions on their messages
CREATE POLICY "Users can view message reactions"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_id
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
);

-- Users can add reactions
CREATE POLICY "Users can add reactions"
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- STARRED MESSAGES POLICIES

-- Users can view their own starred messages
CREATE POLICY "Users can view their starred messages"
ON public.starred_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can star messages
CREATE POLICY "Users can star messages"
ON public.starred_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can unstar messages
CREATE POLICY "Users can unstar messages"
ON public.starred_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- PINNED MESSAGES POLICIES

-- Users can view pinned messages in their conversations
CREATE POLICY "Users can view pinned messages"
ON public.pinned_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);

-- Users can pin messages in their conversations
CREATE POLICY "Users can pin messages"
ON public.pinned_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = pinned_by
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);

-- Users can unpin messages they pinned
CREATE POLICY "Users can unpin messages"
ON public.pinned_messages
FOR DELETE
TO authenticated
USING (auth.uid() = pinned_by);

-- FORWARDED MESSAGES POLICIES

-- Users can view forwarding history of messages they have access to
CREATE POLICY "Users can view forwarded messages"
ON public.forwarded_messages
FOR SELECT
TO authenticated
USING (
    auth.uid() = forwarded_by
    OR EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = new_message_id
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
);

-- Users can create forward records
CREATE POLICY "Users can create forward records"
ON public.forwarded_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = forwarded_by);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to clean up expired pinned messages
CREATE OR REPLACE FUNCTION cleanup_expired_pins()
RETURNS void AS $$
BEGIN
    DELETE FROM public.pinned_messages
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get reaction counts for a message
CREATE OR REPLACE FUNCTION get_message_reactions(p_message_id UUID)
RETURNS TABLE(emoji TEXT, count BIGINT, user_reacted BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.emoji,
        COUNT(*) as count,
        BOOL_OR(mr.user_id = auth.uid()) as user_reacted
    FROM public.message_reactions mr
    WHERE mr.message_id = p_message_id
    GROUP BY mr.emoji
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has starred a message
CREATE OR REPLACE FUNCTION is_message_starred(p_message_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.starred_messages
        WHERE message_id = p_message_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if message is pinned
CREATE OR REPLACE FUNCTION is_message_pinned(p_message_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.pinned_messages
        WHERE message_id = p_message_id 
        AND conversation_id = p_conversation_id
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.message_reactions TO authenticated;
GRANT ALL ON public.starred_messages TO authenticated;
GRANT ALL ON public.pinned_messages TO authenticated;
GRANT ALL ON public.forwarded_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_reactions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_message_starred(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_message_pinned(UUID, UUID) TO authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- Then use the chatFeaturesService.js to interact with these features
-- =====================================================

