-- =====================================================
-- AUTO-MARK MESSAGES AS DELIVERED
-- =====================================================
-- This trigger automatically marks messages as delivered
-- when they are inserted into the database
-- This ensures senders see double ticks immediately
-- =====================================================

-- Function to auto-mark messages as delivered when created
CREATE OR REPLACE FUNCTION auto_mark_message_delivered()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set delivered_at when message is created
    -- This means the message is "delivered" to the receiver's device/database
    NEW.delivered_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_mark_delivered ON public.messages;

-- Create trigger to auto-mark as delivered on INSERT
CREATE TRIGGER trigger_auto_mark_delivered
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION auto_mark_message_delivered();

-- =====================================================
-- VERIFY
-- =====================================================
-- After running this, all new messages will automatically
-- have delivered_at set when created
-- =====================================================

