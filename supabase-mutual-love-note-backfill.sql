-- Backfill only legacy sent Love Notes that can be proven to belong to a
-- reciprocally linked partner relationship. Arbitrary historical recipient
-- emails are deliberately left unlinked.

begin;

update public.love_notes n
set recipient_user_id = partner.id,
    updated_at = now()
from public.users sender,
     public.users partner
where n.user_id = sender.id
  and n.recipient_user_id is null
  and coalesce(n.is_sent, false) = true
  and n.recipient_email is not null
  and sender.email is not null
  and sender.partner_email is not null
  and partner.email is not null
  and partner.partner_email is not null
  and lower(partner.email) = lower(n.recipient_email)
  and lower(sender.partner_email) = lower(partner.email)
  and lower(partner.partner_email) = lower(sender.email);

commit;
