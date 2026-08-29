-- O2OL Global Relationship Room official programming
-- Moderator-only scheduling for One2OneLove-owned programming.

create or replace function public.schedule_global_room_official_program(
  p_title text,
  p_description text,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  scheduled_slot public.relationship_room_slots%rowtype;
  clean_title text;
  clean_description text;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  clean_title := btrim(coalesce(p_title, ''));
  clean_description := nullif(btrim(coalesce(p_description, '')), '');

  if char_length(clean_title) < 1 or char_length(clean_title) > 160 then
    raise exception 'Official program title must be between 1 and 160 characters.' using errcode = '22023';
  end if;

  if clean_description is not null and char_length(clean_description) > 2000 then
    raise exception 'Official program description must be 2000 characters or fewer.' using errcode = '22023';
  end if;

  if p_scheduled_start <= now() then
    raise exception 'Official programming must be scheduled in the future.' using errcode = '22023';
  end if;

  if p_scheduled_end <= p_scheduled_start then
    raise exception 'Program end time must be after start time.' using errcode = '22023';
  end if;

  insert into public.relationship_room_slots (
    creator_id,
    owner_user_id,
    title,
    description,
    program_type,
    creator_display_name,
    scheduled_start,
    scheduled_end,
    status,
    moderation_status,
    disclaimer_required
  ) values (
    null,
    null,
    clean_title,
    clean_description,
    'o2ol',
    'One2OneLove',
    p_scheduled_start,
    p_scheduled_end,
    'scheduled',
    'approved',
    false
  ) returning * into scheduled_slot;

  insert into private.global_room_moderation_audit (
    actor_user_id, target_type, target_id, decision, details
  ) values (
    (select auth.uid()),
    'slot',
    scheduled_slot.id,
    'official_scheduled',
    jsonb_build_object(
      'title', scheduled_slot.title,
      'scheduled_start', scheduled_slot.scheduled_start,
      'scheduled_end', scheduled_slot.scheduled_end
    )
  );

  return to_jsonb(scheduled_slot);
exception
  when exclusion_violation then
    raise exception 'That Global Room programming time is already occupied.' using errcode = '23P01';
end;
$$;

revoke all on function public.schedule_global_room_official_program(text,text,timestamptz,timestamptz) from public, anon;
grant execute on function public.schedule_global_room_official_program(text,text,timestamptz,timestamptz) to authenticated;
