-- One2OneLove private account read lock
-- Cross-member discovery must use public.user_directory_profiles instead.

begin;

alter table public.users enable row level security;

drop policy if exists "authenticated users can read user rows" on public.users;
drop policy if exists "users can read own account row" on public.users;

create policy "users can read own account row"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

commit;
