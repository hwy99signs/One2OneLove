-- O2OL Global Relationship Room active-program controls
-- Moderator-only schedule visibility and emergency/operational removal.

create or replace function public.get_global_room_active_programs()
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

  select coalesce(jsonb_agg(to_jsonb(s) order by s.scheduled_start asc), '[]'::jsonb)
  into result
  from (
    select *
    from public.relationship_room_slots
    where moderation_status = 'approved'
      and status in ('approved','scheduled','live')
      and scheduled_end > now()
    order by scheduled_start asc
    limit 200
  ) s;

  return result;
end;
$$;

revoke all on function public.get_global_room_active_programs() from public, anon;
grant execute on function public.get_global_room_active_programs() to authenticated;

create or replace function public.remove_global_room_program(
  p_slot_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  removed_slot public.relationship_room_slots%rowtype;
  reason_text text;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  reason_text := left(coalesce(nullif(btrim(p_reason), ''), 'Removed by Global Room moderator.'), 1000);

  update public.relationship_room_slots
  set status = 'removed',
      moderation_status = 'flagged',
      updated_at = now()
  where id = p_slot_id
    and status in ('pending','approved','scheduled','live')
  returning * into removed_slot;

  if removed_slot.id is null then
    raise exception 'Programming slot is unavailable for removal.' using errcode = 'P0002';
  end if;

  insert into private.global_room_moderation_audit (
    actor_user_id, target_type, target_id, decision, details
  ) values (
    (select auth.uid()),
    'slot',
    removed_slot.id,
    'removed',
    jsonb_build_object(
      'title', removed_slot.title,
      'program_type', removed_slot.program_type,
      'scheduled_start', removed_slot.scheduled_start,
      'reason', reason_text
    )
  );

  return to_jsonb(removed_slot);
end;
$$;

revoke all on function public.remove_global_room_program(uuid,text) from public, anon;
grant execute on function public.remove_global_room_program(uuid,text) to authenticated;
