-- One2OneLove relaunch: saved Love Notes
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
-- A recipient may save only a Love Note that has already been claimed by their account.

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

create policy "Recipients can view their saved Love Notes"
  on public.love_note_saves
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Recipients can save revealed Love Notes"
  on public.love_note_saves
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.love_note_invitations invitation
      where invitation.id = invitation_id
        and invitation.recipient_user_id = auth.uid()
        and invitation.status = 'revealed'
    )
  );

create policy "Recipients can remove their own saved Love Notes"
  on public.love_note_saves
  for delete
  to authenticated
  using (user_id = auth.uid());
