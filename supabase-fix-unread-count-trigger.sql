-- =====================================================
-- FIX UNREAD COUNT TRIGGER
-- =====================================================
-- The current trigger increments unread_count on EVERY message insert
-- This causes the count to keep increasing even when chat is open
-- We need to make the trigger smarter or recalculate based on actual unread messages
-- =====================================================

-- Option 1: Update the trigger to only increment if message is not already read
-- But this won't work because messages are inserted as unread by default

-- Option 2: Create a function to RECALCULATE unread count based on actual unread messages
-- This is more reliable than just incrementing

CREATE OR REPLACE FUNCTION recalculate_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_unread_count INTEGER;
    v_is_user1 BOOLEAN;
BEGIN
    -- Get conversation to determine if user is user1 or user2
    SELECT user1_id = p_user_id INTO v_is_user1
    FROM public.conversations
    WHERE id = p_conversation_id;
    
    -- Count actual unread messages for this user
    SELECT COUNT(*) INTO v_unread_count
    FROM public.messages
    WHERE conversation_id = p_conversation_id
      AND receiver_id = p_user_id
      AND (is_read = false OR read_at IS NULL);
    
    -- Update the appropriate unread count field
    IF v_is_user1 THEN
        UPDATE public.conversations
        SET user1_unread_count = v_unread_count
        WHERE id = p_conversation_id;
    ELSE
        UPDATE public.conversations
        SET user2_unread_count = v_unread_count
        WHERE id = p_conversation_id;
    END IF;
    
    RETURN v_unread_count;
END;
$$ LANGUAGE plpgsql;

-- Option 3: Modify the trigger to be smarter
-- Instead of always incrementing, we'll recalculate after insert
-- But this might be slow for high-volume chats

-- Let's create a better trigger that recalculates instead of just incrementing
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_is_user1 BOOLEAN;
    v_unread_count INTEGER;
BEGIN
    -- Determine if receiver is user1 or user2
    SELECT user1_id = NEW.receiver_id INTO v_is_user1
    FROM public.conversations
    WHERE id = NEW.conversation_id;
    
    -- Count actual unread messages for the receiver
    SELECT COUNT(*) INTO v_unread_count
    FROM public.messages
    WHERE conversation_id = NEW.conversation_id
      AND receiver_id = NEW.receiver_id
      AND (is_read = false OR read_at IS NULL);
    
    -- Update conversation with last message and recalculated unread count
    UPDATE public.conversations
    SET 
        last_message = NEW.content,
        last_message_time = NEW.created_at,
        updated_at = NOW(),
        user1_unread_count = CASE 
            WHEN user1_id = NEW.receiver_id THEN v_unread_count
            ELSE user1_unread_count
        END,
        user2_unread_count = CASE 
            WHEN user2_id = NEW.receiver_id THEN v_unread_count
            ELSE user2_unread_count
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger is already created, so this will update the function
-- No need to recreate the trigger

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, the trigger will:
-- 1. Recalculate unread count based on actual unread messages
-- 2. Only count messages where is_read = false OR read_at IS NULL
-- 3. This ensures the count is always accurate
-- =====================================================

