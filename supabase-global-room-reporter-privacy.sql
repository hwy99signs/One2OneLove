-- O2OL Global Relationship Room report privacy hardening
-- Trusted moderators receive the report content and program context needed for review,
-- but not the reporting member's user ID.

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
