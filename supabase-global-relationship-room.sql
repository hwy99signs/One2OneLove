-- O2OL Global Relationship Room
-- Secure database foundation for creator accounts and 24-hour programming.
-- Designed for the existing One2OneLove Supabase project.

create table if not exists public.room_creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  status text not null default 'pending' check (status in ('pending','approved','suspended','rejected')),
  plan text not null default 'free' check (plan in ('free','paid','partner','internal')),
  daily_slot_limit integer not null default 2 check (daily_slot_limit >= 0),
  timezone text not null default 'UTC',
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.relationship_room_slots (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.room_creator_profiles(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  program_type text not null default 'creator' check (program_type in ('o2ol','creator','replay','partner','special')),
  creator_display_name text,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  source_slot_id uuid references public.relationship_room_slots(id) on delete set null,
  status text not null default 'pending' check (status in ('draft','pending','approved','scheduled','live','completed','cancelled','removed')),
  moderation_status text not null default 'unreviewed' check (moderation_status in ('unreviewed','approved','flagged','rejected')),
  disclaimer_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_slot_valid_time check (scheduled_end > scheduled_start)
);

create index if not exists idx_room_creator_profiles_user on public.room_creator_profiles (user_id);
create index if not exists idx_room_slots_schedule on public.relationship_room_slots (scheduled_start, scheduled_end);
create index if not exists idx_room_slots_creator_day on public.relationship_room_slots (creator_id, scheduled_start);
create index if not exists idx_room_slots_owner on public.relationship_room_slots (owner_user_id);
create index if not exists idx_room_slots_status on public.relationship_room_slots (status, moderation_status);
create index if not exists idx_room_slots_source_slot on public.relationship_room_slots (source_slot_id);

-- Prevent two active/pending programs from occupying the same room time.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'relationship_room_no_active_overlap'
      and conrelid = 'public.relationship_room_slots'::regclass
  ) then
    alter table public.relationship_room_slots
      add constraint relationship_room_no_active_overlap
      exclude using gist (
        tstzrange(scheduled_start, scheduled_end, '[)') with &&
      )
      where (status in ('pending','approved','scheduled','live'));
  end if;
end $$;

alter table public.room_creator_profiles enable row level security;
alter table public.relationship_room_slots enable row level security;

-- Explicit Data API grants. Anonymous visitors receive only public schedule columns.
revoke all on table public.room_creator_profiles from anon;
revoke all on table public.relationship_room_slots from anon;
revoke all on table public.room_creator_profiles from authenticated;
revoke all on table public.relationship_room_slots from authenticated;

grant select (
  id, title, description, program_type, creator_display_name,
  scheduled_start, scheduled_end, status, moderation_status,
  disclaimer_required, source_slot_id
) on table public.relationship_room_slots to anon;

grant select on table public.room_creator_profiles to authenticated;
grant insert (user_id, display_name, bio, timezone, terms_accepted_at)
  on table public.room_creator_profiles to authenticated;
grant update (display_name, bio, timezone, terms_accepted_at, updated_at)
  on table public.room_creator_profiles to authenticated;

grant select on table public.relationship_room_slots to authenticated;
grant insert (
  creator_id, owner_user_id, title, description, program_type,
  scheduled_start, scheduled_end, source_slot_id
) on table public.relationship_room_slots to authenticated;
grant update (
  title, description, scheduled_start, scheduled_end, status, updated_at
) on table public.relationship_room_slots to authenticated;

-- Public schedule: only programming that has cleared moderation and is intended for viewers.
drop policy if exists "public can view approved room schedule" on public.relationship_room_slots;
create policy "public can view approved room schedule"
on public.relationship_room_slots
for select
to anon
using (
  status in ('approved','scheduled','live','completed')
  and moderation_status = 'approved'
);

-- Signed-in users get one SELECT policy covering both the public schedule and their own submissions.
drop policy if exists "authenticated can view approved room schedule" on public.relationship_room_slots;
drop policy if exists "creators can view own room slots" on public.relationship_room_slots;
drop policy if exists "authenticated room schedule access" on public.relationship_room_slots;
create policy "authenticated room schedule access"
on public.relationship_room_slots
for select
to authenticated
using (
  (select auth.uid()) = owner_user_id
  or (
    status in ('approved','scheduled','live','completed')
    and moderation_status = 'approved'
  )
);

-- Creators may read their own profile.
drop policy if exists "creators can read own room profile" on public.room_creator_profiles;
create policy "creators can read own room profile"
on public.room_creator_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Authenticated users may submit a creator profile only for themselves.
drop policy if exists "users can create own room profile" on public.room_creator_profiles;
create policy "users can create own room profile"
on public.room_creator_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and plan = 'free'
  and daily_slot_limit = 2
);

