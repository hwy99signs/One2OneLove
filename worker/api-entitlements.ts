// @ts-nocheck
// O2OL Token Economy Prelaunch
//
// Subscription-plan entitlements (Premiere / Exclusive) are intentionally retired
// from active API authorization in this branch. Identity verification remains
// centralized in identity-gate.ts. Metered/premium actions enforce O2OL Tokens
// inside their own server-side handlers (Bianca, Amora, Love Notes, premium games,
// AI generation, and future paid actions).
//
// Keep this compatibility module until the old tier migration is fully reconciled
// so imports do not need to change atomically across the application.

export function requiresApiEntitlement(_pathname) {
  return false;
}

export async function enforceApiEntitlement(_request, _env, _url) {
  return null;
}
