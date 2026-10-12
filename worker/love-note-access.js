// Love Note write-access decision (owner rules, extracted unchanged from
// worker/love-note-entitlements.ts loveNoteWriteAccess, 2026-10-12).
//
// The send guard for every Love Note write (immediate SMS, scheduled SMS,
// share records, category writes): the account must be active AND the
// sender must have a VERIFIED phone number on the account
// (public.users.phone_number_verified). The verified phone is the
// sender's FROM number — entered once through /api/phone-verification,
// saved to the account, and it also guards the free-send promo together
// with the verified email the session already requires. The recipient's
// TO number is a separate per-send input and plays no part here.
//
// This module is the pure decision only; the DB read stays in
// love-note-entitlements.ts.

export function loveNoteAccessDecision(row) {
  const r = row || {};
  if (r.is_active === false) {
    return {
      allowed: false,
      reason: 'account_inactive',
      message: 'This One2OneLove account is not active.',
    };
  }
  if (r.phone_verified !== true) {
    return {
      allowed: false,
      reason: 'phone_verification_required',
      message: 'Phone verification is required before sending Love Notes.',
    };
  }
  return { allowed: true, reason: 'free_verified_member' };
}
