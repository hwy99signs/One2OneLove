-- ============================================================================
-- QUICK FIX: Accept All Pending Friend Requests
-- ============================================================================
-- This will immediately accept all pending friend requests
-- so they show up in the Buddy System tab
-- ============================================================================

-- Accept all pending requests
UPDATE public.friend_requests
SET 
    status = 'accepted',
    updated_at = NOW()
WHERE status = 'pending';

-- Show results
SELECT 
    'Updated ' || COUNT(*) || ' friend requests to accepted!' as message
FROM public.friend_requests
WHERE status = 'accepted';

-- Show all accepted friendships
SELECT 
    fr.id,
    sender.name as sender_name,
    sender.email as sender_email,
    receiver.name as receiver_name,
    receiver.email as receiver_email,
    fr.updated_at as became_friends_at
FROM public.friend_requests fr
JOIN public.users sender ON fr.sender_id = sender.id
JOIN public.users receiver ON fr.receiver_id = receiver.id
WHERE fr.status = 'accepted'
ORDER BY fr.updated_at DESC;

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT '✅ Friend requests accepted! Refresh your browser to see buddies!' as status;

