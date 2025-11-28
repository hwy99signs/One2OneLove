-- ============================================================================
-- ADD SAMPLE DATA FOR TESTING
-- ============================================================================
-- This script adds sample users and success stories to test the features
-- ============================================================================

-- ============================================================================
-- 1. ADD SAMPLE USERS (for Find Buddies)
-- ============================================================================

-- Note: You need to replace 'YOUR_USER_ID_HERE' with your actual user ID
-- Get your user ID by running: SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Add sample user 1
INSERT INTO public.users (
    id,
    name,
    email,
    user_type,
    relationship_status,
    bio,
    location,
    interests,
    avatar_url,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Alex & Jordan',
    'alex.jordan@example.com',
    'regular',
    'married',
    'We love hiking and exploring nature together. Looking for couple friends who enjoy outdoor adventures!',
    'San Francisco, CA',
    ARRAY['hiking', 'travel', 'photography', 'cooking'],
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    NOW() - INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- Add sample user 2
INSERT INTO public.users (
    id,
    name,
    email,
    user_type,
    relationship_status,
    bio,
    location,
    interests,
    avatar_url,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Sam & Taylor',
    'sam.taylor@example.com',
    'regular',
    'engaged',
    'Recently engaged and planning our wedding! Love board games and movie nights.',
    'New York, NY',
    ARRAY['gaming', 'movies', 'food', 'music'],
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    NOW() - INTERVAL '20 days'
) ON CONFLICT (id) DO NOTHING;

-- Add sample user 3
INSERT INTO public.users (
    id,
    name,
    email,
    user_type,
    relationship_status,
    bio,
    location,
    interests,
    avatar_url,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'Morgan & Casey',
    'morgan.casey@example.com',
    'regular',
    'dating',
    'New to the area and looking to make couple friends. We enjoy concerts and trying new restaurants!',
    'Austin, TX',
    ARRAY['music', 'food', 'fitness', 'travel'],
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
    NOW() - INTERVAL '15 days'
) ON CONFLICT (id) DO NOTHING;

-- Add sample user 4
INSERT INTO public.users (
    id,
    name,
    email,
    user_type,
    relationship_status,
    bio,
    location,
    interests,
    avatar_url,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'Riley & Jamie',
    'riley.jamie@example.com',
    'regular',
    'married',
    'Married for 5 years and love staying active together. Always up for tennis or bike rides!',
    'Seattle, WA',
    ARRAY['fitness', 'sports', 'coffee', 'reading'],
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
    NOW() - INTERVAL '10 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ADD SAMPLE SUCCESS STORIES
-- ============================================================================

-- Story 1
INSERT INTO public.success_stories (
    user_id,
    title,
    content,
    story_type,
    moderation_status,
    likes_count,
    helpful_count,
    views_count,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'How We Met Through Mutual Friends',
    'We met at a mutual friend''s BBQ five years ago. I was nervous at first, but we hit it off immediately talking about our favorite hiking trails. Three months later, we went on our first official date to a local peak, and the rest is history! Now we''re happily married and still hiking together every weekend.',
    'how_we_met',
    'approved',
    15,
    8,
    120,
    NOW() - INTERVAL '25 days'
);

-- Story 2
INSERT INTO public.success_stories (
    user_id,
    title,
    content,
    story_type,
    moderation_status,
    likes_count,
    helpful_count,
    views_count,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'The Perfect Proposal at Sunset Beach',
    'After dating for two years, I knew Sam was the one. I planned a surprise proposal at our favorite beach during sunset. I had friends hide and play our song as I got down on one knee. The look on Sam''s face was priceless, and of course, they said YES! Planning our wedding now for next spring.',
    'proposal',
    'approved',
    32,
    12,
    245,
    NOW() - INTERVAL '18 days'
);

-- Story 3
INSERT INTO public.success_stories (
    user_id,
    title,
    content,
    story_type,
    moderation_status,
    likes_count,
    helpful_count,
    views_count,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'Our First Year Together - Lessons Learned',
    'The first year of our relationship taught us so much about communication and compromise. We learned to have weekly check-ins where we discuss our feelings openly. This simple practice has made our relationship stronger and helped us navigate challenges together. Highly recommend this to other couples!',
    'milestone',
    'approved',
    24,
    18,
    180,
    NOW() - INTERVAL '12 days'
);

-- Story 4
INSERT INTO public.success_stories (
    user_id,
    title,
    content,
    story_type,
    moderation_status,
    likes_count,
    helpful_count,
    views_count,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'Long Distance to Living Together',
    'We did long distance for 2 years while Riley finished grad school. It was tough, but we made it work through daily video calls and monthly visits. Now we''re finally living in the same city and it feels amazing! To anyone in long distance: hang in there, it''s worth it!',
    'milestone',
    'approved',
    28,
    15,
    195,
    NOW() - INTERVAL '8 days'
);

-- Story 5
INSERT INTO public.success_stories (
    user_id,
    title,
    content,
    story_type,
    moderation_status,
    likes_count,
    helpful_count,
    views_count,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Celebrating 5 Years of Marriage',
    'Just celebrated our 5th wedding anniversary! The secret to our happy marriage? Date nights every week, expressing gratitude daily, and never going to bed angry. We''ve had our ups and downs, but working through challenges together has only made us stronger. Here''s to many more years!',
    'anniversary',
    'approved',
    45,
    22,
    320,
    NOW() - INTERVAL '5 days'
);

-- ============================================================================
-- 3. VERIFY THE DATA WAS ADDED
-- ============================================================================

-- Count users
SELECT COUNT(*) as sample_users_added FROM public.users WHERE id::text LIKE '00000000-0000-0000-0000-%';

-- Count stories
SELECT COUNT(*) as sample_stories_added FROM public.success_stories;

-- Show sample users
SELECT id, name, location, relationship_status FROM public.users WHERE id::text LIKE '00000000-0000-0000-0000-%';

-- Show sample stories
SELECT id, title, story_type, likes_count FROM public.success_stories;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Sample data added! Refresh your app to see the users and stories.' as status;

