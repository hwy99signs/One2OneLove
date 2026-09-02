-- One2OneLove Live Room write-identity hardening.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase without the applicable
-- production approval. Depends on 20260817_live_room_messaging.sql and
-- 20260817_live_room_moderation.sql.
--
-- Browser writes should provide content/routing intent only. Account identity and member
-- message type are derived from auth.uid() at the database boundary before RLS checks.

begin;

create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon;

-- Replace the original public message-identity helper with a non-exposed helper. The
-- browser no longer needs INSERT privilege for user_id, sender_name or message_type.
create or replace function o2ol_private.set_room_member_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  profile_name text;
  caller_id uuid;
begin
  caller_id := (select auth.uid());
  if caller_id is null then
    raise exception using errcode = '42501', message = 'O2OL_ROOM_AUTH_REQUIRED';
  end if;

  new.user_id := caller_id;
  new.message_type := 'member';

  select nullif(trim(u.name), '')
    into profile_name
    from public.users u
   where u.id = caller_id
   limit 1;

  new.sender_name := left(
    coalesce(profile_name, '@' || substr(md5(caller_id::text), 1, 10)),
    80
  );

  return new;
end;
$$;

revoke all on function o2ol_private.set_room_member_identity() from public, anon, authenticated;

drop function if exists public.set_room_member_identity() cascade;
drop trigger if exists set_room_member_identity on public.room_messages;
create trigger set_room_member_identity
before insert on public.room_messages
for each row execute function o2ol_private.set_room_member_identity();

-- Reaction ownership is also derived from the signed-in account. A member supplies only
-- the message and allowed emoji; the database supplies user_id.
create or replace function o2ol_private.set_room_reaction_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'O2OL_ROOM_AUTH_REQUIRED';
  end if;
  new.user_id := (select auth.uid());
  return new;
end;
$$;

revoke all on function o2ol_private.set_room_reaction_identity() from public, anon, authenticated;

drop trigger if exists set_room_reaction_identity on public.room_message_reactions;
create trigger set_room_reaction_identity
before insert on public.room_message_reactions
for each row execute function o2ol_private.set_room_reaction_identity();

-- Report ownership is derived from Auth as well. The private moderation queue remains
-- unreadable to members; this only removes reporter_id from the browser write contract.
create or replace function o2ol_private.set_room_report_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'O2OL_ROOM_AUTH_REQUIRED';
  end if;
  new.reporter_id := (select auth.uid());
  new.status := 'pending';
  new.reviewed_at := null;
  return new;
end;
$$;

revoke all on function o2ol_private.set_room_report_identity() from public, anon, authenticated;

drop trigger if exists set_room_report_identity on public.room_message_reports;
create trigger set_room_report_identity
before insert on public.room_message_reports
for each row execute function o2ol_private.set_room_report_identity();

-- Narrow INSERT privileges to the member-authored fields only. SELECT/DELETE grants and
-- the existing own-row/blocking RLS policies remain unchanged.
revoke insert on table public.room_messages from authenticated;
grant insert (room_slug, content) on table public.room_messages to authenticated;

revoke insert on table public.room_message_reactions from authenticated;
grant insert (message_id, emoji) on table public.room_message_reactions to authenticated;

revoke insert on table public.room_message_reports from authenticated;
grant insert (message_id, reason, details) on table public.room_message_reports to authenticated;

comment on function o2ol_private.set_room_member_identity() is
  'Private Live Room message identity trigger: derives user_id, sender_name and member message type from auth.uid().';
comment on function o2ol_private.set_room_reaction_identity() is
  'Private Live Room reaction identity trigger: derives user_id from auth.uid().';
comment on function o2ol_private.set_room_report_identity() is
  'Private Live Room report identity trigger: derives reporter_id and pending moderation state from auth.uid().';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Verify authenticated INSERT with only room_slug/content succeeds and identity is derived.
-- 2. Verify browser attempts to submit room_messages.user_id/sender_name/message_type fail at grants.
-- 3. Verify reaction INSERT with only message_id/emoji succeeds and user_id is derived.
-- 4. Verify report INSERT with only message_id/reason/details succeeds and reporter_id is derived.
-- 5. Verify reports about one's own message remain rejected by the existing RLS policy.
-- 6. Verify blocked-pair RLS remains effective for messages/reactions after this migration.
-- 7. Verify public/anon/authenticated cannot execute any o2ol_private identity helper directly.
