// Temporary anonymous browsing of the unified One2OneLove PRELAUNCH preview.
// Owner order 2026-10-31: homepage tabs must not prompt guests to sign up
// while revisions are under way. This is deliberately host-scoped so it
// cannot disable membership, phone or payment safeguards on the live domain.
// Do not broaden this hostname check or use it to bypass server-side APIs.
const UNIFIED_PRELAUNCH_PREVIEW_HOST = 'prelaunch-o2ol-unified-20261030-one2onelove-launch.hwy99signs.workers.dev';

export function isUnifiedPrelaunchGuestAccessEnabled() {
  return typeof window !== 'undefined' &&
    window.location.hostname.toLowerCase() === UNIFIED_PRELAUNCH_PREVIEW_HOST;
}
