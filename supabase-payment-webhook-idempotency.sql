-- Ensure repeated Stripe webhook deliveries do not duplicate payment history.
create unique index if not exists payment_history_stripe_invoice_unique
on public.payment_history (stripe_invoice_id)
where stripe_invoice_id is not null;
