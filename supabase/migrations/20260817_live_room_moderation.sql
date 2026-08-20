-- One2OneLove Live Community message reporting.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
-- Members may submit a report but cannot browse, edit, delete, self-resolve, or choose
-- internal moderation status/timestamps.

begin;

create table if not exists public.room_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.room_messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('harassment','personal_information','threats','spam','other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'pending' check (status in ('pending','reviewed','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (message_id, reporter_id)
);

create index if not exists room_message_reports_status_created_idx
  on public.room_message_reports(status, created_at desc);

alter table public.room_message_reports enable row level security;

-- Browser members may submit only the four user-authored fields. Internal fields such
-- as id, status, created_at and reviewed_at remain database/server controlled.
-- Moderation/admin tooling must use a separately reviewed server-side/admin path rather
-- than exposing this private queue through broad client grants.
revoke all on table public.room_message_reports from public, anon, authenticated;
grant insert (message_id, reporter_id, reason, details)
  on table public.room_message_reports
  to authenticated;

drop policy if exists "room_reports_insert_own" on public.room_message_reports;
create policy "room_reports_insert_own"
  on public.room_message_reports
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = reporter_id
    and status = 'pending'
    and reviewed_at is null
    and exists (
      select 1
      from public.room_messages m
      where m.id = message_id
        and m.deleted_at is null
        and m.message_type = 'member'
        and m.user_id <> (select auth.uid())
    )
  );

comment on table public.room_message_reports is
  'Private moderation intake queue. Authenticated members may submit pending reports about other members; browser roles cannot read or manage reports or set internal moderation fields.';

commit;
