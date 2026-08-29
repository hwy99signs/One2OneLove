-- O2OL Global Relationship Room replay management
-- Trusted moderator-only replay discovery and scheduling.

create or replace function public.get_global_room_replay_sources()
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

  select coalesce(jsonb_agg(to_jsonb(s) order by s.scheduled_end desc), '[]'::jsonb)
  into result
  from (
    select *
    from public.relationship_room_slots
    where moderation_status = 'approved'
      and status not in ('cancelled','removed')
      and scheduled_end < now()
      and program_type <> 'replay'
    order by scheduled_end desc
    limit 50
  ) s;

  return result;
end;
$$;

revoke all on function public.get_global_room_replay_sources() from public, anon;
grant execute on function public.get_global_room_replay_sources() to authenticated;

create or replace function public.schedule_global_room_replay(
  p_source_slot_id uuid,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  source_slot public.relationship_room_slots%rowtype;
  replay_slot public.relationship_room_slots%rowtype;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  if p_scheduled_start <= now() then
    raise exception 'Replay must be scheduled in the future.' using errcode = '22023';
  end if;

  if p_scheduled_end <= p_scheduled_start then
    raise exception 'Replay end time must be after start time.' using errcode = '22023';
  end if;

  select * into source_slot
  from public.relationship_room_slots
  where id = p_source_slot_id
    and moderation_status = 'approved'
    and status not in ('cancelled','removed')
    and scheduled_end < now()
    and program_type <> 'replay';

  if source_slot.id is null then
    raise exception 'Eligible replay source not found.' using errcode = 'P0002';
  end if;

  insert into public.relationship_room_slots (
    creator_id,
    owner_user_id,
    title,
    description,
    program_type,
    scheduled_start,
    scheduled_end,
    source_slot_id,
    status,
    moderation_status,
    disclaimer_required
  ) values (
    source_slot.creator_id,
    null,
    coalesce(nullif(btrim(p_title), ''), source_slot.title),
    source_slot.description,
    'replay',
    p_scheduled_start,
    p_scheduled_end,
    source_slot.id,
    'scheduled',
    'approved',
    source_slot.disclaimer_required
  ) returning * into replay_slot;

  insert into private.global_room_moderation_audit (
    actor_user_id, target_type, target_id, decision, details
  ) values (
    (select auth.uid()),
    'slot',
    replay_slot.id,
    'replay_scheduled',
    jsonb_build_object(
      'source_slot_id', source_slot.id,
      'source_title', source_slot.title,
      'scheduled_start', replay_slot.scheduled_start,
      'scheduled_end', replay_slot.scheduled_end
    )
  );

  return to_jsonb(replay_slot);
end;
$$;

revoke all on function public.schedule_global_room_replay(uuid,timestamptz,timestamptz,text) from public, anon;
grant execute on function public.schedule_global_room_replay(uuid,timestamptz,timestamptz,text) to authenticated;
