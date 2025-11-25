-- =====================================================
-- CHAT MESSAGE STATUS TRACKING
-- =====================================================
-- Add message status tracking (sent, delivered, read timestamps)
-- This enables WhatsApp-like message status tracking
-- =====================================================

-- Add delivered_at and read_at columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON public.messages(delivered_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);

-- =====================================================
-- FUNCTION: Mark message as delivered
-- =====================================================
CREATE OR REPLACE FUNCTION mark_message_delivered(p_message_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.messages
    SET delivered_at = COALESCE(delivered_at, NOW())
    WHERE id = p_message_id
    AND delivered_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Mark message as read
-- =====================================================
CREATE OR REPLACE FUNCTION mark_message_read(p_message_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.messages
    SET 
        read_at = COALESCE(read_at, NOW()),
        is_read = TRUE
    WHERE id = p_message_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Auto-mark message as delivered when inserted
-- =====================================================
-- Note: In real-time apps, delivery is typically tracked
-- when the message is received by the client, not on insert.
-- This trigger is optional and can be removed if you prefer
-- client-side delivery tracking.

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION mark_message_delivered(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_read(UUID) TO authenticated;

-- =====================================================
-- UPDATE EXISTING MESSAGES
-- =====================================================
-- Set delivered_at for all existing messages (assuming they were delivered)
UPDATE public.messages
SET delivered_at = created_at
WHERE delivered_at IS NULL;

-- Set read_at for messages that are already marked as read
UPDATE public.messages
SET read_at = updated_at
WHERE is_read = TRUE AND read_at IS NULL;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Message status tracking is now enabled
-- Use mark_message_delivered() and mark_message_read() functions
-- or update the columns directly in your service layer
-- =====================================================

