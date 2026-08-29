-- O2OL Global Relationship Room input hardening
-- Mirrors browser limits at the database boundary so direct Data API calls cannot bypass them.

do $$
begin
  if not exists (select 1 from pg_constraint where conname='room_creator_display_name_length' and conrelid='public.room_creator_profiles'::regclass) then
    alter table public.room_creator_profiles
      add constraint room_creator_display_name_length
      check (char_length(btrim(display_name)) between 1 and 120);
  end if;

  if not exists (select 1 from pg_constraint where conname='room_creator_bio_length' and conrelid='public.room_creator_profiles'::regclass) then
    alter table public.room_creator_profiles
      add constraint room_creator_bio_length
      check (bio is null or char_length(bio) <= 1200);
  end if;

  if not exists (select 1 from pg_constraint where conname='room_slot_title_length' and conrelid='public.relationship_room_slots'::regclass) then
    alter table public.relationship_room_slots
      add constraint room_slot_title_length
      check (char_length(btrim(title)) between 1 and 160);
  end if;

  if not exists (select 1 from pg_constraint where conname='room_slot_description_length' and conrelid='public.relationship_room_slots'::regclass) then
    alter table public.relationship_room_slots
      add constraint room_slot_description_length
      check (description is null or char_length(description) <= 2000);
  end if;
end $$;

create or replace function private.validate_room_creator_timezone()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.timezone is null or btrim(new.timezone) = '' then
    raise exception 'Creator timezone is required.' using errcode='23514';
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Creator timezone is invalid.' using errcode='23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_room_creator_timezone() from public, anon, authenticated;

drop trigger if exists validate_room_creator_timezone on public.room_creator_profiles;
create trigger validate_room_creator_timezone
before insert or update of timezone
on public.room_creator_profiles
for each row execute function private.validate_room_creator_timezone();
