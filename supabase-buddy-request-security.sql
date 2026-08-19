-- One2OneLove buddy request security hardening

begin;

alter table public.buddy_requests enable row level security;
revoke all on table public.buddy_requests from anon;
revoke all on table public.buddy_requests from authenticated;
grant select, insert, update, delete on table public.buddy_requests to authenticated;

-- Eliminate duplicate active connections regardless of request direction.
create unique index if not exists buddy_requests_one_active_pair
on public.buddy_requests (
  least(from_user_id, to_user_id),
  greatest(from_user_id, to_user_id)
)
where status in ('pending', 'accepted');

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='buddy_requests'
  loop execute format('drop policy if exists %I on public.buddy_requests', r.policyname); end loop;
end $$;

create policy "buddy participants can read requests"
on public.buddy_requests
for select
to authenticated
using ((select auth.uid()) in (from_user_id, to_user_id));

create policy "members can send own buddy requests"
on public.buddy_requests
for insert
to authenticated
with check (
  (select auth.uid()) = from_user_id
  and from_user_id <> to_user_id
  and status = 'pending'
);

create policy "recipients can review pending buddy requests"
on public.buddy_requests
for update
to authenticated
using (
  (select auth.uid()) = to_user_id
  and status = 'pending'
)
with check (
  (select auth.uid()) = to_user_id
  and status in ('accepted', 'rejected')
);

create policy "senders can cancel pending buddy requests"
on public.buddy_requests
for delete
to authenticated
using (
  (select auth.uid()) = from_user_id
  and status = 'pending'
);

create or replace function public.protect_buddy_request_fields()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.from_user_id := v_actor;
    if new.to_user_id is null or new.to_user_id = v_actor then
      raise exception 'invalid buddy request recipient' using errcode='42501';
    end if;
    if not exists (select 1 from public.user_directory_profiles d where d.id = new.to_user_id) then
      raise exception 'buddy request recipient not found' using errcode='23503';
    end if;
    new.status := 'pending';
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, new.created_at, now());
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if v_actor <> old.to_user_id or old.status <> 'pending' then
      raise exception 'not authorized' using errcode='42501';
    end if;
    if new.status not in ('accepted','rejected') then
      raise exception 'invalid buddy request decision' using errcode='22023';
    end if;
    new.id := old.id;
    new.from_user_id := old.from_user_id;
    new.to_user_id := old.to_user_id;
    new.created_at := old.created_at;
    new.updated_at := now();
    return new;
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_buddy_request_fields() from public, anon, authenticated;
drop trigger if exists protect_buddy_request_fields on public.buddy_requests;
create trigger protect_buddy_request_fields
before insert or update on public.buddy_requests
for each row execute function public.protect_buddy_request_fields();

commit;
