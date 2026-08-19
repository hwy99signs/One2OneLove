-- O2OL Global Relationship Room launch verification v2
-- Read-only verification for the latest room, moderation, reporting, and operations schema.

-- 1. RLS must be enabled on every exposed Global Room table.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'room_creator_profiles',
    'relationship_room_slots',
    'relationship_room_reports'
  )
order by c.relname;

-- Expected: every rls_enabled value = true.

-- 2. Anonymous users may read only the approved public programming surface.
select
  has_table_privilege('anon','public.room_creator_profiles','select') as anon_creator_profile_select,
  has_column_privilege('anon','public.relationship_room_slots','creator_display_name','select') as anon_public_presenter_name,
  has_column_privilege('anon','public.relationship_room_slots','owner_user_id','select') as anon_owner_user_id,
  has_table_privilege('anon','public.relationship_room_reports','select') as anon_reports_select,
  has_table_privilege('anon','public.relationship_room_reports','insert') as anon_reports_insert;

-- Expected: false, true, false, false, false.

-- 3. Signed-in browser clients may not change administrative creator/program/report state.
select
  has_column_privilege('authenticated','public.room_creator_profiles','status','update') as creator_status_update,
  has_column_privilege('authenticated','public.room_creator_profiles','plan','update') as creator_plan_update,
  has_column_privilege('authenticated','public.room_creator_profiles','daily_slot_limit','update') as creator_limit_update,
  has_column_privilege('authenticated','public.relationship_room_slots','moderation_status','update') as slot_moderation_update,
  has_column_privilege('authenticated','public.relationship_room_slots','disclaimer_required','update') as disclaimer_update,
  has_column_privilege('authenticated','public.relationship_room_reports','status','update') as report_status_update;

-- Expected: all false.

-- 4. Critical room constraints.
select conname
from pg_constraint
where conrelid in (
  'public.room_creator_profiles'::regclass,
  'public.relationship_room_slots'::regclass,
  'public.relationship_room_reports'::regclass
)
and conname in (
  'relationship_room_no_active_overlap',
  'room_slot_valid_time',
  'room_creator_display_name_length',
  'room_creator_bio_length',
  'room_slot_title_length',
  'room_slot_description_length',
  'relationship_room_report_details_length',
  'relationship_room_report_once'
)
order by conname;

-- 5. Critical triggers.
select c.relname as table_name, t.tgname as trigger_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and t.tgname in (
    'enforce_room_creator_daily_limit',
    'populate_room_creator_display_name',
    'sync_room_creator_display_name',
    'validate_room_creator_timezone',
    'enforce_room_creator_status_on_programming'
  )
order by c.relname, t.tgname;

-- 6. Required indexes.
select schemaname, tablename, indexname
from pg_indexes
where indexname in (
  'idx_room_creator_profiles_user',
  'idx_room_slots_schedule',
  'idx_room_slots_creator_day',
  'idx_room_slots_owner',
  'idx_room_slots_status',
  'idx_room_slots_source_slot',
  'idx_room_reports_status_created',
  'idx_room_reports_reporter',
  'idx_global_room_moderators_added_by',
  'idx_global_room_moderation_audit_actor'
)
order by schemaname, tablename, indexname;

-- 7. Operational RPCs should be SECURITY DEFINER because they read private moderator/audit
-- state, and each implementation must perform its own trusted-moderator check.
select n.nspname as schema_name, p.proname, p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_global_room_moderator',
    'get_global_room_moderation_queue',
    'review_global_room_creator',
    'review_global_room_slot',
    'get_global_room_replay_sources',
    'schedule_global_room_replay',
    'get_global_room_active_programs',
    'remove_global_room_program',
    'get_global_room_moderation_audit',
    'schedule_global_room_official_program',
    'get_global_room_report_queue',
    'review_global_room_report',
    'get_global_room_ops_summary'
  )
order by p.proname;

-- 8. Reporter privacy: report-queue function source must not expose reporter_user_id.
select position('reporter_user_id' in pg_get_functiondef(p.oid)) = 0 as report_queue_hides_reporter_id
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_global_room_report_queue';

-- Expected: true.

-- 9. Creator scheduling policy must block past-time direct API submissions.
select policyname, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'relationship_room_slots'
  and policyname in (
    'creators can submit own room slots',
    'creators can update own nonlive room slots'
  )
order by policyname;

-- Review with_check for scheduled_start > now().

-- 10. Moderator assignment is explicit. Before owner activation this stays zero.
select count(*) as assigned_global_room_moderators
from private.global_room_moderators;

-- 11. Operational queue snapshot should execute only for a trusted moderator. The function
-- exists now even though the initial moderator bootstrap remains owner-controlled.
select jsonb_build_object(
  'creator_profiles', (select count(*) from public.room_creator_profiles),
  'room_slots', (select count(*) from public.relationship_room_slots),
  'viewer_reports', (select count(*) from public.relationship_room_reports)
) as global_room_row_counts;
