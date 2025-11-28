-- ============================================================================
-- CHECK: Which user should see buddies?
-- ============================================================================

-- 1. Show the accepted friend request (we know this exists)
SELECT 
    fr.id,
    fr.status,
    sender.id as sender_id,
    sender.name as sender_name,
    sender.email as sender_email,
    receiver.id as receiver_id,
    receiver.name as receiver_name,
    receiver.email as receiver_email
FROM public.friend_requests fr
JOIN public.users sender ON fr.sender_id = sender.id
JOIN public.users receiver ON fr.receiver_id = receiver.id
WHERE fr.status = 'accepted';

-- 2. Show ALL users (to see who you might be logged in as)
SELECT 
    id,
    name,
    email,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Check RLS policies on friend_requests table
SELECT 
    policyname,
    cmd as operation,
    qual as using_clause
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'friend_requests';

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- If you're logged in as Clara Joy (clarajoy4341@gmail.com), you should see Shilley
-- If you're logged in as Shilley (shilleybello@gmail.com), you should see Clara Joy
-- If you're logged in as someone else, you won't see any buddies
-- ============================================================================

