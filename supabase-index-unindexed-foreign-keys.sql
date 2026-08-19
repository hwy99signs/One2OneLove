-- One2OneLove foreign-key performance hardening
-- Adds a supporting btree index only when a public-schema FK has no existing
-- valid non-partial index covering all FK columns.

begin;

do $$
declare
  r record;
  v_columns text;
  v_index_name text;
begin
  for r in
    select
      c.oid as constraint_oid,
      c.conname,
      c.conrelid,
      c.conkey,
      n.nspname as schema_name,
      t.relname as table_name
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype = 'f'
      and n.nspname = 'public'
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and i.indpred is null
          and c.conkey <@ (i.indkey::smallint[])
      )
  loop
    select string_agg(format('%I', a.attname), ', ' order by k.ordinality)
      into v_columns
    from unnest(r.conkey) with ordinality as k(attnum, ordinality)
    join pg_attribute a
      on a.attrelid = r.conrelid
     and a.attnum = k.attnum;

    if v_columns is null then
      continue;
    end if;

    v_index_name := left(
      format('idx_fk_%s_%s', r.table_name, substr(md5(r.conname), 1, 8)),
      63
    );

    execute format(
      'create index if not exists %I on %I.%I (%s)',
      v_index_name,
      r.schema_name,
      r.table_name,
      v_columns
    );
  end loop;
end $$;

commit;
