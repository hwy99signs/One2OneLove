-- ============================================================================
-- ADD SAMPLE SUCCESS STORIES (if table is empty)
-- ============================================================================

-- First, check if we have any stories
DO $$
DECLARE
    story_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO story_count FROM public.success_stories;
    
    IF story_count = 0 THEN
        RAISE NOTICE 'No stories found. Adding sample stories...';
        
        -- Insert sample success stories
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
        ) VALUES
        (
            (SELECT id FROM public.users ORDER BY created_at LIMIT 1),
            'How We Survived Long Distance',
            'My partner and I were in a long-distance relationship for 3 years. It wasn''t easy, but we made it work through daily video calls, surprise visits, and unwavering trust. Today, we''re happily married and living together! The key was constant communication and setting clear expectations. We also had a countdown calendar that helped us visualize when we''d be together again. If you''re in a long-distance relationship, don''t give up! It''s worth it when you find the right person.',
            'long_distance',
            'approved',
            15,
            8,
            142,
            NOW() - INTERVAL '2 weeks'
        ),
        (
            (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 1),
            'Our Journey from Dating to Marriage',
            'We met on a dating app 5 years ago. Neither of us was looking for anything serious, but we clicked instantly. After 2 years of dating, I proposed at the beach where we had our first date. Now we''ve been married for 2 years and couldn''t be happier! The secret to our success? We never stopped dating each other, even after marriage. We make time for weekly date nights and always prioritize our relationship.',
            'marriage',
            'approved',
            32,
            18,
            256,
            NOW() - INTERVAL '1 week'
        ),
        (
            (SELECT id FROM public.users ORDER BY created_at LIMIT 1),
            'Finding Love After 40',
            'I thought I''d missed my chance at love. At 42, after a divorce, I wasn''t sure I''d find someone special again. But then I met my current partner at a community event. We took things slow, got to know each other deeply, and now we''re engaged! Age is just a number when you find the right person. Don''t give up hope - love can find you at any age!',
            'dating',
            'approved',
            28,
            22,
            189,
            NOW() - INTERVAL '3 days'
        ),
        (
            (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 1),
            'How We Resolved Our Communication Issues',
            'My partner and I were on the verge of breaking up due to constant misunderstandings. We decided to try couples therapy, and it saved our relationship. We learned active listening techniques and how to express our needs without blaming each other. Now we''re stronger than ever! If you''re struggling with communication, don''t hesitate to seek help. It''s not a sign of weakness - it''s a sign of commitment to your relationship.',
            'conflict_resolution',
            'approved',
            41,
            35,
            312,
            NOW() - INTERVAL '5 days'
        ),
        (
            (SELECT id FROM public.users ORDER BY created_at LIMIT 1),
            'Reigniting the Spark After Kids',
            'After having two kids, my spouse and I felt more like roommates than partners. We were exhausted, overwhelmed, and had zero time for each other. We made a conscious decision to prioritize our relationship. We started having regular date nights (even if it was just after the kids went to bed), we communicated more openly about our needs, and we made small romantic gestures. Slowly, the spark came back! It takes effort, but it''s so worth it.',
            'parenting',
            'approved',
            37,
            29,
            278,
            NOW() - INTERVAL '10 days'
        );
        
        RAISE NOTICE '✅ Sample stories added successfully!';
    ELSE
        RAISE NOTICE '✅ Stories already exist (% stories found). No need to add samples.', story_count;
    END IF;
END $$;

-- Show all stories
SELECT 
    id,
    title,
    story_type,
    moderation_status,
    likes_count,
    views_count,
    created_at
FROM public.success_stories
ORDER BY created_at DESC;

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT '✅ Success! Check the stories above. Refresh your app to see them!' as status;

