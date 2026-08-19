-- O2OL Global Relationship Room moderation controls
-- Trusted moderator registry, audit trail, and authenticated RPC endpoints.
-- Initial moderator assignment is intentionally NOT automatic.

create schema if not exists private;
revoke all on schema private from public;

create table if not exists private.global_room_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'moderator' check (role in ('moderator','admin')),
  active boolean not null default true,
  added_at timestamptz not null default now(),
  added_by uuid references auth.users(id) on delete set null
);

create table if not exists private.global_room_moderation_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('creator','slot')),
  target_id uuid not null,
  decision text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_global_room_moderators_added_by
  on private.global_room_moderators (added_by);

create index if not exists idx_global_room_moderation_audit_actor
  on private.global_room_moderation_audit (actor_user_id);

alter table private.global_room_moderators enable row level security;
alter table private.global_room_moderation_audit enable row level security;
revoke all on table private.global_room_moderators from public, anon, authenticated;
revoke all on table private.global_room_moderation_audit from public, anon, authenticated;

create or replace function public.is_global_room_moderator()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from private.global_room_moderators m
    where m.user_id = (select auth.uid())
      and m.active = true
  );
$$;

revoke all on function public.is_global_room_moderator() from public, anon;
grant execute on function public.is_global_room_moderator() to authenticated;

create or replace function public.get_global_room_moderation_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  result jsonb;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'creators', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.created_at asc)
      from public.room_creator_profiles p
      where p.status = 'pending'
    ), '[]'::jsonb),
    'slots', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.scheduled_start asc)
      from public.relationship_room_slots s
      where s.status = 'pending'
        and s.moderation_status = 'unreviewed'
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_global_room_moderation_queue() from public, anon;
grant execute on function public.get_global_room_moderation_queue() to authenticated;

create or replace function public.review_global_room_creator(
  p_creator_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  reviewed public.room_creator_profiles%rowtype;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  if p_decision not in ('approved','rejected','suspended') then
    raise exception 'Invalid creator moderation decision.' using errcode = '22023';
  end if;

  update public.room_creator_profiles
  set status = p_decision,
      updated_at = now()
  where id = p_creator_id
  returning * into reviewed;

  if reviewed.id is null then
    raise exception 'Creator profile not found.' using errcode = 'P0002';
  end if;

  insert into private.global_room_moderation_audit (
    actor_user_id, target_type, target_id, decision
  ) values (
    (select auth.uid()), 'creator', p_creator_id, p_decision
  );

  return to_jsonb(reviewed);
end;
$$;

revoke all on function public.review_global_room_creator(uuid,text) from public, anon;
grant execute on function public.review_global_room_creator(uuid,text) to authenticated;

create or replace function public.review_global_room_slot(
  p_slot_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  reviewed public.relationship_room_slots%rowtype;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  if p_decision not in ('approved','rejected') then
    raise exception 'Invalid programming moderation decision.' using errcode = '22023';
  end if;

  if p_decision = 'approved' then
    update public.relationship_room_slots
    set moderation_status = 'approved',
        status = 'scheduled',
        updated_at = now()
    where id = p_slot_id
      and status = 'pending'
      and moderation_status = 'unreviewed'
      and scheduled_end > now()
    returning * into reviewed;
  else
    update public.relationship_room_slots
    set moderation_status = 'rejected',
        status = 'removed',
        updated_at = now()
    where id = p_slot_id
      and status = 'pending'
      and moderation_status = 'unreviewed'
    returning * into reviewed;
  end if;

  if reviewed.id is null then
    raise exception 'Programming slot is unavailable for that moderation action.' using errcode = 'P0002';
  end if;

  insert into private.global_room_moderation_audit (
    actor_user_id, target_type, target_id, decision, details
  ) values (
    (select auth.uid()), 'slot', p_slot_id, p_decision,
    jsonb_build_object('title', reviewed.title, 'scheduled_start', reviewed.scheduled_start)
  );

  return to_jsonb(reviewed);
end;
$$;

revoke all on function public.review_global_room_slot(uuid,text) from public, anon;
grant execute on function public.review_global_room_slot(uuid,text) to authenticated;

comment on table private.global_room_moderators is
'Trusted O2OL Global Relationship Room moderators. No row is added automatically; initial moderator assignment is an explicit owner-controlled bootstrap action.';

comment on table private.global_room_moderation_audit is
'Append-only audit history for Global Relationship Room creator and programming moderation decisions.';
