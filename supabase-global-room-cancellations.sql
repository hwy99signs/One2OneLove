-- O2OL Global Relationship Room approved-program cancellation requests
-- Creators request cancellation; trusted moderators approve/deny so approved programming
-- cannot be removed directly from the browser without review.

create table if not exists public.relationship_room_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.relationship_room_slots(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  status text not null default 'open' check (status in ('open','approved','denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_cancellation_reason_length check (reason is null or char_length(reason) <= 1000)
);

create unique index if not exists idx_room_cancellation_one_open_per_slot
  on public.relationship_room_cancellation_requests (slot_id)
  where status = 'open';
create index if not exists idx_room_cancellation_requester
  on public.relationship_room_cancellation_requests (requester_user_id, created_at desc);
create index if not exists idx_room_cancellation_status_created
  on public.relationship_room_cancellation_requests (status, created_at asc);

alter table public.relationship_room_cancellation_requests enable row level security;
revoke all on table public.relationship_room_cancellation_requests from anon, authenticated;
grant select on table public.relationship_room_cancellation_requests to authenticated;
grant insert (slot_id, requester_user_id, reason)
  on table public.relationship_room_cancellation_requests to authenticated;

create policy "creators can submit own room cancellation requests"
on public.relationship_room_cancellation_requests
for insert
to authenticated
with check (
  (select auth.uid()) = requester_user_id
  and status = 'open'
  and exists (
    select 1
    from public.relationship_room_slots s
    where s.id = slot_id
      and s.owner_user_id = (select auth.uid())
      and s.status in ('approved','scheduled')
      and s.scheduled_end > now()
  )
);

create policy "creators can view own room cancellation requests"
on public.relationship_room_cancellation_requests
for select
to authenticated
using ((select auth.uid()) = requester_user_id);

create or replace function public.get_global_room_cancellation_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  result jsonb;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at asc), '[]'::jsonb)
  into result
  from (
    select
      r.id,
      r.slot_id,
      r.reason,
      r.status,
      r.created_at,
      s.title as program_title,
      s.creator_display_name,
      s.program_type,
      s.scheduled_start,
      s.scheduled_end,
      s.status as program_status
    from public.relationship_room_cancellation_requests r
    join public.relationship_room_slots s on s.id = r.slot_id
    where r.status = 'open'
    order by r.created_at asc
    limit 250
  ) q;

  return result;
end;
$$;

revoke all on function public.get_global_room_cancellation_queue() from public, anon;
grant execute on function public.get_global_room_cancellation_queue() to authenticated;

create or replace function public.review_global_room_cancellation_request(
  p_request_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  request_row public.relationship_room_cancellation_requests%rowtype;
  slot_row public.relationship_room_slots%rowtype;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  if p_decision not in ('approved','denied') then
    raise exception 'Invalid cancellation decision.' using errcode = '22023';
  end if;

  select * into request_row
  from public.relationship_room_cancellation_requests
  where id = p_request_id
    and status = 'open'
  for update;

  if request_row.id is null then
    raise exception 'Cancellation request is unavailable for review.' using errcode = 'P0002';
  end if;

  if p_decision = 'approved' then
    update public.relationship_room_slots
    set status = 'cancelled', updated_at = now()
    where id = request_row.slot_id
      and status in ('approved','scheduled')
      and scheduled_end > now()
    returning * into slot_row;

    if slot_row.id is null then
      raise exception 'Program is no longer eligible for creator cancellation.' using errcode = 'P0002';
    end if;
  else
    select * into slot_row from public.relationship_room_slots where id = request_row.slot_id;
  end if;

  update public.relationship_room_cancellation_requests
  set status = p_decision, updated_at = now()
  where id = request_row.id
  returning * into request_row;

  insert into private.global_room_moderation_audit (
    actor_user_id, target_type, target_id, decision, details
  ) values (
    (select auth.uid()), 'slot', request_row.slot_id, 'cancellation_' || p_decision,
    jsonb_build_object(
      'request_id', request_row.id,
      'title', slot_row.title,
      'scheduled_start', slot_row.scheduled_start,
      'reason', request_row.reason
    )
  );

  return to_jsonb(request_row);
end;
$$;

revoke all on function public.review_global_room_cancellation_request(uuid,text) from public, anon;
grant execute on function public.review_global_room_cancellation_request(uuid,text) to authenticated;
