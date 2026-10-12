// Shared username rules for One2OneLove launch sign-up (owner, 2026-10-12).
//
// ONE rule set for every sign-up surface. The quick account gate
// (QuickAccountGate) and the full /SignUp form (LaunchRegularUserForm) both
// create accounts through POST /api/launch-signup (worker/launch-auth.ts),
// and the username lands in public.users.username — the canonical column
// the admin counting rule (PR #134) and the founding giveaway read.
//
// Rules, mirrored from the quick gate's original enforcement:
//   - 3–40 characters: letters, numbers, periods, underscores, hyphens.
//   - Unique across public.users, compared case-insensitively.
//   - A username is only "taken" when a DIFFERENT account email holds it;
//     the same email re-submitting (a resumed registration) is no conflict.

export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,40}$/;

export const USERNAME_FORMAT_MESSAGE =
  'Username must be 3–40 characters using letters, numbers, periods, underscores, or hyphens.';
export const USERNAME_REQUIRED_MESSAGE = 'Please choose a username.';
export const USERNAME_TAKEN_MESSAGE = 'That username is already taken. Please choose another.';
export const USERNAME_TAKEN_CODE = 'username_taken';

// Case-insensitive uniqueness probe against the canonical column.
export const USERNAME_LOOKUP_SQL =
  'SELECT u.email FROM public.users u WHERE lower(u.username)=lower($1) LIMIT 1';

export function isValidUsername(username) {
  return typeof username === 'string' && USERNAME_PATTERN.test(username);
}

// `row` is the USERNAME_LOOKUP_SQL result row (or null). Returns true when
// the username is held by an account with a different email address.
export function usernameTakenByOtherAccount(row, email) {
  if (!row) return false;
  return String(row.email || '').toLowerCase() !== String(email || '').toLowerCase();
}
