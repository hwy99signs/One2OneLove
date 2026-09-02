-- One2OneLove creator and O2OL programming calendar foundation.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
--
-- Launch rules represented here:
--   * 24-hour scheduling is supported through timestamptz + scheduling timezone.
--   * approved creator accounts are existing users.user_type='influencer' accounts.
--   * independent creator programming and O2OL-owned programming are distinct sources.
--   * each creator may hold at most two FREE booked slots per creator-local date.
--   * live and replay programming are supported.
--   * creator bookings record acknowledgement of creator content/community rules.
--   * O2OL-owned programming is created only through a server-side staff allowlist.
--   * paid fields are reserved for a later approved rollout; browser creator insert is disabled.
--   * Global Relationship Room is the initial programming destination.

begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.creator_programming_slots (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid null references auth.users(id) on delete cascade,
  program_source text not null default 'creator'
    check (program_source in ('creator','o2ol')),
  room_slug text not null default 'global-relationship-room'
    check (room_slug in ('global-relationship-room')),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  creator_timezone text not null check (char_length(creator_timezone) between 1 and 80),
  creator_local_date date not null,
  content_mode text not null default 'live' check (content_mode in ('live','replay')),
  replay_url text null check (replay_url is null or char_length(replay_url) <= 1000),
  booking_tier text not null default 'free' check (booking_tier in ('free','paid','internal')),
  price_cents integer not null default 0 check (price_cents >= 0),
  payment_status text not null default 'not_required'
    check (payment_status in ('not_required','pending','paid','refunded','failed')),
  policy_version text null check (policy_version is null or char_length(policy_version) between 1 and 80),
  policy_acknowledged_at timestamptz null,
  status text not null default 'booked'
    check (status in ('booked','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    (booking_tier in ('free','internal') and price_cents = 0 and payment_status = 'not_required')
    or booking_tier = 'paid'
  ),
  check (
    (content_mode = 'replay' and replay_url is not null)
    or content_mode = 'live'
  ),
  check (
    (
      program_source = 'creator'
      and creator_user_id is not null
      and booking_tier in ('free','paid')
      and policy_version is not null
      and policy_acknowledged_at is not null
    )
    or
    (
      program_source = 'o2ol'
      and creator_user_id is null
      and booking_tier = 'internal'
      and policy_version is null
      and policy_acknowledged_at is null
    )
  )
);

create index if not exists creator_programming_slots_schedule_idx
  on public.creator_programming_slots (room_slug, starts_at)
  where status = 'booked';

create index if not exists creator_programming_slots_creator_day_idx
  on public.creator_programming_slots (creator_user_id, creator_local_date, booking_tier, status)
  where program_source = 'creator';

-- The Global Relationship Room has one shared programming timeline regardless of
-- whether the program is O2OL-owned or independently creator-produced.
do $$
begin
  alter table public.creator_programming_slots
    add constraint creator_programming_slots_no_room_overlap
    exclude using gist (
      room_slug with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    ) where (status = 'booked');
exception when duplicate_object then null;
end $$;

create or replace function public.enforce_creator_free_programming_daily_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  booked_count integer;
  lock_key bigint;
begin
  if new.program_source <> 'creator' or new.status <> 'booked' or new.booking_tier <> 'free' then
    return new;
  end if;

  -- Serialize free-slot booking attempts for the same creator/local date so two
  -- simultaneous requests cannot both pass the two-per-day limit.
  lock_key := hashtextextended(new.creator_user_id::text || ':' || new.creator_local_date::text, 0);
  perform pg_advisory_xact_lock(lock_key);

  select count(*) into booked_count
  from public.creator_programming_slots
  where program_source = 'creator'
    and creator_user_id = new.creator_user_id
    and creator_local_date = new.creator_local_date
    and booking_tier = 'free'
    and status = 'booked'
    and id <> new.id;

  if booked_count >= 2 then
    raise exception using
      errcode = 'P0001',
      message = 'CREATOR_DAILY_FREE_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_creator_free_programming_daily_limit() from public, anon, authenticated;

drop trigger if exists creator_programming_slots_daily_limit on public.creator_programming_slots;
create trigger creator_programming_slots_daily_limit
before insert or update of program_source, creator_user_id, creator_local_date, booking_tier, status
on public.creator_programming_slots
for each row execute function public.enforce_creator_free_programming_daily_limit();

create or replace function public.set_creator_programming_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_creator_programming_updated_at() from public, anon, authenticated;

drop trigger if exists creator_programming_slots_updated_at on public.creator_programming_slots;
create trigger creator_programming_slots_updated_at
before update on public.creator_programming_slots
for each row execute function public.set_creator_programming_updated_at();

alter table public.creator_programming_slots enable row level security;

revoke all on table public.creator_programming_slots from anon, authenticated;
grant select on table public.creator_programming_slots to authenticated;
grant update (status, updated_at) on table public.creator_programming_slots to authenticated;

-- Approved creator accounts can read and cancel only their own creator records in the
-- browser. O2OL-owned records are managed only through reviewed server-side functions.
drop policy if exists "creator_programming_select_own" on public.creator_programming_slots;
create policy "creator_programming_select_own"
on public.creator_programming_slots for select
to authenticated
using (
  program_source = 'creator'
  and (select auth.uid()) = creator_user_id
);

drop policy if exists "creator_programming_update_own" on public.creator_programming_slots;
create policy "creator_programming_update_own"
on public.creator_programming_slots for update
to authenticated
using (
  program_source = 'creator'
  and (select auth.uid()) = creator_user_id
  and status = 'booked'
)
with check (
  program_source = 'creator'
  and (select auth.uid()) = creator_user_id
  and status in ('booked','cancelled')
);

comment on table public.creator_programming_slots is
  'Shared Global Relationship Room programming calendar. Creator bookings are owned/cancellable only by their creator; O2OL-owned programming is server-managed. Public/member schedule endpoints expose only minimized programming metadata.';

-- The earlier identity-hardening migration restricted the room_messages table itself to
-- the original five room slugs. The Global Relationship Room must pass both that table
-- constraint and the INSERT policy below, otherwise a valid member message would still
-- be rejected before RLS can authorize it.
alter table public.room_messages
  drop constraint if exists room_messages_room_slug_allowed;

alter table public.room_messages
  add constraint room_messages_room_slug_allowed
  check (room_slug in (
    'global-relationship-room',
    'vent-room',
    'modern-dating-unfiltered',
    'love-talk',
    'marriage-matters',
    'starting-over'
  ));

-- Add the approved Global Relationship Room to member messaging without weakening the
-- existing ownership rule. This replaces the prior five-room allowlist policy.
drop policy if exists "room_messages_insert_own" on public.room_messages;
create policy "room_messages_insert_own" on public.room_messages for insert to authenticated with check (
  (select auth.uid()) = user_id
  and message_type = 'member'
  and room_slug in (
    'global-relationship-room','vent-room','modern-dating-unfiltered','love-talk','marriage-matters','starting-over'
  )
);

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_CREATOR_PROGRAMMING_ENABLED=false and CREATOR_PROGRAMMING_ENABLED=false.
-- 2. Apply only to a reviewed development environment first.
-- 3. Verify anon has zero direct table privileges and authenticated creators can see only their own creator slots.
-- 4. Verify O2OL-owned slots cannot be read/updated directly through authenticated table access.
-- 5. Verify a third free creator booking on one creator-local date fails under concurrent requests.
-- 6. Verify overlapping creator/O2OL booked slots fail at the shared exclusion constraint.
-- 7. Verify Global Relationship Room messages pass both room_messages_room_slug_allowed and room_messages_insert_own.
-- 8. Verify every inserted creator slot has server-assigned policy_version and policy_acknowledged_at values.
-- 9. Verify O2OL-owned slots have program_source='o2ol', booking_tier='internal', null creator_user_id, and no creator-policy acknowledgement fields.
-- 10. Deploy programming Edge Functions with JWT verification enabled.
-- 11. Keep paid booking disabled until a separate payment/refund/terms approval batch.
