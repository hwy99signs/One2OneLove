-- =====================================================
-- ADD MISSING MESSAGE STATUS COLUMNS
-- =====================================================
-- This migration adds read_at and delivered_at timestamp columns
-- to the messages table for proper message status tracking
-- =====================================================

-- Add delivered_at column to track when message was delivered
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add read_at column to track when message was read
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add index for faster queries on delivered_at
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at 
ON public.messages(delivered_at) 
WHERE delivered_at IS NOT NULL;

-- Add index for faster queries on read_at
CREATE INDEX IF NOT EXISTS idx_messages_read_at 
ON public.messages(read_at) 
WHERE read_at IS NOT NULL;

-- Add index for unread messages (where receiver hasn't read yet)
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages(conversation_id, receiver_id, is_read) 
WHERE is_read = false;

-- Update existing messages: if is_read is true but read_at is null, set read_at to updated_at
UPDATE public.messages 
SET read_at = updated_at 
WHERE is_read = true 
AND read_at IS NULL 
AND updated_at IS NOT NULL;

-- Update existing messages: if message exists but delivered_at is null, set delivered_at to created_at
-- (assuming old messages were delivered when created)
UPDATE public.messages 
SET delivered_at = created_at 
WHERE delivered_at IS NULL 
AND created_at IS NOT NULL;

-- Add comment to columns for documentation
COMMENT ON COLUMN public.messages.delivered_at IS 'Timestamp when message was delivered to receiver';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when message was read by receiver';

-- =====================================================
-- VERIFY COLUMNS WERE ADDED
-- =====================================================
-- Run this query to verify:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'messages' 
-- AND column_name IN ('delivered_at', 'read_at', 'is_read');

