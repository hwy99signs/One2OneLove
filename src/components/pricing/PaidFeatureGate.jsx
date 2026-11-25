import React from 'react';

// Retired (owner decision, 2026-11-25): One2OneLove is 100% free. The
// one-time Credit unlocks this gate used to sell ($2.99 feature unlocks)
// no longer exist — every feature renders directly for guests and members
// alike. The component is kept as a pass-through so existing imports and
// route wrappers keep working without a paywall ever coming back.
export default function PaidFeatureGate({ children }) {
  return children;
}
