-- One2OneLove programming reminder cancellation integrity.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on:
--   1. 20260819_creator_programming_calendar.sql
--   2. 20260819_programming_reminders.sql
--
-- If a scheduled creator/O2OL program is cancelled before the reminder dispatcher
-- claims a member reminder, cancel the still-active reminder immediately. A reminder
-- already in `processing` is intentionally left alone: the dispatcher re-checks the
-- programming slot after claim and will cancel delivery if the slot is no longer booked.

begin;

create or replace function public.cancel_active_programming_reminders_for_closed_slot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'booked' and new.status <> 'booked' then
    update public.programming_reminders
    set status = 'cancelled'
    where slot_id = new.id
      and status = 'active';
  end if;

  return new;
end;
$$;

revoke all on function public.cancel_active_programming_reminders_for_closed_slot() from public, anon, authenticated;

drop trigger if exists creator_programming_cancel_active_reminders
  on public.creator_programming_slots;

create trigger creator_programming_cancel_active_reminders
after update of status on public.creator_programming_slots
for each row
when (old.status is distinct from new.status)
execute function public.cancel_active_programming_reminders_for_closed_slot();

comment on function public.cancel_active_programming_reminders_for_closed_slot() is
  'Cancels only still-active member programming reminders when a booked program is cancelled/completed. Processing reminders remain dispatcher-controlled to avoid a cancellation race.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_PROGRAMMING_REMINDERS_ENABLED=false and PROGRAMMING_REMINDERS_ENABLED=false.
-- 2. Apply only after both prerequisite 20260819 migrations exist in the target environment.
-- 3. Verify booked -> cancelled sets only active reminder rows to cancelled.
-- 4. Verify booked -> completed also sets only active reminder rows to cancelled.
-- 5. Verify processing/sent/cancelled reminder rows are unchanged by this trigger.
-- 6. Verify the dispatcher still re-checks slot.status after claiming a processing row.
