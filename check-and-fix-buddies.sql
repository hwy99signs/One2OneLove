-- ============================================================================
-- CHECK AND FIX BUDDIES/FRIENDS DISPLAY
-- ============================================================================
-- This will show you what friend requests exist and help create test data
-- ============================================================================

-- 1. Check if friend_requests table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'friend_requests'
) as friend_requests_table_exists;

-- 2. Count friend requests by status
SELECT 
    status,
    COUNT(*) as count
FROM public.friend_requests
GROUP BY status;

-- 3. Show all friend requests with user details
SELECT 
    fr.id,
    fr.status,
    fr.created_at,
    sender.name as sender_name,
    sender.email as sender_email,
    receiver.name as receiver_name,
    receiver.email as receiver_email
FROM public.friend_requests fr
LEFT JOIN public.users sender ON fr.sender_id = sender.id
LEFT JOIN public.users receiver ON fr.receiver_id = receiver.id
ORDER BY fr.created_at DESC;

-- ============================================================================
-- OPTION 1: Accept all pending friend requests (for testing)
-- ============================================================================
-- Uncomment this to auto-accept all pending requests

/*
UPDATE public.friend_requests
SET 
    status = 'accepted',
    updated_at = NOW()
WHERE status = 'pending';

SELECT '✅ All pending friend requests accepted!' as status;
*/

-- ============================================================================
-- OPTION 2: Create test friend connections (if no requests exist)
-- ============================================================================
-- This creates accepted friendships between existing users
-- Uncomment to run:

/*
-- First, let's see what users we have
SELECT id, name, email FROM public.users LIMIT 10;

-- Create some test friend connections between first 4 users
-- Replace the UUIDs below with actual user IDs from your database
INSERT INTO public.friend_requests (sender_id, receiver_id, status, created_at, updated_at)
VALUES 
    -- Example: You need to replace these with real user IDs
    ((SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 0),
     (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 1),
     'accepted', NOW(), NOW()),
    
    ((SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 0),
     (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 2),
     'accepted', NOW(), NOW()),
     
    ((SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 1),
     (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 2),
     'accepted', NOW(), NOW())
ON CONFLICT (sender_id, receiver_id) DO NOTHING;

SELECT '✅ Test friend connections created!' as status;
*/

-- ============================================================================
-- VERIFY: Show accepted friends for each user
-- ============================================================================
SELECT 
    u.name as user_name,
    u.email as user_email,
    COUNT(fr.id) as friend_count
FROM public.users u
LEFT JOIN public.friend_requests fr ON (
    (fr.sender_id = u.id OR fr.receiver_id = u.id)
    AND fr.status = 'accepted'
)
GROUP BY u.id, u.name, u.email
ORDER BY friend_count DESC;

