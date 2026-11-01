// One2OneLove launch guest-access policy, server side (owner decision 2026-11-01).
// Replaces the temporary preview-hostname-only checks so the preview and
// one2onelove.com behave the same. Only public, non-personal content uses this:
// permanently free game HTML, published Studio media, published articles, and
// Date Idea / Love Note templates during the 2026 free window. Member records,
// scores, wallets, AI, SMS and payments keep their existing authentication.
// Emergency off switch: set worker var O2OL_GUEST_BROWSE="false".
export function guestBrowseEnabled(env){
  return String(env?.O2OL_GUEST_BROWSE ?? 'true').toLowerCase() !== 'false';
}
