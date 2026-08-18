-- One2OneLove Live Community sender-identity hardening.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
-- Browser clients should never be able to impersonate another display name in a room,
-- and room display names should never be derived from private account email.

begin;

alter table public.room_messages
  drop constraint if exists room_messages_sender_name_length;

alter table public.room_messages
  add constraint room_messages_sender_name_length
  check (char_length(trim(sender_name)) between 1 and 80);

alter table public.room_messages
  drop constraint if exists room_messages_room_slug_allowed;

alter table public.room_messages
  add constraint room_messages_room_slug_allowed
  check (room_slug in (
    'vent-room',
    'modern-dating-unfiltered',
    'love-talk',
    'marriage-matters',
    'starting-over'
  ));

create or replace function public.set_room_member_identity()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_name text;
  metadata_name text;
begin
  -- Host/system records are reserved for trusted server-side writes. The room_messages
  -- INSERT RLS policy separately restricts authenticated browser clients to `member`.
  if new.message_type <> 'member' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required for member room messages';
  end if;

  new.user_id := auth.uid();

  select nullif(trim(u.name), '')
    into profile_name
    from public.users u
   where u.id = auth.uid()
   limit 1;

  if profile_name is null then
    select nullif(trim(coalesce(au.raw_user_meta_data ->> 'name', '')), '')
      into metadata_name
      from auth.users au
     where au.id = auth.uid()
     limit 1;
  end if;

  -- Do not fall back to the email address or its local part in a public room.
  new.sender_name := left(coalesce(profile_name, metadata_name, 'Member'), 80);

  return new;
end;
$$;

revoke all on function public.set_room_member_identity() from public;

drop trigger if exists set_room_member_identity on public.room_messages;
create trigger set_room_member_identity
before insert on public.room_messages
for each row execute function public.set_room_member_identity();

comment on function public.set_room_member_identity() is
  'For member-authored Live Room messages, derives user_id and public sender_name from authenticated profile/metadata; never trusts browser identity or derives a public name from email.';

commit;
