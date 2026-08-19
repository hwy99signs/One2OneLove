-- Remove anonymous table-level privileges from clearly private relationship/account datasets.
-- Authenticated access remains governed by each table's existing RLS policies.

revoke all privileges on table public.buddy_matches from anon;
revoke all privileges on table public.calendar_events from anon;
revoke all privileges on table public.friend_requests from anon;
revoke all privileges on table public.memories from anon;
revoke all privileges on table public.relationship_goals from anon;
revoke all privileges on table public.relationship_milestones from anon;
revoke all privileges on table public.scheduled_love_notes from anon;
revoke all privileges on table public.sent_love_notes from anon;
revoke all privileges on table public.shared_journals from anon;
revoke all privileges on table public.subscription_changes from anon;
