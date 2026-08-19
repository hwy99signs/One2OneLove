-- O2OL community story submission hardening
-- Applied live to project hphhmjcutesqsdnubnnw on 2026-08-19.
-- Stories are submitted through an authenticated SECURITY DEFINER RPC and always
-- enter moderation as pending. Browser clients cannot directly INSERT or UPDATE
-- success_stories rows, preventing self-approval through direct table access.

create or replace function public.submit_community_story(
  p_title text,
  p_content text,
  p_story_type text default 'success',
  p_is_anonymous boolean default true,
  p_relationship_length text default null,
  p_tags text[] default '{}'::text[]
)
returns public.success_stories
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_author_name text;
  v_story public.success_stories;
  v_tags text[];
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_title, ''))) < 3 or length(trim(coalesce(p_title, ''))) > 160 then raise exception 'Story title must be between 3 and 160 characters'; end if;
  if length(trim(coalesce(p_content, ''))) < 20 or length(trim(coalesce(p_content, ''))) > 10000 then raise exception 'Story content must be between 20 and 10000 characters'; end if;
  if p_story_type not in ('success', 'challenge', 'advice', 'milestone', 'transformation') then raise exception 'Invalid story type'; end if;

  v_tags := coalesce(p_tags, '{}'::text[]);
  if cardinality(v_tags) > 10 then raise exception 'Too many tags'; end if;

  if not coalesce(p_is_anonymous, true) then
    select nullif(trim(u.name), '') into v_author_name from public.users u where u.id = v_user_id;
  end if;

  insert into public.success_stories (
    user_id, title, content, story_type, author_name, is_anonymous,
    relationship_length, tags, moderation_status
  ) values (
    v_user_id, trim(p_title), trim(p_content), p_story_type, v_author_name,
    coalesce(p_is_anonymous, true), nullif(trim(coalesce(p_relationship_length, '')), ''),
    v_tags, 'pending'
  ) returning * into v_story;

  return v_story;
end;
$$;

revoke all on function public.submit_community_story(text, text, text, boolean, text, text[]) from public;
revoke all on function public.submit_community_story(text, text, text, boolean, text, text[]) from anon;
grant execute on function public.submit_community_story(text, text, text, boolean, text, text[]) to authenticated;

revoke insert, update on table public.success_stories from anon;
revoke insert, update on table public.success_stories from authenticated;
