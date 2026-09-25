function hasActivePaidAccess(user) {
  const status = String(user?.subscription_status || '').toLowerCase();
  return Boolean(user?.stripe_subscription_id && ['active','trial','trialing'].includes(status));
}

export function getGuestPreview(user) {
  if (!user || hasActivePaidAccess(user)) {
    return { active:false, source:null, startedAt:null, expiresAt:null, remainingMs:0 };
  }

  const startedAt = user?.guest_preview_started_at ? new Date(user.guest_preview_started_at).getTime() : NaN;
  const expiresAt = user?.guest_preview_expires_at ? new Date(user.guest_preview_expires_at).getTime() : NaN;
  const active = user?.guest_preview_active === true && Number.isFinite(expiresAt) && expiresAt > Date.now();

  return {
    active,
    source: active ? 'server' : null,
    startedAt: Number.isFinite(startedAt) ? startedAt : null,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
    remainingMs: active ? Math.max(0, expiresAt - Date.now()) : 0,
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
