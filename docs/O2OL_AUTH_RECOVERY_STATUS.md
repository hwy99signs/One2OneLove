# O2OL Authentication Recovery Status

Updated: 2026-08-18
Branch: `o2ol-build-branch-2026-08-18`

## Password recovery implementation

The prior Forgot Password experience only simulated success in the browser. The active build branch now contains a real Supabase password-recovery flow.

### Implemented

- `src/pages/ForgotPassword.jsx`
  - Calls `supabase.auth.resetPasswordForEmail()`.
  - Uses an origin-relative recovery callback so the same implementation works across permitted O2OL environments.
  - Carries the active O2OL language into the recovery URL.
  - Uses account-enumeration-resistant success language.
  - Adds a 30-second resend cooldown.
  - Provides loading, success, and error states in English, Spanish, French, Italian, and German.

- `src/pages/ResetPassword.jsx`
  - Handles the Supabase recovery session.
  - Supports the `PASSWORD_RECOVERY` auth event and session verification.
  - Lets the user create and confirm a new password.
  - Requires at least eight characters at the application layer.
  - Calls `supabase.auth.updateUser({ password })`.
  - Signs out the recovery session after a successful password change so the user signs in cleanly with the new password.
  - Provides invalid/expired-link and success states.
  - Preserves the active O2OL language across the recovery journey.

### Routing

The build branch is being wired with `/ResetPassword` and `/reset-password` routes in the React router.

### Operational activation check

Supabase must allow the deployed O2OL origin(s) used by `resetPasswordForEmail(..., { redirectTo })`. Before production launch, confirm that the production domain and any intended preview/staging domain are present in the Supabase Auth redirect allowlist. This is an environment/configuration validation step, not a reason to hard-code one deployment hostname into the application.

### Security notes

- The recovery-request success screen does not reveal whether an email address belongs to an account.
- The browser does not receive or use a service-role credential.
- Password replacement uses the signed recovery session provided by Supabase Auth.
- The application intentionally ends the recovery session after a successful password change.
