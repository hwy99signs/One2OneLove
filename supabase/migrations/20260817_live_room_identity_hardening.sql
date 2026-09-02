-- One2OneLove Live Community sender-identity hardening.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
-- Idempotent follow-up to the messaging foundation: preserve all six rooms, keep the
-- trigger SECURITY INVOKER, never trust browser identity, and never derive a public name from email.

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
    'global-relationship-room',
    'vent-room',
    'modern-dating-unfiltered',
    'love-talk',
    'marriage-matters',
    'starting-over'
  ));

create or replace function public.set_room_member_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  profile_name text;
begin
  -- Host/system records are reserved for trusted server-side writes. The room_messages
  -- INSERT RLS policy separately restricts authenticated browser clients to `member`.
  if new.message_type <> 'member' then
    return new;
  end if;

  if (select auth.uid()) is null then
    raise exception 'Authentication required for member room messages';
  end if;

  new.user_id := (select auth.uid());

  select nullif(trim(u.name), '')
    into profile_name
    from public.users u
   where u.id = (select auth.uid())
   limit 1;

  -- Do not fall back to the email address, metadata email, or its local part in a public room.
  -- The pseudonym is language-neutral and stable for the signed-in account.
  new.sender_name := left(
    coalesce(profile_name, '@' || substr(md5((select auth.uid())::text), 1, 10)),
    80
  );

  return new;
end;
$$;

revoke all on function public.set_room_member_identity() from public, anon, authenticated;

drop trigger if exists set_room_member_identity on public.room_messages;
create trigger set_room_member_identity
before insert on public.room_messages
for each row execute function public.set_room_member_identity();

comment on function public.set_room_member_identity() is
  'For member-authored Live Room messages, derives user_id and public sender_name from the authenticated account; SECURITY INVOKER; never trusts browser identity or derives public identity from email.';

commit;
