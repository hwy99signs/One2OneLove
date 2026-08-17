-- One2OneLove Love Notes private invitation/reveal model.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.

create table if not exists public.love_note_invitations (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 80),
  recipient_name text check (recipient_name is null or char_length(recipient_name) <= 80),
  recipient_contact text not null check (char_length(recipient_contact) between 1 and 160),
  delivery_method text not null check (delivery_method in ('sms', 'email')),
  note_content text not null check (char_length(note_content) between 1 and 500),
  -- Scheduled notes receive a reveal token only when the delivery worker sends them,
  -- so plaintext tokens never have to be stored while waiting for a future date.
  token_hash text,
  token_expires_at timestamptz,
  scheduled_for timestamptz,
  status text not null default 'queued' check (
    status in ('queued', 'scheduled', 'sent', 'delivered', 'revealed', 'failed', 'canceled')
  ),
  provider_message_id text,
  failure_reason text,
  sent_at timestamptz,
  delivered_at timestamptz,
  revealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint love_note_token_pair check (
    (token_hash is null and token_expires_at is null)
    or (token_hash is not null and token_expires_at is not null)
  )
);

create unique index if not exists love_note_invitations_token_hash_uidx
  on public.love_note_invitations(token_hash)
  where token_hash is not null;

create index if not exists love_note_invitations_sender_idx
  on public.love_note_invitations(sender_user_id, created_at desc);

create index if not exists love_note_invitations_status_idx
  on public.love_note_invitations(status, scheduled_for)
  where status in ('queued', 'scheduled');

alter table public.love_note_invitations enable row level security;

-- Members may see only the invitations they created. Recipient reveal is handled
-- server-side by an Edge Function after validating the private token; recipient
-- contact information and note text are never exposed through a public SELECT.
drop policy if exists "love_note_sender_select_own" on public.love_note_invitations;
create policy "love_note_sender_select_own"
  on public.love_note_invitations
  for select
  to authenticated
  using (sender_user_id = auth.uid());

-- No direct INSERT/UPDATE/DELETE policy is granted to browser clients.
-- The authenticated Edge Function performs writes using the service role after
-- verifying the caller. This prevents clients from forging delivery/reveal state.

create or replace function public.set_love_note_invitation_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_love_note_invitation_updated_at on public.love_note_invitations;
create trigger set_love_note_invitation_updated_at
before update on public.love_note_invitations
for each row execute function public.set_love_note_invitation_updated_at();

comment on table public.love_note_invitations is
  'Private Love Notes delivery records. Raw reveal tokens are never stored; only a SHA-256 hash is persisted after a note is actually sent.';
