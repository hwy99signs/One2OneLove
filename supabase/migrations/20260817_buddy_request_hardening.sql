-- One2OneLove relaunch: buddy/friend request hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Closes legacy row-policy gaps where a sender could create an already-accepted request
-- and a receiver could rewrite request identity/timestamps while updating status.

begin;

alter table public.buddy_requests enable row level security;

create or replace function public.enforce_buddy_request_boundaries()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() is null or auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if tg_op = 'INSERT' then
    new.from_user_id := auth.uid();
    new.status := 'pending';
    new.created_at := now();
    new.updated_at := now();
    if new.to_user_id = auth.uid() then
      raise exception 'You cannot send a buddy request to yourself';
    end if;
    return new;
  end if;

  if auth.uid() <> old.to_user_id then
    raise exception 'Only the request recipient may accept or reject this request';
  end if;

  if old.status <> 'pending' then
    raise exception 'Only pending buddy requests may be changed';
  end if;

  if new.id is distinct from old.id
     or new.from_user_id is distinct from old.from_user_id
     or new.to_user_id is distinct from old.to_user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Buddy request identity fields are immutable';
  end if;

  if new.status not in ('accepted', 'rejected') then
    raise exception 'Pending buddy requests may only be accepted or rejected';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_buddy_request_boundaries() from public;

drop trigger if exists aaa_enforce_buddy_request_boundaries on public.buddy_requests;
create trigger aaa_enforce_buddy_request_boundaries
before insert or update on public.buddy_requests
for each row execute function public.enforce_buddy_request_boundaries();

-- Normalize policies around the trigger-derived identity/state.
drop policy if exists "Users can create buddy requests" on public.buddy_requests;
create policy "Users can create buddy requests"
on public.buddy_requests
for insert
to authenticated
with check (auth.uid() = from_user_id and status = 'pending');

drop policy if exists "Users can update received requests" on public.buddy_requests;
create policy "Users can update received requests"
on public.buddy_requests
for update
to authenticated
using (auth.uid() = to_user_id and status = 'pending')
with check (auth.uid() = to_user_id and status in ('accepted','rejected'));

drop policy if exists "Users can delete own sent requests" on public.buddy_requests;
create policy "Users can delete own sent requests"
on public.buddy_requests
for delete
to authenticated
using (auth.uid() = from_user_id and status = 'pending');

comment on function public.enforce_buddy_request_boundaries() is
  'Derives sender/pending state on insert and permits the recipient only one pending-to-accepted/rejected transition without identity rewriting.';

commit;

-- CONTROLLED TESTS
-- 1. Browser-supplied from_user_id/status are replaced with auth.uid()/pending.
-- 2. Self-request is rejected.
-- 3. Only recipient can move pending -> accepted or pending -> rejected.
-- 4. Recipient cannot rewrite sender/recipient/id/created_at.
-- 5. Accepted/rejected requests cannot be changed again.
-- 6. Sender can cancel only a pending request.
