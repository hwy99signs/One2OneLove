-- O2OL Global Relationship Room verification checks
-- Read-only checks intended for post-migration review and launch readiness.

-- 1. RLS must be enabled on all public Global Room tables.
select relname, relrowsecurity
from pg_class
where oid in (
  'public.room_creator_profiles'::regclass,
  'public.relationship_room_slots'::regclass
)
order by relname;

-- 2. Anonymous clients must not read creator profile records or ownership IDs.
select
  has_table_privilege('anon','public.room_creator_profiles','select') as anon_creator_profile_table_select,
  has_column_privilege('anon','public.relationship_room_slots','creator_display_name','select') as anon_creator_display_select,
  has_column_privilege('anon','public.relationship_room_slots','owner_user_id','select') as anon_owner_user_select;

-- Expected: false, true, false.

-- 3. Authenticated browser clients must not be able to modify moderation/approval fields.
select
  has_column_privilege('authenticated','public.relationship_room_slots','moderation_status','update') as can_update_moderation,
  has_column_privilege('authenticated','public.room_creator_profiles','status','update') as can_update_creator_status,
  has_column_privilege('authenticated','public.room_creator_profiles','plan','update') as can_update_creator_plan,
  has_column_privilege('authenticated','public.room_creator_profiles','daily_slot_limit','update') as can_update_creator_limit;

-- Expected: all false.

-- 4. Critical scheduling constraints/triggers must exist.
select conname
from pg_constraint
where conrelid in (
  'public.room_creator_profiles'::regclass,
  'public.relationship_room_slots'::regclass
)
and conname in (
  'relationship_room_no_active_overlap',
  'room_slot_valid_time',
  'room_creator_display_name_length',
  'room_creator_bio_length',
  'room_slot_title_length',
  'room_slot_description_length'
)
order by conname;

select c.relname as table_name, t.tgname as trigger_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and t.tgname in (
    'enforce_room_creator_daily_limit',
    'populate_room_creator_display_name',
    'sync_room_creator_display_name',
    'validate_room_creator_timezone'
  )
order by c.relname, t.tgname;

-- 5. Required indexes must exist.
select schemaname, tablename, indexname
from pg_indexes
where indexname in (
  'idx_room_creator_profiles_user',
  'idx_room_slots_schedule',
  'idx_room_slots_creator_day',
  'idx_room_slots_owner',
  'idx_room_slots_status',
  'idx_room_slots_source_slot',
  'idx_global_room_moderators_added_by',
  'idx_global_room_moderation_audit_actor'
)
order by schemaname, tablename, indexname;

-- 6. Trusted operational functions should be SECURITY DEFINER and rely on their own
-- moderator-registry checks; ordinary table access to private moderator/audit tables remains revoked.
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
    'schedule_global_room_official_program'
  )
order by p.proname;

-- 7. Moderator assignment is explicit. Before owner activation this count should remain zero.
select count(*) as assigned_global_room_moderators
from private.global_room_moderators;
