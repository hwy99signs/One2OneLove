-- O2OL Global Relationship Room creator time-policy hardening
-- Direct Data API callers cannot submit or move creator programming into the past.

drop policy if exists "creators can submit own room slots" on public.relationship_room_slots;
create policy "creators can submit own room slots"
on public.relationship_room_slots
for insert
to authenticated
with check (
  (select auth.uid()) = owner_user_id
  and program_type = 'creator'
  and status = 'pending'
  and moderation_status = 'unreviewed'
  and disclaimer_required = true
  and scheduled_start > now()
  and scheduled_end > scheduled_start
  and exists (
    select 1
    from public.room_creator_profiles p
    where p.id = creator_id
      and p.user_id = (select auth.uid())
      and p.status = 'approved'
  )
);

drop policy if exists "creators can update own nonlive room slots" on public.relationship_room_slots;
create policy "creators can update own nonlive room slots"
on public.relationship_room_slots
for update
to authenticated
using (
  (select auth.uid()) = owner_user_id
  and status in ('draft','pending','cancelled')
)
with check (
  (select auth.uid()) = owner_user_id
  and status in ('draft','pending','cancelled')
  and moderation_status = 'unreviewed'
  and disclaimer_required = true
  and (
    status = 'cancelled'
    or (scheduled_start > now() and scheduled_end > scheduled_start)
  )
);
