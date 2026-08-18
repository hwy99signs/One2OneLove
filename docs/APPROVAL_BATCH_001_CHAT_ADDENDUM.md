# One2OneLove Relaunch — Approval Batch 001 Chat Addendum

Status: **PART OF BATCH 001 — DO NOT EXECUTE SEPARATELY**

This addendum supersedes the earlier conversation-only appendix and is part of `docs/APPROVAL_BATCH_001.md`. Approval of **One2OneLove Approval Batch 001** includes these pairwise-chat items unless the owner explicitly excludes them.

## Pairwise Chat production migrations

1. Apply `supabase/migrations/20260817_conversation_hardening.sql` after the pairwise message hardening migration.
   - `get_or_create_conversation` is caller-bound: the authenticated member must be one participant and cannot create conversations for third parties.
   - Participant order is canonical so reversed caller order resolves to one conversation row.
   - `recalculate_unread_count` can update only the authenticated member's own unread counter in a conversation they participate in.
   - Browser direct conversation INSERT and physical DELETE are revoked; member-local archive is the safe replacement for destructive deletion.
   - Direct browser UPDATE is limited to the caller's own mute/pin/archive/unread fields; participants, last-message state, and the other member's settings remain protected.

2. Apply `supabase/migrations/20260817_message_insert_hardening.sql` after conversation hardening.
   - Sender and receiver are derived from the authenticated conversation participants, not trusted from browser input.
   - Nonparticipants cannot inject messages into a conversation.
   - Replies must point to a visible message in the same conversation.
   - Browser clients cannot insert an already-read, delivered, edited, or deleted message.
   - Existing pairwise message UPDATE hardening remains responsible for receipt-only recipient updates and sender-only content/edit/delete changes.

## Controlled test additions

3. With two controlled member accounts, verify one member cannot:
   - create a conversation between two other accounts,
   - alter the other participant's settings or unread count,
   - rewrite conversation participants or last-message state,
   - recalculate the other participant's unread count,
   - physically delete the shared conversation,
   - forge a sender/receiver or insert into a conversation they do not belong to,
   - reply to a message from another conversation.
4. Verify reversed participant argument order returns the same conversation and normal message/receipt triggers still maintain expected state.

## Launch blocker still being developed, not approved for activation yet

5. Pairwise Chat attachment privacy requires a separate private-storage path before file/image/voice attachments should be considered launch-ready. Current relaunch security work treats text messaging as the safe baseline; no production storage-policy activation is authorized by this addendum.

This addendum follows the same dependency-order and stop-on-failed-prerequisite execution rule as the main Batch 001 file.
