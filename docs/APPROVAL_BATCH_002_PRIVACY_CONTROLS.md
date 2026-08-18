# One2OneLove Approval Batch 002 — Privacy Controls Addendum

Status: **COLLECTING — DO NOT EXECUTE YET**

This addendum records privacy-related production changes designed after Approval Batch 001. It does not extend Batch 001 approval to revised migration contents.

## 1. Revised member-directory projection

The latest `supabase/migrations/20260817_member_directory_privacy.sql` supersedes the earlier development revision for any future production execution. The new projection is authenticated and regular-member-only, and exposes only:

- member UUID
- name
- avatar URL
- short bio
- relationship status
- general location
- member-since date

It excludes account email, partner data, interests, role/account type, verification metadata and billing/subscription fields. `src/lib/buddyService.js` is aligned to request only this minimized projection.

Because this migration changed after Batch 001 approval, apply this latest revision only as part of a newly approved production batch.

## 2. Privacy request intake

Stage `supabase/migrations/20260818_privacy_requests.sql`, `supabase/functions/privacy-request/index.ts`, `src/lib/privacyRequestService.js`, and `/PrivacyCenter` for controlled testing.

The workflow may record only two authenticated confirmed-member request types: `data_export` and `account_deletion`. The queue is server-managed; anon/authenticated browser roles receive no direct table access. One active request per member/type is enforced.

Deployment alone must not activate new request intake. Configure `PRIVACY_REQUESTS_ENABLED=false` first and an exact `PRIVACY_REQUEST_ALLOWED_ORIGINS` allowlist. Browser controls remain off unless `VITE_PRIVACY_REQUESTS_ENABLED=true` is deliberately enabled after backend testing.

An account-deletion request is **not** account deletion. This workflow must not call auth-admin deletion, remove shared records, delete billing records, or promise a deletion/export completion time. Fulfillment, identity/re-auth requirements, retention, shared-content treatment and any legally required records remain part of the final privacy/legal operational review.

## 3. Profile-picture Storage ownership

Stage `supabase/migrations/20260818_profile_picture_storage_hardening.sql` before profile-photo editing is activated.

The `profile-pictures` bucket is intentionally public because a member's avatar is one of the fields disclosed as discoverable and the profile stores a public avatar URL. Public delivery does **not** authorize public metadata listing or writes. Bucket constraints cap files at 5 MiB and allow only JPEG, PNG, WebP and GIF.

Storage RLS uses profile-pictures-only **RESTRICTIVE** boundaries so a broad legacy Storage policy cannot let another member list, upload, overwrite or delete someone else's profile object. The object-key contract is `<authenticated-user-uuid>/profile.<approved extension>`. Explicit authenticated policies grant list/upload/update/delete only when the first folder equals `auth.uid()`; unrelated buckets pass through unchanged.

Before production execution, inspect the live Storage policies and test with at least two controlled members: A can manage A's picture, cannot manage or enumerate B's picture folder, B cannot mutate A's picture, unsupported/SVG/>5 MiB uploads fail, the published avatar URL remains viewable, and unrelated buckets are unaffected.

## 4. Controlled tests before activation

Use controlled confirmed accounts to verify own-request isolation, duplicate pending-request protection, unconfirmed/signed-out rejection, origin rejection, default-off behavior, explicit DELETE confirmation in the UI, and that creating a deletion request leaves the account and data intact.

For profile-picture Storage, verify owner-only metadata/list/upload/replace/delete operations, intentional public avatar rendering, server-side size/MIME enforcement and no behavior change to unrelated buckets.

No production merge, public launch, live billing change, paid SMS activation, Storage-policy execution, or destructive account-data action is authorized by this addendum.
