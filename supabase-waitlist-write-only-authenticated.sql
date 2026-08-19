-- Signed-in users may submit a waitlist entry but must not browse waitlist records.
revoke all privileges on table public.waitlist from authenticated;
grant insert on table public.waitlist to authenticated;
