-- One2OneLove contact-message backend contract.
-- Mirrors the live Supabase table/policies and is intentionally insert-only to browser roles.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;

drop policy if exists contact_messages_anon_insert on public.contact_messages;
create policy contact_messages_anon_insert
on public.contact_messages
for insert
to anon
with check (user_id is null);

drop policy if exists contact_messages_authenticated_insert on public.contact_messages;
create policy contact_messages_authenticated_insert
on public.contact_messages
for insert
to authenticated
with check (user_id = auth.uid());
