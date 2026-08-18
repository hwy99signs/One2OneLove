# One2OneLove Relaunch — Approval Batch 001 Appendix

Status: **PART OF BATCH 001 — DO NOT EXECUTE SEPARATELY**

This appendix is part of `docs/APPROVAL_BATCH_001.md` and exists only because the pairwise-chat audit continued after the main batch file was assembled. Approval of **One2OneLove Approval Batch 001** includes this appendix unless the owner explicitly excludes it.

## Pairwise Chat / conversation hardening

1. Apply `supabase/migrations/20260817_conversation_hardening.sql` after the pairwise message hardening migration.
   - `get_or_create_conversation` is caller-bound: the authenticated member must be one participant and cannot create a conversation between third parties.
   - Participant order is canonical so reversed caller order resolves to one conversation row.
   - `recalculate_unread_count` can update only the authenticated member's own unread counter in a conversation they participate in.
   - Browser direct conversation INSERT and physical DELETE are revoked; member-local archive remains the safe replacement for destructive deletion.
   - Direct browser UPDATE is limited to the caller's own mute/pin/archive/unread fields; participants, last-message state, and the other member's settings remain protected.
   - Nested database message triggers may continue maintaining server-side last-message/unread state.

## Controlled test additions

2. With two controlled member accounts, verify one member cannot:
   - create a conversation between two other accounts,
   - alter the other participant's settings/unread count,
   - rewrite conversation participants or last-message state,
   - recalculate the other participant's unread count,
   - physically delete the shared conversation.
3. Verify reversed participant argument order returns the same conversation and normal message-trigger maintenance still works.

## Still excluded

- No production/default-branch merge.
- No public launch.
- No live payment activation.
- No paid SMS activation.

This appendix follows the same stop-on-failed-prerequisite execution rule as the main Batch 001 file.
