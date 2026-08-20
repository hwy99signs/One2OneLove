# One2OneLove Blocking — Accepted Connection Decision Hold

The technical block foundation now covers:

- private block ownership,
- mutual Live Room visibility suppression,
- pairwise conversation/message SELECT/INSERT/UPDATE restriction,
- detected friend/connection request table SELECT/INSERT/UPDATE restriction,
- block-aware member discovery that excludes both directions of a blocked pair.

One product-policy decision remains intentionally unresolved before activation:

## What should happen to an already accepted connection when either member blocks the other?

### Option A — Permanently sever the accepted connection

On block, delete/end the accepted connection record and withdraw pending requests. If the block is later removed, the members are no longer connected and would need to reconnect intentionally.

**Benefits:** strongest personal-safety expectation; unblock does not silently restore an old relationship.

**Tradeoff:** destructive/irreversible relationship-state change; requires explicit UX wording before the user confirms a block.

### Option B — Preserve but suppress the connection while blocked

Keep the accepted connection row, but restrictive RLS makes it inaccessible while either side blocks the other. If the block is removed, the prior connection becomes visible again.

**Benefits:** non-destructive; simpler rollback if someone blocks accidentally.

**Tradeoff:** an old connection silently reappears after unblock, which may surprise users and may not match normal social-platform expectations.

## Current development behavior

The staged RLS foundation behaves like **Option B** because it suppresses access without deleting connection data. This is not a final product decision and the feature remains disabled.

## Activation rule

Do not set `MEMBER_BLOCKING_ENABLED=true` or `VITE_MEMBER_BLOCKING_ENABLED=true` until One2OneLove explicitly chooses Option A or Option B and the block-confirmation copy reflects that choice.
