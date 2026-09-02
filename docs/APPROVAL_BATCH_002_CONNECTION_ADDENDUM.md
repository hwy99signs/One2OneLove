# One2OneLove Relaunch — Approval Batch 002 Connection Addendum

Status: **PART OF BATCH 002 — DO NOT EXECUTE SEPARATELY**

This addendum is part of `docs/APPROVAL_BATCH_002.md`. Approval of **One2OneLove Approval Batch 002** includes these connection/chat actions unless the owner explicitly excludes them.

## Member connection -> private Chat boundary

1. Apply `supabase/migrations/20260818_chat_connection_gate.sql` only after the Batch 001 buddy-request and pairwise conversation/message hardening migrations are active.
   - Private Chat follows the relaunch sequence: discover member -> send connection request -> recipient accepts -> private Chat.
   - `get_or_create_conversation` rejects pending, rejected, missing, self, or third-party connection attempts.
   - A guessed `/Chat?userId=...` URL cannot bypass the database boundary.
   - Pairwise message INSERT has a second accepted-connection check so a legacy/preexisting conversation row cannot be used to send unsolicited messages.
   - Account email is not part of member discovery, request, or chat identity surfaces.
2. Keep `VITE_CHAT_ATTACHMENTS_ENABLED=false` and `VITE_CHAT_LOCATION_ENABLED=false` until the relevant privacy/storage/location controls complete controlled testing.
   - Text Chat remains the launch-safe baseline.
   - Photo/video/document/voice controls remain hidden while private attachment activation is off.
   - Location sharing remains hidden until separately activated after privacy/product review.
3. Controlled tests with three member accounts must verify:
   - A cannot open/create Chat with B before a connection exists;
   - pending and rejected requests do not unlock Chat;
   - after B accepts A, both sides can open the same canonical conversation;
   - C cannot inject a message into the A/B conversation;
   - direct RPC/message attempts cannot bypass the accepted-connection rule;
   - member directory/request/chat UI does not display account email;
   - text Chat works with attachment/location flags off;
   - enabling attachment/location flags is not performed until their own prerequisites are satisfied.

This addendum follows the same dependency-order and stop-on-failed-prerequisite execution rule as Approval Batch 002.
