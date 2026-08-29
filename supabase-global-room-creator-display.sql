-- O2OL Global Relationship Room creator display names
-- Denormalizes only the public creator/program display name into schedule rows so the public
-- schedule can identify approved creator programming without exposing creator profile records.

alter table public.relationship_room_slots
  add column if not exists creator_display_name text;

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

update public.relationship_room_slots s
set creator_display_name = p.display_name
from public.room_creator_profiles p
where s.creator_id = p.id
  and s.creator_display_name is distinct from p.display_name;

update public.relationship_room_slots
set creator_display_name = 'One2OneLove'
where creator_id is null
  and program_type = 'o2ol'
  and creator_display_name is distinct from 'One2OneLove';

revoke select on table public.relationship_room_slots from anon;
grant select (
  id, title, description, program_type, creator_display_name,
  scheduled_start, scheduled_end, status, moderation_status,
  disclaimer_required, source_slot_id
) on table public.relationship_room_slots to anon;
