-- Remaining anonymous privilege hardening.
-- Private/member-only datasets: no anonymous table privileges.
revoke all privileges on table public.community_members from anon;
revoke all privileges on table public.community_posts from anon;
revoke all privileges on table public.custom_date_ideas from anon;
revoke all privileges on table public.forwarded_messages from anon;
revoke all privileges on table public.gamification_points from anon;
revoke all privileges on table public.goal_action_steps from anon;
revoke all privileges on table public.goals_with_steps from anon;
revoke all privileges on table public.milestones_with_next_date from anon;
revoke all privileges on table public.pinned_messages from anon;
revoke all privileges on table public.starred_messages from anon;
revoke all privileges on table public.therapist_profiles from anon;
revoke all privileges on table public.user_presence_view from anon;

-- Intentionally public-readable datasets: keep SELECT only.
revoke insert, update, delete, truncate, references, trigger on table public.badges from anon;
revoke insert, update, delete, truncate, references, trigger on table public.comment_likes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.communities from anon;
revoke insert, update, delete, truncate, references, trigger on table public.contest_participants from anon;
revoke insert, update, delete, truncate, references, trigger on table public.contest_winners from anon;
revoke insert, update, delete, truncate, references, trigger on table public.post_comments from anon;
revoke insert, update, delete, truncate, references, trigger on table public.post_likes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.post_shares from anon;
revoke insert, update, delete, truncate, references, trigger on table public.story_helpful from anon;
revoke insert, update, delete, truncate, references, trigger on table public.story_likes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.success_stories from anon;

-- Anonymous waitlist access is intentionally write-only.
revoke all privileges on table public.waitlist from anon;
grant insert on table public.waitlist to anon;
