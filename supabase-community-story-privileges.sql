-- One2OneLove Community relationship-story browser privilege contract.
-- Public reading is still constrained by RLS to approved stories; authenticated
-- members may also see their own pending stories under the existing RLS policy.
-- New story creation is intentionally RPC-only so moderation_status is forced pending.

revoke all privileges on table public.success_stories from anon, authenticated;
grant select on table public.success_stories to anon;
grant select, delete on table public.success_stories to authenticated;

revoke all on function public.submit_community_story(text,text,text,boolean,text,text[]) from public, anon;
grant execute on function public.submit_community_story(text,text,text,boolean,text,text[]) to authenticated;
