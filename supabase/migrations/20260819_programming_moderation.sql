-- One2OneLove programming moderation foundation.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_creator_programming_calendar.sql.
--
-- Member reports are private moderation records. Browser users cannot enumerate reports
-- from other members and cannot directly change review status. Moderation actions are
-- mediated by allowlisted O2OL backend functions.

begin;

create extension if not exists pgcrypto;

create table if not exists public.programming_reports (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.creator_programming_slots(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in (
    'harassment_or_hate',
    'sexual_or_exploitative',
    'dangerous_advice',
    'privacy_or_doxxing',
    'spam_or_scam',
    'copyright_or_rights',
    'other'
  )),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending','dismissed','actioned')),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (slot_id, reporter_id)
);

create index if not exists programming_reports_pending_idx
  on public.programming_reports (created_at)
  where status = 'pending';

create index if not exists programming_reports_slot_idx
  on public.programming_reports (slot_id, status, created_at);

alter table public.programming_reports enable row level security;

revoke all on table public.programming_reports from anon, authenticated;
grant select on table public.programming_reports to authenticated;

-- A member may see only their own submitted report state. Report creation and every
-- moderation-state change are backend-mediated.
drop policy if exists "programming_reports_select_own" on public.programming_reports;
create policy "programming_reports_select_own"
on public.programming_reports for select
to authenticated
using ((select auth.uid()) = reporter_id);

comment on table public.programming_reports is
  'Private member reports about Global Relationship Room programming. Members can read only their own report state; inserts and moderation actions are backend-only.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Apply only after the programming calendar migration exists.
-- 2. Verify anon has zero privileges.
-- 3. Verify authenticated members cannot INSERT/UPDATE/DELETE reports directly.
-- 4. Verify authenticated members can SELECT only their own report rows.
-- 5. Verify one member cannot create duplicate reports for the same slot.
-- 6. Verify reviewed_by is set only by the allowlisted moderation backend.
