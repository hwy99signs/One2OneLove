-- O2OL Global Relationship Room viewer reporting
-- Authenticated viewers may report approved programming once per program; trusted moderators review reports.

create table if not exists public.relationship_room_reports (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.relationship_room_slots(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('misleading','harassment','hate','sexual_content','self_harm','violence','spam','other')),
  details text,
  status text not null default 'open' check (status in ('open','reviewed','actioned','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_room_report_details_length check (details is null or char_length(details) <= 1000),
  constraint relationship_room_report_once unique (slot_id, reporter_user_id)
);

create index if not exists idx_room_reports_status_created
  on public.relationship_room_reports (status, created_at desc);
create index if not exists idx_room_reports_reporter
  on public.relationship_room_reports (reporter_user_id, created_at desc);

alter table public.relationship_room_reports enable row level security;

revoke all on table public.relationship_room_reports from anon, authenticated;
grant select on table public.relationship_room_reports to authenticated;
grant insert (slot_id, reporter_user_id, reason, details)
  on table public.relationship_room_reports to authenticated;

create policy "users can submit own room reports"
on public.relationship_room_reports
for insert
to authenticated
with check (
  (select auth.uid()) = reporter_user_id
  and status = 'open'
  and exists (
    select 1
    from public.relationship_room_slots s
    where s.id = slot_id
      and s.moderation_status = 'approved'
      and s.status in ('approved','scheduled','live','completed')
  )
);

create policy "users can view own room reports"
on public.relationship_room_reports
for select
to authenticated
using ((select auth.uid()) = reporter_user_id);

create or replace function public.get_global_room_report_queue()
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

  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at asc), '[]'::jsonb)
  into result
  from (
    select
      rr.id,
      rr.slot_id,
      rr.reporter_user_id,
      rr.reason,
      rr.details,
      rr.status,
      rr.created_at,
      s.title as program_title,
      s.program_type,
      s.creator_display_name,
      s.scheduled_start,
      s.status as program_status
    from public.relationship_room_reports rr
    join public.relationship_room_slots s on s.id = rr.slot_id
    where rr.status = 'open'
    order by rr.created_at asc
    limit 250
  ) r;

  return result;
end;
$$;

revoke all on function public.get_global_room_report_queue() from public, anon;
grant execute on function public.get_global_room_report_queue() to authenticated;

create or replace function public.review_global_room_report(
  p_report_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  reviewed public.relationship_room_reports%rowtype;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  if p_decision not in ('reviewed','actioned','dismissed') then
    raise exception 'Invalid report decision.' using errcode = '22023';
  end if;

  update public.relationship_room_reports
  set status = p_decision,
      updated_at = now()
  where id = p_report_id
    and status = 'open'
  returning * into reviewed;

  if reviewed.id is null then
    raise exception 'Report is unavailable for review.' using errcode = 'P0002';
  end if;

  insert into private.global_room_moderation_audit (
    actor_user_id, target_type, target_id, decision, details
  ) values (
    (select auth.uid()),
    'slot',
    reviewed.slot_id,
    'report_' || p_decision,
    jsonb_build_object('report_id', reviewed.id, 'reason', reviewed.reason)
  );

  return to_jsonb(reviewed);
end;
$$;

revoke all on function public.review_global_room_report(uuid,text) from public, anon;
grant execute on function public.review_global_room_report(uuid,text) to authenticated;

comment on table public.relationship_room_reports is
'Authenticated viewer reports for approved Global Relationship Room programming. Each account may report a program once; moderators review reports through trusted RPCs.';
