-- One2OneLove relaunch: saved Love Notes
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
-- A recipient may save only a Love Note already securely claimed by their account.

begin;

create table if not exists public.love_note_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invitation_id uuid not null references public.love_note_invitations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, invitation_id)
);

create index if not exists love_note_saves_user_created_idx
  on public.love_note_saves (user_id, created_at desc);

alter table public.love_note_saves enable row level security;

-- Explicit browser grants: members can operate only on their own save-link rows under
-- RLS. The invitation table remains restricted to the safe column grants established
-- by the Love Notes invitation/history hardening; contact/token/provider internals remain unavailable.
revoke all on table public.love_note_saves from anon, authenticated;
grant select, insert, delete on table public.love_note_saves to authenticated;

drop policy if exists "Recipients can view their saved Love Notes" on public.love_note_saves;
create policy "Recipients can view their saved Love Notes"
  on public.love_note_saves
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "Recipients can save revealed Love Notes" on public.love_note_saves;
create policy "Recipients can save revealed Love Notes"
  on public.love_note_saves
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and exists (
      select 1
      from public.love_note_invitations invitation
      where invitation.id = invitation_id
        and invitation.recipient_user_id = (select auth.uid())
        and invitation.status = 'revealed'
    )
  );

drop policy if exists "Recipients can remove their own saved Love Notes" on public.love_note_saves;
create policy "Recipients can remove their own saved Love Notes"
  on public.love_note_saves
  for delete
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- Safe saved-note projection. security_invoker makes the view obey the caller's grants
-- and RLS rather than running with the view owner's privileges.
drop view if exists public.saved_love_notes;
create view public.saved_love_notes
with (security_barrier = true, security_invoker = true)
as
select
  save.id,
  save.user_id,
  save.invitation_id,
  save.created_at,
  invitation.sender_name,
  invitation.recipient_name,
  invitation.note_content,
  invitation.revealed_at
from public.love_note_saves save
join public.love_note_invitations invitation on invitation.id = save.invitation_id
where save.user_id = (select auth.uid())
  and invitation.recipient_user_id = (select auth.uid())
  and invitation.status = 'revealed';

revoke all on public.saved_love_notes from public;
revoke all on public.saved_love_notes from anon;
grant select on public.saved_love_notes to authenticated;

comment on table public.love_note_saves is
  'Recipient-owned save links for securely revealed private Love Notes.';
comment on view public.saved_love_notes is
  'Authenticated recipient-only Saved Love Notes projection. Uses security_invoker and excludes delivery contact, token and provider internals.';

commit;
