-- One2OneLove authenticated browser structural-privilege lockdown.
-- Normal application clients do not need TRUNCATE, TRIGGER, or REFERENCES.
-- Those privileges were legacy over-grants and are intentionally removed.

revoke truncate, trigger, references on table
  public.badges,
  public.buddy_matches,
  public.calendar_events,
  public.comment_likes,
  public.communities,
  public.community_members,
  public.community_posts,
  public.contest_participants,
  public.contest_winners,
  public.custom_date_ideas,
  public.forwarded_messages,
  public.friend_requests,
  public.gamification_points,
  public.goal_action_steps,
  public.memories,
  public.pinned_messages,
  public.post_comments,
  public.post_likes,
  public.post_shares,
  public.relationship_goals,
  public.relationship_milestones,
  public.scheduled_love_notes,
  public.sent_love_notes,
  public.shared_journals,
  public.starred_messages,
  public.subscription_changes,
  public.therapist_profiles,
  public.users
from authenticated;

-- These legacy security-invoker views are read surfaces only.
revoke all privileges on table public.goals_with_steps from authenticated;
revoke all privileges on table public.milestones_with_next_date from authenticated;
revoke all privileges on table public.user_presence_view from authenticated;
grant select on table public.goals_with_steps to authenticated;
grant select on table public.milestones_with_next_date to authenticated;
grant select on table public.user_presence_view to authenticated;
