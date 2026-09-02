-- One2OneLove relaunch: browser-facing privacy hardening identified by the
-- final Supabase advisor pass. This migration is intentionally staged in the
-- relaunch branch and must not be applied to the live project without the
-- explicit production-change approval gate.

begin;

-- Legacy contest surfaces are fenced from the relaunch and contain direct
-- account identifiers (including email). Browser roles do not need raw table
-- access while those routes remain retired.
revoke all on table public.contest_participants from anon, authenticated;
revoke all on table public.contest_winners from anon, authenticated;

drop policy if exists "Anyone can view contest participants" on public.contest_participants;
drop policy if exists "Anyone can view participants" on public.contest_participants;
drop policy if exists "Anyone can view contest winners" on public.contest_winners;
drop policy if exists "Anyone can view winners" on public.contest_winners;

-- Anonymous visitors do not need the legacy forum/community base tables in the
-- relaunch. Signed-in member access remains governed by the existing RLS
-- membership and community-participation policies.
revoke select on table public.communities from anon;
revoke select on table public.post_comments from anon;
revoke select on table public.post_shares from anon;

-- A like is useful as a count/interaction state, but a raw list of member UUIDs
-- is not public data. Keep browser reads scoped to the caller's own reactions.
revoke select on table public.comment_likes from anon;
revoke select on table public.post_likes from anon;

drop policy if exists "Anyone can view comment likes" on public.comment_likes;
drop policy if exists "comment_likes_own_select" on public.comment_likes;
create policy "comment_likes_own_select"
on public.comment_likes
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can view post likes" on public.post_likes;
drop policy if exists "post_likes_own_select" on public.post_likes;
create policy "post_likes_own_select"
on public.post_likes
for select
to authenticated
using ((select auth.uid()) = user_id);

-- The retired Success Stories implementation exposes moderation/internal
-- columns on its base table. Until a deliberately minimized public projection
-- is designed, anonymous reads are removed and signed-in members may read only
-- their own raw story rows. The current relaunch does not route the legacy
-- Success Stories page.
revoke select on table public.success_stories from anon;

drop policy if exists "allow_approved_select_stories" on public.success_stories;
drop policy if exists "Approved stories are viewable by everyone" on public.success_stories;
drop policy if exists "success_stories_own_select" on public.success_stories;
create policy "success_stories_own_select"
on public.success_stories
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Advisor-requested FK indexes. These do not change application behavior; they
-- prevent avoidable scans on relationship/support/privacy tables.
create index if not exists contact_messages_user_id_idx
  on public.contact_messages (user_id);
create index if not exists love_note_saves_invitation_id_idx
  on public.love_note_saves (invitation_id);
create index if not exists room_message_reactions_user_id_idx
  on public.room_message_reactions (user_id);
create index if not exists room_message_reports_reporter_id_idx
  on public.room_message_reports (reporter_id);
create index if not exists room_messages_user_id_idx
  on public.room_messages (user_id);

-- Remove only exact duplicate non-unique indexes. Keep the canonical indexes
-- and all unique/partial uniqueness constraints intact.
drop index if exists public.idx_buddy_requests_from_user;
drop index if exists public.idx_buddy_requests_to_user;
drop index if exists public.idx_buddy_requests_status;

commit;
