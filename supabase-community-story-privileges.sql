-- One2OneLove Community relationship-story browser privilege contract.
-- Public reading is constrained by success_stories RLS to approved stories; authenticated
-- members may also see their own pending stories under the existing RLS policy.
-- New story creation is intentionally RPC-only so moderation_status is forced pending.
-- Individual reaction rows are private to the member who created them; public
-- aggregate reaction counts are read from success_stories instead.

revoke all privileges on table public.success_stories from anon, authenticated;
grant select on table public.success_stories to anon;
grant select, delete on table public.success_stories to authenticated;

revoke all on function public.submit_community_story(text,text,text,boolean,text,text[]) from public, anon;
grant execute on function public.submit_community_story(text,text,text,boolean,text,text[]) to authenticated;

revoke all privileges on table public.story_likes from anon, authenticated;
revoke all privileges on table public.story_helpful from anon, authenticated;
grant select, insert, delete on table public.story_likes to authenticated;
grant select, insert, delete on table public.story_helpful to authenticated;

drop policy if exists "Anyone can view story likes" on public.story_likes;
drop policy if exists "Anyone can view story helpful" on public.story_helpful;

drop policy if exists story_likes_own_select on public.story_likes;
create policy story_likes_own_select on public.story_likes
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists story_helpful_own_select on public.story_helpful;
create policy story_helpful_own_select on public.story_helpful
for select to authenticated
using (auth.uid() = user_id);
