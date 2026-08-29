-- O2OL private contact-message queue
-- Applied live to project hphhmjcutesqsdnubnnw on 2026-08-19.
-- Browser users may INSERT only. No anon/auth SELECT, UPDATE, or DELETE grants.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  constraint contact_messages_name_length check (char_length(trim(name)) between 1 and 120),
  constraint contact_messages_email_length check (char_length(trim(email)) between 3 and 320),
  constraint contact_messages_subject_length check (char_length(trim(subject)) between 1 and 200),
  constraint contact_messages_message_length check (char_length(trim(message)) between 10 and 5000),
  constraint contact_messages_language_check check (language in ('en','es','fr','it','de'))
);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon;
revoke all on table public.contact_messages from authenticated;
grant insert on table public.contact_messages to anon;
grant insert on table public.contact_messages to authenticated;

drop policy if exists contact_messages_anon_insert on public.contact_messages;
create policy contact_messages_anon_insert on public.contact_messages
  for insert to anon
  with check (user_id is null);

drop policy if exists contact_messages_authenticated_insert on public.contact_messages;
create policy contact_messages_authenticated_insert on public.contact_messages
  for insert to authenticated
  with check (user_id = auth.uid());
