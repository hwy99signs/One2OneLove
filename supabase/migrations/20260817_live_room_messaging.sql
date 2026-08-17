-- One2OneLove Live Community secure group-room messaging + reactions.
-- Build branch only. Do not run against production without explicit approval.

create extension if not exists pgcrypto;

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  content text not null check (char_length(content) between 1 and 2000),
  message_type text not null default 'member' check (message_type in ('member','host','system')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists room_messages_room_created_idx on public.room_messages(room_slug, created_at desc);

create table if not exists public.room_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.room_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤️','👍','😂','👏','🤔')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists room_message_reactions_message_idx on public.room_message_reactions(message_id);

alter table public.room_messages enable row level security;
alter table public.room_message_reactions enable row level security;

drop policy if exists "room_messages_select_authenticated" on public.room_messages;
create policy "room_messages_select_authenticated" on public.room_messages for select to authenticated using (deleted_at is null);

drop policy if exists "room_messages_insert_own" on public.room_messages;
create policy "room_messages_insert_own" on public.room_messages for insert to authenticated with check (
  auth.uid() = user_id and message_type = 'member' and room_slug in (
    'vent-room','modern-dating-unfiltered','love-talk','marriage-matters','starting-over'
  )
);

drop policy if exists "room_messages_delete_own" on public.room_messages;
create policy "room_messages_delete_own" on public.room_messages for delete to authenticated using (auth.uid() = user_id and message_type = 'member');

drop policy if exists "room_reactions_select_authenticated" on public.room_message_reactions;
create policy "room_reactions_select_authenticated" on public.room_message_reactions for select to authenticated using (true);

drop policy if exists "room_reactions_insert_own" on public.room_message_reactions;
create policy "room_reactions_insert_own" on public.room_message_reactions for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.room_messages m where m.id = message_id and m.deleted_at is null
  )
);

drop policy if exists "room_reactions_delete_own" on public.room_message_reactions;
create policy "room_reactions_delete_own" on public.room_message_reactions for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  alter publication supabase_realtime add table public.room_messages;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.room_message_reactions;
exception when duplicate_object then null;
end $$;
