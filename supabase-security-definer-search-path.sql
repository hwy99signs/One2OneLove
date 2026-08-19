-- One2OneLove SECURITY DEFINER search-path hardening
-- Locks the search_path for remaining public SECURITY DEFINER functions that
-- did not already declare one. This preserves legacy unqualified public table
-- references while removing caller-controlled search-path behavior.

begin;

do $$
declare
  r record;
begin
  for r in
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) cfg
        where cfg like 'search_path=%'
      )
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = public, extensions',
      r.schema_name,
      r.function_name,
      r.identity_args
    );
  end loop;
end $$;

commit;
