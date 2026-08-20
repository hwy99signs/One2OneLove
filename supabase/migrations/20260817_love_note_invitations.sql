-- One2OneLove Love Notes private invitation/reveal model.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Privacy / reliability model:
--   * Raw reveal tokens are never stored; only SHA-256 hashes are persisted.
--   * Browser clients cannot write the delivery table directly.
--   * Authenticated sender/recipient history is exposed only through a safe projection.
--   * The safe history projection runs as SECURITY INVOKER so caller RLS is enforced.
--   * Authenticated callers receive SELECT only on the exact safe base-table columns
--     needed by the history projection; recipient contact, token/provider and failure
--     internals remain unavailable to browser roles.
--   * All delivery/reveal state changes are performed server-side with validated callers.
--   * Each sender submission carries a client_request_id so network retries cannot create
--     or send a second invitation for the same logical submission.

begin;

create table if not exists public.love_note_invitations (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid not null,
  recipient_user_id uuid references auth.users(id) on delete set null,
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
  schedule_timezone text check (schedule_timezone is null or char_length(schedule_timezone) <= 80),
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
  ),
  unique (sender_user_id, client_request_id)
);

create unique index if not exists love_note_invitations_token_hash_uidx
  on public.love_note_invitations(token_hash)
  where token_hash is not null;

create index if not exists love_note_invitations_sender_idx
  on public.love_note_invitations(sender_user_id, created_at desc);

create index if not exists love_note_invitations_recipient_idx
  on public.love_note_invitations(recipient_user_id, revealed_at desc)
  where recipient_user_id is not null;

create index if not exists love_note_invitations_status_idx
  on public.love_note_invitations(status, scheduled_for)
  where status in ('queued', 'scheduled');

alter table public.love_note_invitations enable row level security;

-- Close raw-table access by default. A narrow column-level SELECT grant is added
-- below only so the SECURITY INVOKER history view can evaluate under caller RLS.
revoke all on table public.love_note_invitations from anon, authenticated;

drop policy if exists "love_note_sender_select_own" on public.love_note_invitations;
drop policy if exists "love_note_participants_select_own" on public.love_note_invitations;
create policy "love_note_participants_select_own"
  on public.love_note_invitations
  for select
  to authenticated
  using (sender_user_id = auth.uid() or recipient_user_id = auth.uid());

-- No direct INSERT/UPDATE/DELETE policy is granted to browser clients.
-- Edge Functions perform writes using service_role after validating the caller.

-- SECURITY INVOKER views require the caller to have privileges on the referenced
-- base columns. Grant only the safe history fields. Sensitive recipient contact,
-- request IDs, token hashes/expiry, provider IDs and failure details stay revoked.
grant select (
  id,
  sender_user_id,
  recipient_user_id,
  sender_name,
  recipient_name,
  delivery_method,
  note_content,
  scheduled_for,
  schedule_timezone,
  status,
  sent_at,
  delivered_at,
  revealed_at,
  created_at,
  updated_at
) on table public.love_note_invitations to authenticated;

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

-- Safe browser history projection. It intentionally excludes recipient_contact,
-- client_request_id, token_hash/token_expires_at, provider_message_id and failure_reason.
drop view if exists public.love_note_invitation_history;
create view public.love_note_invitation_history
with (security_barrier = true, security_invoker = true)
as
select
  id,
  sender_user_id,
  recipient_user_id,
  sender_name,
  recipient_name,
  delivery_method,
  note_content,
  scheduled_for,
  schedule_timezone,
  status,
  sent_at,
  delivered_at,
  revealed_at,
  created_at,
  updated_at
from public.love_note_invitations
where sender_user_id = auth.uid() or recipient_user_id = auth.uid();

revoke all on public.love_note_invitation_history from public;
revoke all on public.love_note_invitation_history from anon;
grant select on public.love_note_invitation_history to authenticated;

comment on table public.love_note_invitations is
  'Private Love Notes delivery records. Raw reveal tokens are never stored; browser writes are blocked; authenticated SELECT is limited to safe history columns and participant RLS.';
comment on view public.love_note_invitation_history is
  'Participant-only Love Note history projection. SECURITY INVOKER enforces caller RLS; excludes recipient contact, request IDs, token hashes, provider IDs and failure internals.';

commit;
