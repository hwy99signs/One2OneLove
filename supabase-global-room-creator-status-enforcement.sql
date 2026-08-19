-- O2OL Global Relationship Room creator-status enforcement
-- Suspended or rejected creators cannot retain future/pending programming in the public room.

create or replace function private.enforce_room_creator_status_on_programming()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('suspended','rejected') then
    update public.relationship_room_slots
    set status = 'removed',
        moderation_status = 'flagged',
        updated_at = now()
    where creator_id = new.id
      and scheduled_end > now()
      and status in ('draft','pending','approved','scheduled','live');
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_room_creator_status_on_programming() from public, anon, authenticated;

drop trigger if exists enforce_room_creator_status_on_programming on public.room_creator_profiles;
create trigger enforce_room_creator_status_on_programming
after update of status
on public.room_creator_profiles
for each row execute function private.enforce_room_creator_status_on_programming();
