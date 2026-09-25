const DURATION_MS = 24 * 60 * 60 * 1000;

function hasActivePaidAccess(user) {
  const status = String(user?.subscription_status || '').toLowerCase();
  return Boolean(user?.stripe_subscription_id && ['active','trial','trialing'].includes(status));
}

export function getGuestPreview(user) {
  if (!user || hasActivePaidAccess(user)) {
    return { active:false, source:null, startedAt:null, expiresAt:null, remainingMs:0 };
  }

  const startedAt = new Date(user?.created_at || '').getTime();
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return { active:false, source:null, startedAt:null, expiresAt:null, remainingMs:0 };
  }

  const expiresAt = startedAt + DURATION_MS;
  const remainingMs = Math.max(0, expiresAt - Date.now());
  return {
    active: remainingMs > 0,
    source: 'account',
    startedAt,
    expiresAt,
    remainingMs,
  };
}

export function isGuestPreviewActive(user) {
  return getGuestPreview(user).active;
}

export function guestPreviewRemainingLabel(user) {
  const { active, remainingMs } = getGuestPreview(user);
  if (!active) return '';
  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.max(1, Math.ceil((remainingMs % 3600000) / 60000));
  return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
}

export const GUEST_PREVIEW_DURATION_MS = DURATION_MS;
