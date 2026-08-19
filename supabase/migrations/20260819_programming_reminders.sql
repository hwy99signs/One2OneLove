-- One2OneLove programming reminders + in-app programming notifications.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_creator_programming_calendar.sql.

begin;

create extension if not exists pgcrypto;

create table if not exists public.programming_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_id uuid not null references public.creator_programming_slots(id) on delete cascade,
  remind_at timestamptz not null,
  status text not null default 'active' check (status in ('active','sent','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot_id)
);

create index if not exists programming_reminders_due_idx
  on public.programming_reminders (remind_at)
  where status = 'active';

create index if not exists programming_reminders_user_idx
  on public.programming_reminders (user_id, created_at desc);

create table if not exists public.programming_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_id uuid null references public.creator_programming_slots(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 500),
  action_path text not null default '/LiveRoom?room=global-relationship-room'
    check (char_length(action_path) between 1 and 300),
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists programming_notifications_unread_idx
  on public.programming_notifications (user_id, created_at desc)
  where read_at is null;

alter table public.programming_reminders enable row level security;
alter table public.programming_notifications enable row level security;

revoke all on table public.programming_reminders from anon, authenticated;
revoke all on table public.programming_notifications from anon, authenticated;

grant select on table public.programming_reminders to authenticated;
grant select on table public.programming_notifications to authenticated;
grant update (read_at) on table public.programming_notifications to authenticated;

-- Reminder creation/cancellation is server mediated so the server chooses remind_at
-- and verifies the referenced programming slot is real, booked and in the future.
drop policy if exists "programming_reminders_select_own" on public.programming_reminders;
create policy "programming_reminders_select_own"
on public.programming_reminders for select
to authenticated
using ((select auth.uid()) = user_id);

-- In-app programming notifications are private to the recipient. Browser updates can
-- change read_at only because no other columns are granted for UPDATE.
drop policy if exists "programming_notifications_select_own" on public.programming_notifications;
create policy "programming_notifications_select_own"
on public.programming_notifications for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "programming_notifications_mark_own_read" on public.programming_notifications;
create policy "programming_notifications_mark_own_read"
on public.programming_notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_programming_reminder_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_programming_reminder_updated_at() from public, anon, authenticated;

drop trigger if exists programming_reminders_updated_at on public.programming_reminders;
create trigger programming_reminders_updated_at
before update on public.programming_reminders
for each row execute function public.set_programming_reminder_updated_at();

comment on table public.programming_reminders is
  'Private member reminders for scheduled Global Relationship Room programming. Writes are backend-only; members can read only their own reminder state.';
comment on table public.programming_notifications is
  'Private in-app notifications generated from due programming reminders. Members can read their own records and mark read_at only.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_PROGRAMMING_REMINDERS_ENABLED=false and PROGRAMMING_REMINDERS_ENABLED=false.
-- 2. Verify creator_programming_slots exists first.
-- 3. Verify anon has zero table privileges.
-- 4. Verify authenticated members cannot INSERT/UPDATE/DELETE programming_reminders directly.
-- 5. Verify members can SELECT only their own reminder/notification rows.
-- 6. Verify authenticated notification UPDATE privileges are limited to read_at.
-- 7. Do not configure any email/SMS/push delivery provider as part of this migration.
