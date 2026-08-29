-- O2OL Global Relationship Room approved creator profile lock
-- Prevents approved creators from changing moderation-sensitive identity or quota fields
-- directly through the browser/Data API after approval.
--
-- Pending creator applications may still correct their own submitted public name, bio,
-- timezone, and acceptance timestamp before review. Once approved, creator-owned updates
-- stop. Trusted moderator SECURITY DEFINER workflows remain responsible for status changes.

alter table public.room_creator_profiles enable row level security;

-- Keep the existing browser column privileges narrow. These columns are editable only while
-- the user's application is still pending because the UPDATE RLS policy below is restrictive.
revoke all on table public.room_creator_profiles from authenticated;
grant select on table public.room_creator_profiles to authenticated;
grant insert (user_id, display_name, bio, timezone, terms_accepted_at)
  on table public.room_creator_profiles to authenticated;
grant update (display_name, bio, timezone, terms_accepted_at, updated_at)
  on table public.room_creator_profiles to authenticated;

-- An approved/suspended/rejected creator cannot change display_name, bio, or timezone through
-- the Data API. This prevents post-moderation identity changes and timezone changes that could
-- undermine the two-slots-per-creator-local-day quota.
drop policy if exists "creators can update own room profile" on public.room_creator_profiles;
create policy "creators can update own pending room profile"
on public.room_creator_profiles
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and status = 'pending'
)
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and plan = 'free'
  and daily_slot_limit = 2
);

comment on policy "creators can update own pending room profile" on public.room_creator_profiles is
'Creator-owned profile edits are allowed only before moderation approval. Approved creator identity and timezone changes require a future trusted/moderated workflow.';
