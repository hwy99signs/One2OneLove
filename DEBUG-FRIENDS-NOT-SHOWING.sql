-- ============================================================================
-- DEBUG: Why aren't friends showing in Buddy System?
-- ============================================================================
-- This will help us understand what's happening with the friend_requests
-- ============================================================================

-- 1. Show ALL friend_requests data (no RLS, as admin)
SELECT 
    fr.id,
    fr.sender_id,
    fr.receiver_id,
    fr.status,
    fr.created_at,
    fr.updated_at,
    sender.name as sender_name,
    sender.email as sender_email,
    receiver.name as receiver_name,
    receiver.email as receiver_email
FROM public.friend_requests fr
LEFT JOIN public.users sender ON fr.sender_id = sender.id
LEFT JOIN public.users receiver ON fr.receiver_id = receiver.id
ORDER BY fr.created_at DESC;

-- 2. Check RLS policies on friend_requests
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    SUBSTRING(qual::text, 1, 100) as using_expression,
    SUBSTRING(with_check::text, 1, 100) as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'friend_requests'
ORDER BY policyname;

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'friend_requests';

-- 4. Test query as if you were a specific user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can find your user ID by running: SELECT id, email FROM auth.users LIMIT 5;

/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "YOUR_USER_ID_HERE"}';

SELECT 
    fr.id,
    fr.status,
    fr.sender_id,
    fr.receiver_id,
    sender.name as sender_name,
    receiver.name as receiver_name
FROM public.friend_requests fr
LEFT JOIN public.users sender ON fr.sender_id = sender.id
LEFT JOIN public.users receiver ON fr.receiver_id = receiver.id
WHERE fr.status = 'accepted'
AND (fr.sender_id = 'YOUR_USER_ID_HERE' OR fr.receiver_id = 'YOUR_USER_ID_HERE')
ORDER BY fr.created_at DESC;

RESET ROLE;
*/

-- 5. Count friends by user
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(CASE WHEN fr.status = 'accepted' THEN 1 END) as accepted_friends,
    COUNT(CASE WHEN fr.status = 'pending' THEN 1 END) as pending_requests,
    COUNT(*) as total_requests
FROM public.users u
LEFT JOIN public.friend_requests fr ON (
    fr.sender_id = u.id OR fr.receiver_id = u.id
)
GROUP BY u.id, u.name, u.email
ORDER BY accepted_friends DESC;

-- ============================================================================
-- POTENTIAL FIX: Ensure RLS policies are correct
-- ============================================================================
SELECT '✅ Check complete! Look at the results above to debug the issue.' as status;

