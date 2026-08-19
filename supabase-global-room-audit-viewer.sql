-- O2OL Global Relationship Room moderation audit viewer
-- Moderator-only read access to recent moderation activity through a bounded RPC.

create or replace function public.get_global_room_moderation_audit(
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  result jsonb;
  safe_limit integer;
begin
  if (select auth.uid()) is null or not public.is_global_room_moderator() then
    raise exception 'Global Room moderator access required.' using errcode = '42501';
  end if;

  safe_limit := greatest(1, least(coalesce(p_limit, 100), 250));

  select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc), '[]'::jsonb)
  into result
  from (
    select id, actor_user_id, target_type, target_id, decision, details, created_at
    from private.global_room_moderation_audit
    order by created_at desc
    limit safe_limit
  ) a;

  return result;
end;
$$;

revoke all on function public.get_global_room_moderation_audit(integer) from public, anon;
grant execute on function public.get_global_room_moderation_audit(integer) to authenticated;
