-- One2OneLove relaunch: legacy Community content hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- The separate Live Community rooms use room_messages. This migration protects the
-- older user-created Community/forum feature so a browser cannot forge author identity,
-- pin/approve its own posts, rewrite counters/routing, or manipulate community counts.

begin;

-- ---------------------------------------------------------------------------
-- Community identity/settings boundaries
-- ---------------------------------------------------------------------------

alter table public.communities
  drop constraint if exists communities_name_length,
  drop constraint if exists communities_description_length;

alter table public.communities
  add constraint communities_name_length check (char_length(btrim(name)) between 1 and 100),
  add constraint communities_description_length check (description is null or char_length(description) <= 1500);

create or replace function public.enforce_community_content_boundaries()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_role text := auth.role();
  v_name text;
begin
  if v_role is null or v_role = 'service_role' then
    return new;
  end if;

  if v_role <> 'authenticated' or auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if tg_table_name = 'communities' then
    if tg_op = 'INSERT' then
      new.creator_id := auth.uid();
      new.member_count := 0;
      new.post_count := 0;
      return new;
    end if;

    if auth.uid() <> old.creator_id then
      raise exception 'Only the community creator may edit community settings';
    end if;

    if (
      to_jsonb(new) - array['name','description','icon','category','is_public','requires_approval','allow_member_posts','updated_at']
    ) is distinct from (
      to_jsonb(old) - array['name','description','icon','category','is_public','requires_approval','allow_member_posts','updated_at']
    ) then
      raise exception 'Protected community identity/count fields cannot be changed from the browser';
    end if;

    return new;
  end if;

  -- Public author display name is derived from the authenticated own profile. Never
  -- trust browser-supplied author_name or derive it from account email.
  select nullif(btrim(u.name), '') into v_name
  from public.users u
  where u.id = auth.uid()
  limit 1;

  if v_name is null then v_name := 'Member'; end if;

  if tg_table_name = 'community_posts' then
    if tg_op = 'INSERT' then
      new.author_id := auth.uid();
      new.author_name := case when coalesce(new.is_anonymous, false) then null else left(v_name, 120) end;
      new.is_pinned := false;
      new.is_locked := false;
      new.moderation_status := 'approved';
      new.likes_count := 0;
      new.comments_count := 0;
      new.shares_count := 0;
      new.views_count := 0;
      return new;
    end if;

    if auth.uid() <> old.author_id then
      raise exception 'Members may edit only their own posts';
    end if;

    if (
      to_jsonb(new) - array['title','content','tags','is_anonymous','author_name','updated_at']
    ) is distinct from (
      to_jsonb(old) - array['title','content','tags','is_anonymous','author_name','updated_at']
    ) then
      raise exception 'Protected post routing/moderation/count fields cannot be changed by the author';
    end if;

    new.author_name := case when coalesce(new.is_anonymous, false) then null else left(v_name, 120) end;
    return new;
  end if;

  if tg_table_name = 'post_comments' then
    if tg_op = 'INSERT' then
      new.author_id := auth.uid();
      new.author_name := case when coalesce(new.is_anonymous, false) then null else left(v_name, 120) end;
      new.moderation_status := 'approved';
      new.likes_count := 0;
      return new;
    end if;

    if auth.uid() <> old.author_id then
      raise exception 'Members may edit only their own comments';
    end if;

    if (
      to_jsonb(new) - array['content','is_anonymous','author_name','updated_at']
    ) is distinct from (
      to_jsonb(old) - array['content','is_anonymous','author_name','updated_at']
    ) then
      raise exception 'Protected comment routing/moderation/count fields cannot be changed by the author';
    end if;

    new.author_name := case when coalesce(new.is_anonymous, false) then null else left(v_name, 120) end;
    return new;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_community_content_boundaries() from public;

drop trigger if exists aaa_enforce_community_boundaries on public.communities;
create trigger aaa_enforce_community_boundaries
before insert or update on public.communities
for each row execute function public.enforce_community_content_boundaries();

drop trigger if exists aaa_enforce_community_post_boundaries on public.community_posts;
create trigger aaa_enforce_community_post_boundaries
before insert or update on public.community_posts
for each row execute function public.enforce_community_content_boundaries();

drop trigger if exists aaa_enforce_community_comment_boundaries on public.post_comments;
create trigger aaa_enforce_community_comment_boundaries
before insert or update on public.post_comments
for each row execute function public.enforce_community_content_boundaries();

-- ---------------------------------------------------------------------------
-- Content-size constraints and posting permission
-- ---------------------------------------------------------------------------

alter table public.community_posts
  drop constraint if exists community_posts_title_length,
  drop constraint if exists community_posts_content_length,
  drop constraint if exists community_posts_tags_limit;

alter table public.community_posts
  add constraint community_posts_title_length check (char_length(btrim(title)) between 1 and 200),
  add constraint community_posts_content_length check (char_length(btrim(content)) between 1 and 5000),
  add constraint community_posts_tags_limit check (tags is null or cardinality(tags) <= 10);

alter table public.post_comments
  drop constraint if exists post_comments_content_length;

alter table public.post_comments
  add constraint post_comments_content_length check (char_length(btrim(content)) between 1 and 3000);

-- Members can post only where the community currently permits member posts. Active
-- moderators/admins remain able to post when member posting is disabled.
drop policy if exists "Members can create posts" on public.community_posts;
create policy "Members can create posts"
on public.community_posts
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.community_members cm
    join public.communities c on c.id = cm.community_id
    where cm.community_id = community_posts.community_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and (c.allow_member_posts = true or public.is_community_moderator_or_admin(c.id))
  )
);

comment on function public.enforce_community_content_boundaries() is
  'Browser field/identity guard for legacy communities, posts and comments; protected routing, moderation and counters are server-controlled.';

commit;

-- CONTROLLED TESTS
-- 1. Community creator can edit ordinary settings but cannot rewrite creator/count fields.
-- 2. New community member/post counters start at zero regardless of browser input.
-- 3. Member post author identity is server-derived; anonymous posts have null author_name.
-- 4. Member cannot self-pin, self-lock, set moderation status or rewrite counters/routing.
-- 5. Author can edit title/content/tags/anonymity only.
-- 6. Comment author identity and moderation/count fields are protected similarly.
-- 7. `allow_member_posts=false` blocks ordinary member posting but not active moderator/admin posting.
