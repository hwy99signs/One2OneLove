-- One2OneLove account-core security hardening
-- Prevents client-side subscription elevation and removes anonymous grants
-- from account, billing, messaging, and presence data.

begin;

create or replace function public.protect_user_managed_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_email_confirmed boolean := false;
begin
  if v_actor is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.id <> v_actor then
      raise exception 'not authorized' using errcode = '42501';
    end if;

    select (au.email_confirmed_at is not null)
      into v_email_confirmed
    from auth.users au
    where au.id = v_actor;

    new.user_type := case
      when new.user_type in ('regular', 'therapist', 'influencer', 'professional') then new.user_type
      else 'regular'
    end;
    new.subscription_plan := 'Basic';
    new.subscription_price := 0;
    new.subscription_status := 'active';
    new.subscription_started_at := coalesce(new.subscription_started_at, now());
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.subscription_current_period_start := null;
    new.subscription_current_period_end := null;
    new.cancel_at_period_end := false;
    new.payment_method := null;
    new.is_verified := false;
    new.is_active := true;
    new.email_verified := coalesce(v_email_confirmed, false);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.id <> v_actor or new.id <> old.id then
      raise exception 'not authorized' using errcode = '42501';
    end if;

    -- Account identity, trust, and billing fields are controlled by trusted server paths.
    new.id := old.id;
    new.email := old.email;
    new.user_type := old.user_type;
    new.subscription_plan := old.subscription_plan;
    new.subscription_price := old.subscription_price;
    new.subscription_status := old.subscription_status;
    new.subscription_started_at := old.subscription_started_at;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_current_period_start := old.subscription_current_period_start;
    new.subscription_current_period_end := old.subscription_current_period_end;
    new.cancel_at_period_end := old.cancel_at_period_end;
    new.payment_method := old.payment_method;
    new.is_verified := old.is_verified;
    new.is_active := old.is_active;
    new.email_verified := old.email_verified;
    new.created_at := old.created_at;
    return new;
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_user_managed_fields() from public, anon, authenticated;

drop trigger if exists protect_user_managed_fields on public.users;
create trigger protect_user_managed_fields
before insert or update on public.users
for each row execute function public.protect_user_managed_fields();

-- Users are private account rows. Anonymous clients should never read them.
revoke all on table public.users from anon;
drop policy if exists allow_all_select_users on public.users;
drop policy if exists allow_own_insert_users on public.users;
drop policy if exists allow_own_update_users on public.users;

create policy "authenticated users can read user rows"
on public.users for select to authenticated
using (true);

create policy "users can create own account row"
on public.users for insert to authenticated
with check ((select auth.uid()) = id);

create policy "users can update own account row"
on public.users for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Private billing and messaging tables should not be exposed to anonymous callers.
revoke all on table public.payment_history from anon;
revoke all on table public.messages from anon;
revoke all on table public.conversations from anon;
revoke all on table public.user_presence from anon;
revoke all on table public.message_reactions from anon;

-- Keep only the privileges required by their authenticated RLS policies.
revoke all on table public.payment_history from authenticated;
grant select on table public.payment_history to authenticated;

revoke all on table public.messages from authenticated;
grant select, insert, update, delete on table public.messages to authenticated;

revoke all on table public.conversations from authenticated;
grant select, insert, update, delete on table public.conversations to authenticated;

revoke all on table public.user_presence from authenticated;
grant select, insert, update, delete on table public.user_presence to authenticated;

revoke all on table public.message_reactions from authenticated;
grant select, insert, delete on table public.message_reactions to authenticated;

commit;
