# One2OneLove Member Blocking — Incomplete Production Hold

Member blocking is being built on `relaunch-homepage`. **Do not activate it in production yet.**

## Completed development foundation

- Private `member_blocks` table.
- Backend-mediated Block / Unblock / List actions.
- Privacy-minimized blocked-member list returning only member ID, display name and block timestamp.
- Multilingual reusable Block / Unblock control.
- Private blocked-members management page.
- Mutual Live Room message invisibility through restrictive RLS.
- Pairwise conversations/messages are blocked at restrictive RLS boundaries for SELECT / INSERT / UPDATE.
- The mutual block lookup lives in a non-public `private` database schema.

## Important incomplete dependency

Blocking must **not** be enabled until friend/member discovery and connection-request flows are also hardened. A block feature is misleading if a blocked member can still surface in discovery or create a new connection request.

Required remaining work before activation:

1. Confirm the exact relaunch discovery and connection-request schemas in the target database.
2. Exclude blocked pairs from member discovery/Buddy Finder results.
3. Prevent either side of a blocked pair from sending or accepting a new connection/friend request.
4. Decide and implement what happens to an already accepted connection when either side blocks the other.
5. Verify pending requests are withdrawn/hidden appropriately at block time.
6. Add Block controls to reviewed member/profile/chat surfaces.
7. Route the private Blocked Members management page through Privacy/Safety settings.

## Production activation hold

Do not perform any of these actions until the missing discovery/request enforcement is complete and explicitly approved:

- Apply any `20260819_member_block*.sql` migration.
- Deploy `member-block` or `list-blocked-members` Edge Functions.
- Set `MEMBER_BLOCKING_ENABLED=true`.
- Set `VITE_MEMBER_BLOCKING_ENABLED=true`.
- Expose Block / Unblock controls or the Blocked Members page in production navigation.

## Privacy requirements

- The block list belongs only to the blocker.
- Do not provide a public or browser-callable “who blocked me?” directory.
- Confirm the `private` database schema is not included in Supabase/PostgREST exposed schemas before applying `private.is_member_pair_blocked`.
- Blocked-member list payloads must not include email, partner data, billing/subscription data, verification data, or other private profile fields.

## Required tests before activation

- A blocks B: A cannot see B's Live Room messages; B cannot see A's Live Room messages.
- A/B cannot read, create, or update pairwise conversations/messages while blocked.
- C remains unaffected.
- Unblock restores normal access subject to normal participant/community policies.
- Direct browser writes to `member_blocks` fail.
- Blocker list RLS isolation with two distinct member accounts.
- Discovery/request/accepted-connection tests after the remaining enforcement is added.

## Current status

**Incomplete development feature.** Safe foundation is staged, but production activation is prohibited until discovery and connection-request enforcement is complete.
