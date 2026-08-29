-- O2OL Global Relationship Room cancellation operations metric
-- Extends the moderator-only operations summary with open creator cancellation requests.

create or replace function public.get_global_room_ops_summary()
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

  select jsonb_build_object(
    'pending_creators', (select count(*) from public.room_creator_profiles where status = 'pending'),
    'pending_programs', (select count(*) from public.relationship_room_slots where status = 'pending' and moderation_status = 'unreviewed'),
    'open_reports', (select count(*) from public.relationship_room_reports where status = 'open'),
    'open_cancellations', (select count(*) from public.relationship_room_cancellation_requests where status = 'open'),
    'live_now', (select count(*) from public.relationship_room_slots where moderation_status = 'approved' and status not in ('cancelled','removed') and scheduled_start <= now() and scheduled_end > now()),
    'next_24_hours', (select count(*) from public.relationship_room_slots where moderation_status = 'approved' and status in ('approved','scheduled','live') and scheduled_start > now() and scheduled_start <= now() + interval '24 hours'),
    'next_7_days', (select count(*) from public.relationship_room_slots where moderation_status = 'approved' and status in ('approved','scheduled','live') and scheduled_start > now() and scheduled_start <= now() + interval '7 days'),
    'approved_creators', (select count(*) from public.room_creator_profiles where status = 'approved')
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_global_room_ops_summary() from public, anon;
grant execute on function public.get_global_room_ops_summary() to authenticated;
