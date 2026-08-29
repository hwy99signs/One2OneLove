-- O2OL Global Relationship Room privileged API lockdown
-- Defense-in-depth pass for moderator/operations RPCs and internal authorization tables.
-- Existing explicit authenticated EXECUTE grants remain in place; default PUBLIC/anon
-- execution is removed from privileged Global Room functions.

revoke all on table public.global_room_moderators from anon, authenticated;
revoke all on table public.global_room_moderation_audit from anon, authenticated;

-- These functions are invoked only by authenticated O2OL users and perform their own
-- ownership/moderator checks. Never leave them callable through the default PUBLIC grant.
do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as function_identity
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'is_global_room_moderator',
        'get_global_room_moderation_queue',
        'moderate_global_room_creator',
        'moderate_global_room_slot',
        'get_global_room_replay_sources',
        'schedule_global_room_replay',
        'remove_global_room_program',
        'schedule_global_room_official_program',
        'get_global_room_moderation_audit',
        'get_global_room_report_queue',
        'review_global_room_report',
        'get_global_room_ops_summary',
        'get_global_room_cancellation_queue',
        'review_global_room_cancellation_request'
      )
  loop
    execute format('revoke execute on function %s from public, anon', function_record.function_identity);
  end loop;
end $$;

comment on table public.global_room_moderators is
'Private authorization registry for trusted O2OL Global Relationship Room moderators. Direct browser table access is revoked; clients use guarded RPCs.';

comment on table public.global_room_moderation_audit is
'Private Global Relationship Room moderation audit trail. Direct browser table access is revoked; trusted moderators use guarded audit RPCs.';
