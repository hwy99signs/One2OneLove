-- ============================================================================
-- SIMPLE DEBUG: Show all friend requests with user names
-- ============================================================================

-- 1. Show all friend_requests in the database
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

