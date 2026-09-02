-- One2OneLove Live Community secure group-room messaging + reactions.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
-- This foundation is safe from first activation: six-room routing, RLS, least-privilege
-- browser grants, authenticated sender identity derivation, and Realtime publication.

begin;

create extension if not exists pgcrypto;

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  content text not null check (char_length(content) between 1 and 2000),
  message_type text not null default 'member' check (message_type in ('member','host','system')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint room_messages_sender_name_length check (char_length(trim(sender_name)) between 1 and 80),
  constraint room_messages_room_slug_allowed check (room_slug in (
    'global-relationship-room',
    'vent-room',
    'modern-dating-unfiltered',
    'love-talk',
    'marriage-matters',
    'starting-over'
  ))
);

create index if not exists room_messages_room_created_idx
  on public.room_messages(room_slug, created_at desc);

create table if not exists public.room_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.room_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤️','👍','😂','👏','🤔')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists room_message_reactions_message_idx
  on public.room_message_reactions(message_id);

alter table public.room_messages enable row level security;
alter table public.room_message_reactions enable row level security;

-- Explicit grants are required for current Supabase Data API defaults. Anonymous clients
-- have no room-message access. Authenticated members can read, create, and remove only
-- through the RLS policies below; UPDATE is intentionally not granted.
revoke all on table public.room_messages from anon, authenticated;
revoke all on table public.room_message_reactions from anon, authenticated;
grant select, insert, delete on table public.room_messages to authenticated;
grant select, insert, delete on table public.room_message_reactions to authenticated;

-- Member-authored public identity is server-derived from the signed-in account's own
-- profile row. The browser cannot impersonate a different user_id or display name.
-- No email address is ever used as a public fallback. If a profile has no name, use a
-- language-neutral stable pseudonym rather than storing English display prose.
create or replace function public.set_room_member_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  profile_name text;
begin
  if new.message_type <> 'member' then
    return new;
  end if;

  if (select auth.uid()) is null then
    raise exception 'Authentication required for member room messages';
  end if;

  new.user_id := (select auth.uid());

  select nullif(trim(u.name), '')
    into profile_name
    from public.users u
   where u.id = (select auth.uid())
   limit 1;

  new.sender_name := left(
    coalesce(profile_name, '@' || substr(md5((select auth.uid())::text), 1, 10)),
    80
  );

  return new;
end;
$$;

revoke all on function public.set_room_member_identity() from public, anon, authenticated;

drop trigger if exists set_room_member_identity on public.room_messages;
create trigger set_room_member_identity
before insert on public.room_messages
for each row execute function public.set_room_member_identity();

drop policy if exists "room_messages_select_authenticated" on public.room_messages;
create policy "room_messages_select_authenticated"
  on public.room_messages
  for select
  to authenticated
  using (deleted_at is null);

drop policy if exists "room_messages_insert_own" on public.room_messages;
create policy "room_messages_insert_own"
  on public.room_messages
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and message_type = 'member'
    and room_slug in (
      'global-relationship-room',
      'vent-room',
      'modern-dating-unfiltered',
      'love-talk',
      'marriage-matters',
      'starting-over'
    )
  );

drop policy if exists "room_messages_delete_own" on public.room_messages;
create policy "room_messages_delete_own"
  on public.room_messages
  for delete
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and message_type = 'member'
  );

drop policy if exists "room_reactions_select_authenticated" on public.room_message_reactions;
create policy "room_reactions_select_authenticated"
  on public.room_message_reactions
  for select
  to authenticated
  using (true);

drop policy if exists "room_reactions_insert_own" on public.room_message_reactions;
create policy "room_reactions_insert_own"
  on public.room_message_reactions
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and exists (
      select 1
      from public.room_messages m
      where m.id = message_id
        and m.deleted_at is null
    )
  );

drop policy if exists "room_reactions_delete_own" on public.room_message_reactions;
create policy "room_reactions_delete_own"
  on public.room_message_reactions
  for delete
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

do $$ begin
  alter publication supabase_realtime add table public.room_messages;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.room_message_reactions;
exception when duplicate_object then null;
end $$;

comment on function public.set_room_member_identity() is
  'For member-authored Live Room messages, derives user_id and public sender_name from the authenticated account without exposing email or trusting browser identity.';

commit;
