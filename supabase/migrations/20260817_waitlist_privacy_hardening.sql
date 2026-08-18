-- One2OneLove relaunch: waitlist privacy hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to the live project only as part of an approved batch.
--
-- Goals:
--   * Browser clients may submit to the active public.waitlist table.
--   * Browser clients may not read, update, or delete waitlist records.
--   * Legacy public.waitlist_signups, if present, is locked to service-role/backend use.
--   * Existing backend/service_role workflows remain unaffected by RLS.

begin;

-- ---------------------------------------------------------------------------
-- Current relaunch waitlist table
-- ---------------------------------------------------------------------------

alter table if exists public.waitlist enable row level security;

revoke select, update, delete on table public.waitlist from anon, authenticated;
grant insert on table public.waitlist to anon, authenticated;

-- Remove legacy permissive read/update/delete policies if they exist by known names.
drop policy if exists "Anyone can view waitlist" on public.waitlist;
drop policy if exists "Anyone can update waitlist" on public.waitlist;
drop policy if exists "Anyone can delete waitlist" on public.waitlist;
drop policy if exists "Anyone can insert into waitlist" on public.waitlist;

create policy "Public can join waitlist"
on public.waitlist
for insert
to anon, authenticated
with check (
  email is not null
  and btrim(email) <> ''
  and country is not null
  and btrim(country) <> ''
);

comment on table public.waitlist is
  'Public write-only relaunch waitlist. Browser roles may insert but may not read, update, or delete rows.';

-- ---------------------------------------------------------------------------
-- Legacy waitlist_signups table discovered during the security audit.
-- The current relaunch UI does not use this table. Lock it to backend/service-role
-- access instead of leaving it exposed while old notification tooling is reviewed.
-- ---------------------------------------------------------------------------

alter table if exists public.waitlist_signups enable row level security;

revoke all on table public.waitlist_signups from anon, authenticated;

-- Remove common legacy permissive policies if present. No browser-facing policy is
-- recreated here because the relaunch form writes to public.waitlist.
drop policy if exists "Anyone can view waitlist signups" on public.waitlist_signups;
drop policy if exists "Anyone can insert waitlist signups" on public.waitlist_signups;
drop policy if exists "Public can view waitlist signups" on public.waitlist_signups;
drop policy if exists "Public can insert waitlist signups" on public.waitlist_signups;

comment on table public.waitlist_signups is
  'Legacy waitlist data. Browser access revoked; backend/service_role access only pending migration review.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Confirm the active relaunch form writes to public.waitlist without `.select()`.
-- 2. Confirm any legacy waitlist notification function uses service_role/backend access.
-- 3. Submit one controlled waitlist entry after application and verify no browser SELECT is possible.
