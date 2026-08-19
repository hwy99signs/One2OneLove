-- One2OneLove legacy waitlist hardening
-- The table already has application policies; this migration ensures those
-- policies are actually enforced by enabling Row Level Security.

begin;

alter table public.waitlist_signups enable row level security;

commit;
