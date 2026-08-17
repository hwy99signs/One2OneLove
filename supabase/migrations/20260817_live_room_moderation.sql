-- One2OneLove Live Community message reporting.
-- Development branch only. Do not run against production without explicit approval.
-- This intentionally has no client SELECT policy: members can submit reports but cannot browse report records.

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

drop policy if exists "room_reports_insert_own" on public.room_message_reports;
create policy "room_reports_insert_own"
  on public.room_message_reports
  for insert
  to authenticated
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1
      from public.room_messages m
      where m.id = message_id
        and m.deleted_at is null
        and m.user_id <> auth.uid()
    )
  );
