-- One2OneLove relaunch: paid Relationship Goals ownership + membership boundary
-- DEVELOPMENT MIGRATION ONLY.
--
-- IMPORTANT: do NOT apply this migration during the open/free controlled beta. It is
-- intentionally the server/database paid gate for Relationship Goals and should be applied
-- only when member_subscriptions is active and membership gating is being turned on.

begin;

do $$
begin
  if to_regclass('public.relationship_goals') is null or to_regclass('public.goal_action_steps') is null then
    raise exception 'Relationship Goals tables are required before paid hardening';
  end if;
  if to_regclass('public.member_subscriptions') is null then
    raise exception 'member_subscriptions is required before paid Relationship Goals hardening';
  end if;
end $$;

create or replace function public.has_active_o2ol_membership()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.member_subscriptions ms
    where ms.user_id = auth.uid()
      and ms.status in ('trialing', 'active')
  );
$$;

revoke all on function public.has_active_o2ol_membership() from public;
grant execute on function public.has_active_o2ol_membership() to authenticated;

create or replace function public.enforce_relationship_goal_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if auth.uid() is null or auth.role() <> 'authenticated' then raise exception 'Authentication required'; end if;
  if not public.has_active_o2ol_membership() then raise exception 'Membership required for Relationship Goals'; end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.created_at := coalesce(new.created_at, now());
    new.status := 'in_progress';
    new.progress := 0;
  else
    if old.user_id <> auth.uid() then raise exception 'You may modify only your own Relationship Goals'; end if;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;

  new.title := btrim(new.title);
  if new.description is not null then new.description := nullif(btrim(new.description), ''); end if;
  new.progress := greatest(0, least(100, coalesce(new.progress, 0)));
  if new.progress = 100 then new.status := 'completed'; end if;
  if new.status = 'completed' then new.progress := 100; end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.enforce_relationship_goal_owner() from public;

drop trigger if exists aaa_enforce_relationship_goal_owner on public.relationship_goals;
create trigger aaa_enforce_relationship_goal_owner
before insert or update on public.relationship_goals
for each row execute function public.enforce_relationship_goal_owner();

-- Guard new/updated relaunch rows without forcing an immediate scan of legacy data.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'o2ol_goal_title_length') then
    alter table public.relationship_goals add constraint o2ol_goal_title_length
      check (char_length(btrim(title)) between 1 and 160) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'o2ol_goal_description_length') then
    alter table public.relationship_goals add constraint o2ol_goal_description_length
      check (description is null or char_length(description) <= 1600) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'o2ol_goal_step_text_length') then
    alter table public.goal_action_steps add constraint o2ol_goal_step_text_length
      check (char_length(btrim(step_text)) between 1 and 300) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'o2ol_goal_step_order_range') then
    alter table public.goal_action_steps add constraint o2ol_goal_step_order_range
      check (step_order between 1 and 20) not valid;
  end if;
end $$;

alter table public.relationship_goals enable row level security;
alter table public.goal_action_steps enable row level security;

-- Keep known legacy policy names manageable, then cap every browser policy with RESTRICTIVE
-- paid/owner boundaries. Unknown permissive policies cannot bypass these boundaries.
drop policy if exists "O2OL paid goals select boundary" on public.relationship_goals;
drop policy if exists "O2OL paid goals insert boundary" on public.relationship_goals;
drop policy if exists "O2OL paid goals update boundary" on public.relationship_goals;
drop policy if exists "O2OL paid goals delete boundary" on public.relationship_goals;
drop policy if exists "O2OL paid goal steps select boundary" on public.goal_action_steps;
drop policy if exists "O2OL paid goal steps insert boundary" on public.goal_action_steps;
drop policy if exists "O2OL paid goal steps update boundary" on public.goal_action_steps;
drop policy if exists "O2OL paid goal steps delete boundary" on public.goal_action_steps;

create policy "O2OL paid goals select boundary"
on public.relationship_goals as restrictive for select to public
using (auth.uid() is not null and user_id = auth.uid() and public.has_active_o2ol_membership());

create policy "O2OL paid goals insert boundary"
on public.relationship_goals as restrictive for insert to public
with check (auth.uid() is not null and user_id = auth.uid() and public.has_active_o2ol_membership());

create policy "O2OL paid goals update boundary"
on public.relationship_goals as restrictive for update to public
using (auth.uid() is not null and user_id = auth.uid() and public.has_active_o2ol_membership())
with check (auth.uid() is not null and user_id = auth.uid() and public.has_active_o2ol_membership());

create policy "O2OL paid goals delete boundary"
on public.relationship_goals as restrictive for delete to public
using (auth.uid() is not null and user_id = auth.uid() and public.has_active_o2ol_membership());

create policy "O2OL paid goal steps select boundary"
on public.goal_action_steps as restrictive for select to public
using (
  auth.uid() is not null
  and public.has_active_o2ol_membership()
  and exists (
    select 1 from public.relationship_goals g
    where g.id = goal_action_steps.goal_id and g.user_id = auth.uid()
  )
);

create policy "O2OL paid goal steps insert boundary"
on public.goal_action_steps as restrictive for insert to public
with check (
  auth.uid() is not null
  and public.has_active_o2ol_membership()
  and exists (
    select 1 from public.relationship_goals g
    where g.id = goal_action_steps.goal_id and g.user_id = auth.uid()
  )
);

create policy "O2OL paid goal steps update boundary"
on public.goal_action_steps as restrictive for update to public
using (
  auth.uid() is not null
  and public.has_active_o2ol_membership()
  and exists (
    select 1 from public.relationship_goals g
    where g.id = goal_action_steps.goal_id and g.user_id = auth.uid()
  )
)
with check (
  auth.uid() is not null
  and public.has_active_o2ol_membership()
  and exists (
    select 1 from public.relationship_goals g
    where g.id = goal_action_steps.goal_id and g.user_id = auth.uid()
  )
);

create policy "O2OL paid goal steps delete boundary"
on public.goal_action_steps as restrictive for delete to public
using (
  auth.uid() is not null
  and public.has_active_o2ol_membership()
  and exists (
    select 1 from public.relationship_goals g
    where g.id = goal_action_steps.goal_id and g.user_id = auth.uid()
  )
);

-- The existing own-row permissive policies can continue to provide grants; the restrictive
-- policies above are the maximum browser scope. Explicit grants are kept narrow.
revoke all on table public.relationship_goals from anon;
revoke all on table public.goal_action_steps from anon;
grant select, insert, update, delete on table public.relationship_goals to authenticated;
grant select, insert, update, delete on table public.goal_action_steps to authenticated;

comment on function public.has_active_o2ol_membership() is
  'Server/database membership predicate for One2OneLove paid browser-persistence features.';
comment on table public.relationship_goals is
  'Member-owned paid Relationship Goals data; relaunch browser access is capped by active/trialing membership plus owner RLS.';

commit;

-- CONTROLLED TESTS WHEN MEMBERSHIP GATING IS READY
-- 1. Free/signed-out/unconfirmed users cannot SELECT/INSERT/UPDATE/DELETE goals or steps.
-- 2. Active/trialing member A can CRUD only A's goals and steps.
-- 3. Member B cannot read or mutate A's goal/step by UUID.
-- 4. Browser-supplied user_id is replaced by auth.uid() and cannot be reassigned.
-- 5. Title/description/step length limits reject new invalid writes.
-- 6. Service role retains controlled migration/support access.
-- 7. Do not apply this migration while the product intentionally runs Relationship Goals
--    in open/free beta mode; it is the database paid gate.