-- Creators may update only their own editable profile fields.
drop policy if exists "creators can update own room profile" on public.room_creator_profiles;
create policy "creators can update own room profile"
on public.room_creator_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Creators may submit only their own normal creator slots. Administrative fields are omitted
-- from the INSERT grant, so clients cannot self-approve, self-moderate, or bypass disclaimers.
drop policy if exists "creators can submit own room slots" on public.relationship_room_slots;
create policy "creators can submit own room slots"
on public.relationship_room_slots
for insert
to authenticated
with check (
  (select auth.uid()) = owner_user_id
  and program_type = 'creator'
  and status = 'pending'
  and moderation_status = 'unreviewed'
  and disclaimer_required = true
  and exists (
    select 1
    from public.room_creator_profiles p
    where p.id = creator_id
      and p.user_id = (select auth.uid())
      and p.status = 'approved'
  )
);

-- Creators may edit/cancel only their own non-live submissions. Sensitive columns are not
-- included in the UPDATE grant and cannot be changed from a browser client.
drop policy if exists "creators can update own nonlive room slots" on public.relationship_room_slots;
create policy "creators can update own nonlive room slots"
on public.relationship_room_slots
for update
to authenticated
using (
  (select auth.uid()) = owner_user_id
  and status in ('draft','pending','cancelled')
)
with check (
  (select auth.uid()) = owner_user_id
  and status in ('draft','pending','cancelled')
  and moderation_status = 'unreviewed'
  and disclaimer_required = true
);

create schema if not exists private;
revoke all on schema private from public;

-- Populate only a safe public presenter name onto the schedule row. Public viewers never need
-- direct access to creator profile records.
create or replace function private.populate_room_creator_display_name()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.creator_id is null then
    if new.program_type = 'o2ol' then
      new.creator_display_name := 'One2OneLove';
    else
      new.creator_display_name := null;
    end if;
    return new;
  end if;

  select p.display_name
  into new.creator_display_name
  from public.room_creator_profiles p
  where p.id = new.creator_id;

  return new;
end;
$$;

revoke all on function private.populate_room_creator_display_name() from public, anon, authenticated;

drop trigger if exists populate_room_creator_display_name on public.relationship_room_slots;
create trigger populate_room_creator_display_name
before insert or update of creator_id, program_type
on public.relationship_room_slots
for each row execute function private.populate_room_creator_display_name();

-- Database-level enforcement keeps the free 2-slot daily rule intact even when a creator
-- calls the Data API directly instead of using the O2OL interface. The creator's stored
-- IANA timezone determines what counts as a calendar day for the limit.
create or replace function private.enforce_room_creator_daily_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  creator_plan text;
  creator_limit integer;
  creator_timezone text;
  existing_count integer;
  local_day date;
  lock_key bigint;
begin
  if new.program_type <> 'creator'
     or new.status not in ('draft','pending','approved','scheduled','live') then
    return new;
  end if;

  select plan, daily_slot_limit, timezone
  into creator_plan, creator_limit, creator_timezone
  from public.room_creator_profiles
  where id = new.creator_id;

  if creator_plan is null then
    raise exception 'A valid creator profile is required.' using errcode = '23514';
  end if;

  if creator_plan <> 'free' then
    return new;
  end if;

  creator_timezone := coalesce(nullif(creator_timezone, ''), 'UTC');
  local_day := (new.scheduled_start at time zone creator_timezone)::date;

  -- Serialize concurrent reservations for the same creator-local day so simultaneous direct
  -- API requests cannot both pass the count check and exceed the free daily allowance.
  lock_key := hashtextextended(new.creator_id::text || ':' || local_day::text, 0);
  perform pg_advisory_xact_lock(lock_key);

  select count(*)
  into existing_count
  from public.relationship_room_slots s
  where s.creator_id = new.creator_id
    and s.id is distinct from new.id
    and s.status in ('draft','pending','approved','scheduled','live')
    and (s.scheduled_start at time zone creator_timezone)::date = local_day;

  if existing_count >= creator_limit then
    raise exception 'Free creator accounts are limited to % programming slots per creator-local day.', creator_limit
      using errcode = '23514';
  end if;

  return new;
exception
  when invalid_parameter_value then
    raise exception 'Creator timezone is invalid.' using errcode = '23514';
end;
$$;

revoke all on function private.enforce_room_creator_daily_limit() from public, anon, authenticated;

drop trigger if exists enforce_room_creator_daily_limit on public.relationship_room_slots;
create trigger enforce_room_creator_daily_limit
before insert or update of creator_id, scheduled_start, scheduled_end, status
on public.relationship_room_slots
for each row execute function private.enforce_room_creator_daily_limit();

comment on table public.relationship_room_slots is
'O2OL 24-hour Global Relationship Room schedule. Paid slot sales are intentionally deferred; free creators initially receive up to two slots per creator-local day. Approval and moderation fields are protected from direct browser writes, overlapping active slots are blocked, safe creator display names are denormalized into public schedule rows, and the daily free limit is concurrency-safe in Postgres.';
