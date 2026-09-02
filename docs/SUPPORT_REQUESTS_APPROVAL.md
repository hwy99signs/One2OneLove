# One2OneLove Member Support Requests — Production Approval Hold

The member support system is staged on `relaunch-homepage` only. It is an authenticated, private, in-app support channel and must not be activated automatically.

## Staged components

- `supabase/migrations/20260819_support_requests.sql`
- `supabase/functions/support-request`
- `supabase/functions/manage-support-requests`
- `src/lib/supportRequestService.js`
- `src/pages/SupportRequests.jsx`
- `src/pages/SupportAdmin.jsx`
- `scripts/relaunch-support-request-check.mjs`
- `.github/workflows/relaunch-support-integrity.yml`

## Production activation requires explicit approval

1. Apply the support-request migration.
2. Deploy both support Edge Functions.
3. Set `SUPPORT_REQUESTS_ENABLED=true` in the backend.
4. Set `VITE_SUPPORT_REQUESTS_ENABLED=true` in the frontend.
5. Create and populate the server-only `O2OL_SUPPORT_ADMIN_USER_IDS` allowlist with explicitly approved staff account UUIDs.
6. Route/expose the member support page through the reviewed relaunch Help/Contact experience.
7. Route/expose the internal staff support queue only to approved O2OL staff.

## Privacy model

- Support requests require an authenticated member.
- `user_id` comes from the authenticated session; the browser cannot choose request ownership.
- The support table does not duplicate email address or phone number.
- Members can read only their own support requests.
- Browser roles have no direct INSERT/UPDATE/DELETE permission on support requests.
- The audit table is service-role only.
- The staff queue intentionally excludes member UUIDs from its response and UI.
- Staff authority is controlled only by `O2OL_SUPPORT_ADMIN_USER_IDS`; `users.user_type` must never grant support-administrator authority.

## Current member workflow

- Create a support request in one of: account, technical, billing, safety, feedback, other.
- Maximum five simultaneously open/in-progress requests per member.
- Track status: open, in progress, resolved, closed.
- View a staff response in-app.
- Close the member's own request through the backend-mediated action.

## Current staff workflow

- View active or status-filtered queue.
- Start work on an open request.
- Resolve with an in-app response.
- Close or reopen a request.
- Every staff/member state-changing action writes a service-role audit record.

## External delivery is intentionally excluded

The staged support system does not send email, SMS, mobile push, or web push. Do not add or reuse an external provider without a separate approval covering cost, consent, opt-out/unsubscribe behavior, privacy, deliverability, and regional requirements.

## Required pre-production tests

- Two-member RLS isolation test.
- Browser direct-write denial test.
- Five-open-request ceiling test.
- Staff allowlist denial/allow tests.
- Verify staff queue responses contain no member UUID.
- Audit-record creation for create, member close, staff start, staff resolve, staff close, staff reopen.
- EN/ES/FR/IT/DE responsive and accessibility review.
- Verify feature-disabled UI and backend fail closed.

## Current status

Development code only. No live migration, Edge Function deployment, feature switch, staff allowlist, route exposure, external messaging provider, or production support action has been performed.
