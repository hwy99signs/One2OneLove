-- Prevent legacy views from bypassing caller permissions/RLS.
alter view public.goals_with_steps set (security_invoker = true);
alter view public.milestones_with_next_date set (security_invoker = true);
alter view public.user_presence_view set (security_invoker = true);
