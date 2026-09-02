-- One2OneLove programming reminder slot-validity guard.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on:
--   1. 20260819_creator_programming_calendar.sql
--   2. 20260819_programming_reminders.sql
--
-- This closes the race between backend slot validation and reminder persistence. An
-- `active` reminder must always reference a still-booked program that has not started,
-- and its remind_at value cannot fall after the program starts.

begin;

create or replace function public.enforce_active_programming_reminder_slot_validity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  slot_status text;
  slot_starts_at timestamptz;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select status, starts_at
    into slot_status, slot_starts_at
  from public.creator_programming_slots
  where id = new.slot_id
  for share;

  if not found then
    raise exception using
      errcode = '23503',
      message = 'PROGRAMMING_REMINDER_SLOT_NOT_FOUND';
  end if;

  if slot_status <> 'booked' then
    raise exception using
      errcode = 'P0001',
      message = 'PROGRAMMING_REMINDER_SLOT_NOT_BOOKED';
  end if;

  if slot_starts_at <= now() then
    raise exception using
      errcode = 'P0001',
      message = 'PROGRAMMING_REMINDER_SLOT_ALREADY_STARTED';
  end if;

  if new.remind_at > slot_starts_at then
    raise exception using
      errcode = '22007',
      message = 'PROGRAMMING_REMINDER_TIME_AFTER_START';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_active_programming_reminder_slot_validity() from public, anon, authenticated;

drop trigger if exists programming_reminders_validate_active_slot
  on public.programming_reminders;

create trigger programming_reminders_validate_active_slot
before insert or update of slot_id, remind_at, status
on public.programming_reminders
for each row
execute function public.enforce_active_programming_reminder_slot_validity();

comment on function public.enforce_active_programming_reminder_slot_validity() is
  'Database backstop: active programming reminders require a booked, future slot and a reminder time no later than slot start.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Apply only after both prerequisite 20260819 migrations exist.
-- 2. Verify active reminder insert succeeds for a booked future slot.
-- 3. Verify active reminder insert/update fails for cancelled/completed slots.
-- 4. Verify active reminder insert/update fails after slot start.
-- 5. Verify active reminder insert/update fails when remind_at is later than starts_at.
-- 6. Verify sent/cancelled/processing state updates do not re-run future-slot validity rules.
