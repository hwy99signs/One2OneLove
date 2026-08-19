-- O2OL Global Relationship Room
-- Initial database foundation for creator accounts and 24-hour programming.
-- Apply to the existing One2OneLove Supabase project after review of the target environment.

create table if not exists public.room_creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  status text not null default 'pending' check (status in ('pending','approved','suspended','rejected')),
  plan text not null default 'free' check (plan in ('free','paid','partner','internal')),
  daily_slot_limit integer not null default 2 check (daily_slot_limit >= 0),
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
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  source_slot_id uuid references public.relationship_room_slots(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','pending','approved','scheduled','live','completed','cancelled','removed')),
  moderation_status text not null default 'unreviewed' check (moderation_status in ('unreviewed','approved','flagged','rejected')),
  disclaimer_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_slot_valid_time check (scheduled_end > scheduled_start)
);

create index if not exists idx_room_slots_schedule
  on public.relationship_room_slots (scheduled_start, scheduled_end);

create index if not exists idx_room_slots_creator_day
  on public.relationship_room_slots (creator_id, scheduled_start);

create index if not exists idx_room_slots_status
  on public.relationship_room_slots (status);

alter table public.room_creator_profiles enable row level security;
alter table public.relationship_room_slots enable row level security;

-- Public schedule: only programming that has cleared moderation and is intended for viewers.
drop policy if exists "public can view approved room schedule" on public.relationship_room_slots;
create policy "public can view approved room schedule"
on public.relationship_room_slots
for select
using (
  status in ('approved','scheduled','live','completed')
  and moderation_status = 'approved'
);

-- Creators may read their own profile.
drop policy if exists "creators can read own room profile" on public.room_creator_profiles;
create policy "creators can read own room profile"
on public.room_creator_profiles
for select
to authenticated
using (auth.uid() = user_id);

-- Creators may update non-administrative fields on their own row through application-controlled writes.
drop policy if exists "creators can update own room profile" on public.room_creator_profiles;
create policy "creators can update own room profile"
on public.room_creator_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Authenticated users may submit a creator profile for themselves.
drop policy if exists "users can create own room profile" on public.room_creator_profiles;
create policy "users can create own room profile"
on public.room_creator_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

-- Creators may see slots that belong to them, including pending/draft entries.
drop policy if exists "creators can view own room slots" on public.relationship_room_slots;
create policy "creators can view own room slots"
on public.relationship_room_slots
for select
to authenticated
using (auth.uid() = owner_user_id);

-- Creators may submit slots for themselves. Approval/moderation fields should be controlled by trusted admin workflows.
drop policy if exists "creators can submit own room slots" on public.relationship_room_slots;
create policy "creators can submit own room slots"
on public.relationship_room_slots
for insert
to authenticated
with check (auth.uid() = owner_user_id);

-- Creators may update their own non-live slots. Application logic must prevent privilege escalation of approval fields.
drop policy if exists "creators can update own nonlive room slots" on public.relationship_room_slots;
create policy "creators can update own nonlive room slots"
on public.relationship_room_slots
for update
to authenticated
using (
  auth.uid() = owner_user_id
  and status in ('draft','pending','cancelled')
)
with check (auth.uid() = owner_user_id);

comment on table public.relationship_room_slots is
'O2OL 24-hour Global Relationship Room schedule. Paid slot sales are intentionally deferred; free creators initially receive up to two slots per day through application policy.';
