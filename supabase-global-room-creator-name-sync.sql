-- O2OL Global Relationship Room creator display-name synchronization
-- Keeps future/active schedule labels aligned when an approved creator edits their public name.

create or replace function private.sync_room_creator_display_name()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.display_name is distinct from old.display_name then
    update public.relationship_room_slots
    set creator_display_name = new.display_name,
        updated_at = now()
    where creator_id = new.id
      and status not in ('completed','cancelled','removed');
  end if;
  return new;
end;
$$;

revoke all on function private.sync_room_creator_display_name() from public, anon, authenticated;

drop trigger if exists sync_room_creator_display_name on public.room_creator_profiles;
create trigger sync_room_creator_display_name
after update of display_name
on public.room_creator_profiles
for each row execute function private.sync_room_creator_display_name();
