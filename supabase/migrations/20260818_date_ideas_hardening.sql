-- One2OneLove relaunch: Date Ideas ownership and schema-contract hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Date Ideas remain a free browsing feature. This migration protects only the private
-- member-owned custom_date_ideas records used for create/save/favorite/complete behavior.

begin;

do $$
begin
  if to_regclass('public.custom_date_ideas') is null then
    raise exception 'custom_date_ideas table is required before Date Ideas hardening';
  end if;
end $$;

alter table public.custom_date_ideas enable row level security;

-- New/changed rows are checked immediately while NOT VALID avoids an unsafe launch-time
-- table scan if old Base44-era rows contain dirty values. Existing rows can be reviewed and
-- the constraints validated in a controlled cleanup later.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'o2ol_date_title_length') then
    alter table public.custom_date_ideas
      add constraint o2ol_date_title_length
      check (char_length(btrim(title)) between 1 and 120) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'o2ol_date_description_length') then
    alter table public.custom_date_ideas
      add constraint o2ol_date_description_length
      check (description is null or char_length(description) <= 1200) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'o2ol_date_category_values') then
    alter table public.custom_date_ideas
      add constraint o2ol_date_category_values
      check (category is null or category in ('romantic','adventure','relaxing','indoor','outdoor','creative')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'o2ol_date_budget_values') then
    alter table public.custom_date_ideas
      add constraint o2ol_date_budget_values
      check (budget is null or budget in ('free','low','medium','high')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'o2ol_date_location_values') then
    alter table public.custom_date_ideas
      add constraint o2ol_date_location_values
      check (location_type is null or location_type in ('home','outdoor','restaurant','activity_center','cultural','nature','urban')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'o2ol_date_occasion_values') then
    alter table public.custom_date_ideas
      add constraint o2ol_date_occasion_values
      check (occasion is null or occasion in ('regular','anniversary','birthday','valentines','special','apology','celebration')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'o2ol_date_stage_values') then
    alter table public.custom_date_ideas
      add constraint o2ol_date_stage_values
      check (relationship_stage is null or relationship_stage in ('new','dating','committed','married','long_term','any')) not valid;
  end if;
end $$;

create or replace function public.enforce_custom_date_idea_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Trusted server/service-role operations retain their explicit identity semantics.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.created_at := coalesce(new.created_at, now());
  else
    if old.user_id <> auth.uid() then
      raise exception 'You may modify only your own Date Ideas';
    end if;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;

  new.title := btrim(new.title);
  if new.description is not null then new.description := nullif(btrim(new.description), ''); end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.enforce_custom_date_idea_owner() from public;

drop trigger if exists aaa_enforce_custom_date_idea_owner on public.custom_date_ideas;
create trigger aaa_enforce_custom_date_idea_owner
before insert or update on public.custom_date_ideas
for each row execute function public.enforce_custom_date_idea_owner();

-- Remove the known legacy policies and this migration's own policy names only.
drop policy if exists "Users can view own date ideas" on public.custom_date_ideas;
drop policy if exists "Users can insert own date ideas" on public.custom_date_ideas;
drop policy if exists "Users can update own date ideas" on public.custom_date_ideas;
drop policy if exists "Users can delete own date ideas" on public.custom_date_ideas;
drop policy if exists "O2OL Date Ideas owner select boundary" on public.custom_date_ideas;
drop policy if exists "O2OL Date Ideas owner insert boundary" on public.custom_date_ideas;
drop policy if exists "O2OL Date Ideas owner update boundary" on public.custom_date_ideas;
drop policy if exists "O2OL Date Ideas owner delete boundary" on public.custom_date_ideas;
drop policy if exists "O2OL members select own Date Ideas" on public.custom_date_ideas;
drop policy if exists "O2OL members insert own Date Ideas" on public.custom_date_ideas;
drop policy if exists "O2OL members update own Date Ideas" on public.custom_date_ideas;
drop policy if exists "O2OL members delete own Date Ideas" on public.custom_date_ideas;

-- RESTRICTIVE boundaries ensure an unknown permissive legacy policy cannot expose another
-- member's private saved/custom Date Ideas.
create policy "O2OL Date Ideas owner select boundary"
on public.custom_date_ideas as restrictive for select to public
using (auth.uid() is not null and user_id = auth.uid());

create policy "O2OL Date Ideas owner insert boundary"
on public.custom_date_ideas as restrictive for insert to public
with check (auth.uid() is not null and user_id = auth.uid());

create policy "O2OL Date Ideas owner update boundary"
on public.custom_date_ideas as restrictive for update to public
using (auth.uid() is not null and user_id = auth.uid())
with check (auth.uid() is not null and user_id = auth.uid());

create policy "O2OL Date Ideas owner delete boundary"
on public.custom_date_ideas as restrictive for delete to public
using (auth.uid() is not null and user_id = auth.uid());

-- Permissive own-row grants. Restrictive boundaries above remain the maximum browser scope.
create policy "O2OL members select own Date Ideas"
on public.custom_date_ideas for select to authenticated
using (user_id = auth.uid());

create policy "O2OL members insert own Date Ideas"
on public.custom_date_ideas for insert to authenticated
with check (user_id = auth.uid());

create policy "O2OL members update own Date Ideas"
on public.custom_date_ideas for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "O2OL members delete own Date Ideas"
on public.custom_date_ideas for delete to authenticated
using (user_id = auth.uid());

revoke all on table public.custom_date_ideas from anon;
grant select, insert, update, delete on table public.custom_date_ideas to authenticated;

comment on table public.custom_date_ideas is
  'Private member-owned One2OneLove Date Ideas. Built-in ideas are public frontend content; only saved/custom member copies live here.';

commit;

-- CONTROLLED TESTS BEFORE PRODUCTION ACTIVATION
-- 1. Anonymous users can browse built-in frontend ideas but cannot read custom_date_ideas.
-- 2. Member A can create/read/update/delete only A-owned rows.
-- 3. Browser-supplied user_id is replaced with auth.uid() on insert and cannot be changed.
-- 4. Member B cannot read or mutate A's row even if an unknown permissive legacy policy remains.
-- 5. Oversized titles/descriptions and unsupported enum values fail for new/updated rows.
-- 6. Existing legacy dirty rows do not block migration; review them before VALIDATE CONSTRAINT.
-- 7. Favorite and is_completed updates persist using the real schema fields.
