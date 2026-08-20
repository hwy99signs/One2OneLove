-- One2OneLove support-response read state.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_support_requests.sql.
--
-- This adds a private per-request read receipt for the member-facing staff response. It
-- supports in-app header notifications without email/SMS/push or a second message store.

begin;

alter table public.support_requests
  add column if not exists member_response_read_at timestamptz null;

create or replace function public.reset_support_response_read_state()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.staff_response is distinct from old.staff_response
    or new.responded_at is distinct from old.responded_at then
    new.member_response_read_at = null;
  end if;
  return new;
end;
$$;

revoke all on function public.reset_support_response_read_state() from public, anon, authenticated;

drop trigger if exists support_requests_reset_response_read on public.support_requests;
create trigger support_requests_reset_response_read
before update of staff_response, responded_at on public.support_requests
for each row execute function public.reset_support_response_read_state();

comment on column public.support_requests.member_response_read_at is
  'Private member read receipt for the current staff_response. Reset to null whenever the staff response changes.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Apply after 20260819_support_requests.sql.
-- 2. Verify a new/changed staff response resets member_response_read_at to null.
-- 3. Verify reading a response can set member_response_read_at through the reviewed member backend action only.
-- 4. Verify no browser direct UPDATE grant is added for this field.
-- 5. Keep support notifications in-app only unless a separate external-delivery approval is granted.
