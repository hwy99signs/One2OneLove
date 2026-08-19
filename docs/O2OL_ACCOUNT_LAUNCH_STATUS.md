# O2OL Account Launch Status

Updated: 2026-08-18
Branch: `o2ol-build-branch-2026-08-18`

## Completed in the active build

- Sign-in UI hardened across the five active O2OL languages.
- Sign-in now uses safe localized credential errors instead of exposing backend error text.
- Sign-in email/password fields include browser autocomplete hints and accessible password-visibility controls.
- Successful sign-in navigates through the application router rather than forcing a timed page reload.
- Account-type selection is localized across English, Spanish, French, Italian, and German.
- Regular-user registration is localized across the five active languages.
- Regular-user registration validates password length and password confirmation before calling Supabase.
- Terms of Service and Privacy Policy are directly linked from required registration consent.
- Regular-user registration no longer exposes raw backend error text to the applicant.
- Email-verification/account-ready dialog is localized and differentiates verification-required vs immediately ready accounts.
- Influencer application flow is localized across the five active languages and uses safe generic failure messaging.
- Professional application flow is localized across the five active languages and uses safe generic failure messaging.
- Launch/security verification now checks the new account surfaces and rejects regressions such as raw backend error disclosure or forced npm audit remediation.

## Existing backend compatibility

The current authentication context continues to use Supabase Auth (`signInWithPassword`, `signUp`, session/auth-state listeners) and the existing `public.users` profile table. No production auth trigger has been added because the active branch has not yet replaced the legacy production registration sequence; introducing a trigger prematurely could create duplicate-profile behavior for the currently deployed code.

A future auth-profile trigger or equivalent server-side profile bootstrap should be deployed only as part of a coordinated code/database activation sequence.

## Still queued for controlled hardening

- Review the legacy `AuthContext` profile bootstrap path for email-confirmation edge cases before production activation.
- Localize and harden the remaining therapist application surface so every account/application branch stays inside the five-language experience.
- Verify anonymous/application-table insert policies in a controlled database review before altering legacy table grants.
- Continue removing legacy console/debug logging from launch-critical authentication internals after behavior parity is confirmed.

## Owner action

No owner decision is required for the work above. Production activation remains subject to the existing O2OL approval batch items, including first moderator assignment and the Vercel build-rate-limit decision.
