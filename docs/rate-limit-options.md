# One2OneLove — Beta Rate-Limit Options

This is a product/security decision document only. No limits are currently enforced by this file and no production changes are made.

## Why limits are needed

Public community and invitation features need server-side abuse controls so a compromised or automated account cannot flood rooms, spam Love Note invitations, hammer reactions/reports, or unexpectedly create provider costs.

Browser-only limits are not sufficient. Final enforcement should happen in the database and/or Edge Functions, tied to the authenticated member account, with provider-level safeguards where applicable.

## Love Note invitation options

### Conservative beta
- 3 invitations per hour
- 10 invitations per day
- 1 invitation to the same email/contact every 15 minutes

Best for a very small closed beta where cost control matters more than volume.

### Balanced beta — recommended starting point
- 5 invitations per hour
- 20 invitations per day
- 1 invitation to the same email/contact every 10 minutes

Allows normal relationship use while making automated invitation spam materially harder.

### Growth beta
- 10 invitations per hour
- 40 invitations per day
- 1 invitation to the same email/contact every 5 minutes

Useful only after deliverability, complaint handling, and abuse monitoring are proven.

Scheduled Love Notes should count against the sender’s allowance when scheduled, not again when the scheduler later dispatches them.

## Live Room messaging options

A room should feel conversational, so message limits need a burst allowance rather than a low hourly cap.

### Recommended structure
- maximum 8 member messages in any rolling 30-second window
- maximum 80 member messages in any rolling hour across all rooms
- a short cooldown response instead of silently dropping a message
- deleted messages still count for abuse-rate purposes

The room can later use reputation/account-age tiers if genuine power users repeatedly hit this ceiling.

## Reactions

Recommended starting point:
- 60 reaction changes per 10 minutes per member
- repeated add/remove toggling on the same message still counts

This is intentionally generous for normal use but blocks reaction-bot loops.

## Reports

Recommended starting point:
- 10 reports per day per member
- duplicate report on the same message by the same member remains blocked by the existing unique constraint

If a member legitimately needs more reports in one day, that volume itself is a moderation signal worth reviewing.

## AI Host

Members should not directly trigger unlimited paid AI calls. The server-controlled host rhythm should remain the gate:
- host only considers an invitation when the room is empty/quiet according to the product rule;
- cache/episode-key logic prevents repeated prompts for the same quiet episode;
- add a server-side per-room AI-call ceiling before public launch.

A practical starting ceiling for review is 20 generated host prompts per room per day, with fallback topics used after that. This keeps rooms functional even if the AI allowance is exhausted.

## Enforcement design

Preferred sequence:
1. Authenticated member action reaches database/Edge Function.
2. Server checks the relevant rolling/daily allowance.
3. Allowed action proceeds atomically.
4. Rejected action returns a friendly cooldown/rate-limit code.
5. Client translates that code into the member’s selected language.
6. Logs record action type/account/time, not private Love Note bodies.

## Owner decision needed

Choose one Love Note tier:
- Conservative beta
- **Balanced beta (recommended)**
- Growth beta
- Custom limits

Also approve or adjust the proposed Live Room, reaction, report, and AI Host ceilings before enforcement is added.

No provider costs or production settings should be activated merely by approving these numbers; implementation and production application remain separate controlled steps.
