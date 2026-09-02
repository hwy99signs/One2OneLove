-- One2OneLove relaunch: protect server-owned account/privilege fields from browser updates.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval and
-- a live users-table/update-policy audit.
--
-- This is defense in depth for the existing own-row users UPDATE policy. The relaunch
-- profile client already sends a narrow field allowlist, but database security must not
-- depend on a cooperative browser. Service-role/backend workflows remain able to manage
-- approved creator roles, billing state, verification and account administration.

begin;

create or replace function public.protect_users_privileged_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_row jsonb := to_jsonb(old);
  new_row jsonb := to_jsonb(new);
  protected_key text;
  protected_keys constant text[] := array[
    'id',
    'email',
    'user_type',
    'role',
    'is_admin',
    'is_staff',
    'is_verified',
    'verification_status',
    'is_active',
    'stripe_customer_id',
    'stripe_subscription_id',
    'subscription_tier',
    'subscription_status',
    'subscription_plan',
    'membership_status',
    'membership_tier',
    'billing_status',
    'created_at'
  ];
begin
  -- PostgREST/browser writes run as anon/authenticated. Trusted service-role/database
  -- workflows are deliberately outside this restriction so reviewed administrative
  -- operations can still assign creator roles or reconcile billing state.
  if current_user in ('anon', 'authenticated') then
    foreach protected_key in array protected_keys loop
      if (new_row -> protected_key) is distinct from (old_row -> protected_key) then
        raise exception using
          errcode = 'P0001',
          message = 'O2OL_ACCOUNT_PRIVILEGED_FIELD_IMMUTABLE';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_users_privileged_fields() from public, anon, authenticated;

drop trigger if exists users_protect_privileged_fields on public.users;
create trigger users_protect_privileged_fields
before update on public.users
for each row execute function public.protect_users_privileged_fields();

comment on function public.protect_users_privileged_fields() is
  'Prevents direct browser updates to role, verification, activation, billing/membership and other server-owned users fields.';

commit;

-- CONTROLLED-TEST CHECKLIST BEFORE ANY PRODUCTION APPROVAL
-- 1. Authenticated own-row edits to reviewed profile fields (name/bio/etc.) still work.
-- 2. Direct authenticated user_type regular -> influencer fails with O2OL_ACCOUNT_PRIVILEGED_FIELD_IMMUTABLE.
-- 3. Direct authenticated billing/verification/activation changes fail with the same code.
-- 4. Approved service-role creator-role and billing reconciliation writes still work.
-- 5. Existing non-browser database triggers that legitimately maintain derived fields are not blocked.
