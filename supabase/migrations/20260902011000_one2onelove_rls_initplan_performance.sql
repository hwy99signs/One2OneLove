-- One2OneLove relaunch: performance-only RLS optimization from the final
-- Supabase advisor pass. This preserves policy semantics while evaluating
-- auth.uid() once per statement via an initplan instead of once per row.
--
-- STAGED ONLY: do not apply to the live project without the explicit
-- production-change approval gate.

begin;

-- calendar_events
alter policy "Users can delete own calendar events"
  on public.calendar_events
  using ((select auth.uid()) = user_id);
alter policy "Users can insert own calendar events"
  on public.calendar_events
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own calendar events"
  on public.calendar_events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "Users can view own calendar events"
  on public.calendar_events
  using ((select auth.uid()) = user_id);

-- friend_requests
alter policy "Users can delete friend requests they sent"
  on public.friend_requests
  using ((select auth.uid()) = sender_id);
alter policy "Users can send friend requests"
  on public.friend_requests
  with check ((select auth.uid()) = sender_id);
alter policy "Users can update friend requests they received"
  on public.friend_requests
  using ((select auth.uid()) = receiver_id)
  with check ((select auth.uid()) = receiver_id);
alter policy "Users can view friend requests involving them"
  on public.friend_requests
  using (((select auth.uid()) = sender_id) or ((select auth.uid()) = receiver_id));

-- relationship_goals
alter policy "Users can delete own goals"
  on public.relationship_goals
  using ((select auth.uid()) = user_id);
alter policy "Users can insert own goals"
  on public.relationship_goals
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own goals"
  on public.relationship_goals
  using ((select auth.uid()) = user_id);
alter policy "Users can view own goals"
  on public.relationship_goals
  using ((select auth.uid()) = user_id);

-- goal_action_steps
alter policy "Users can delete own goal steps"
  on public.goal_action_steps
  using (exists (
    select 1
    from public.relationship_goals
    where relationship_goals.id = goal_action_steps.goal_id
      and relationship_goals.user_id = (select auth.uid())
  ));
alter policy "Users can insert own goal steps"
  on public.goal_action_steps
  with check (exists (
    select 1
    from public.relationship_goals
    where relationship_goals.id = goal_action_steps.goal_id
      and relationship_goals.user_id = (select auth.uid())
  ));
alter policy "Users can update own goal steps"
  on public.goal_action_steps
  using (exists (
    select 1
    from public.relationship_goals
    where relationship_goals.id = goal_action_steps.goal_id
      and relationship_goals.user_id = (select auth.uid())
  ));
alter policy "Users can view own goal steps"
  on public.goal_action_steps
  using (exists (
    select 1
    from public.relationship_goals
    where relationship_goals.id = goal_action_steps.goal_id
      and relationship_goals.user_id = (select auth.uid())
  ));

-- shared_journals
alter policy "Mutual partners can view shared journal entries"
  on public.shared_journals
  using ((shared_with_partner = true)
    and private.is_mutual_partner_pair(user_id, (select auth.uid())));
alter policy "Users can delete own journal entries"
  on public.shared_journals
  using ((select auth.uid()) = user_id);
alter policy "Users can insert own journal entries"
  on public.shared_journals
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own journal entries"
  on public.shared_journals
  using ((select auth.uid()) = user_id);
alter policy "Users can view own journal entries"
  on public.shared_journals
  using ((select auth.uid()) = user_id);

-- payment/subscription history
alter policy "Users can view own payment history"
  on public.payment_history
  using ((select auth.uid()) = user_id);
alter policy "Users can view own subscription changes"
  on public.subscription_changes
  using ((select auth.uid()) = user_id);

-- Love Note participant history
alter policy "love_note_participants_select_own"
  on public.love_note_invitations
  using ((sender_user_id = (select auth.uid()))
    or (recipient_user_id = (select auth.uid())));

commit;
