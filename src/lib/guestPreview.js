const START_KEY = 'o2ol_guest_preview_started_at';
const DURATION_MS = 24 * 60 * 60 * 1000;

export function startGuestPreview() {
  const startedAt = Date.now();
  try { localStorage.setItem(START_KEY, String(startedAt)); } catch {}
  window.dispatchEvent(new CustomEvent('o2ol:guest-preview-changed'));
  return startedAt;
}

export function endGuestPreview() {
  try { localStorage.removeItem(START_KEY); } catch {}
  window.dispatchEvent(new CustomEvent('o2ol:guest-preview-changed'));
}

export function getGuestPreview() {
  let startedAt = 0;
  try { startedAt = Number(localStorage.getItem(START_KEY) || 0); } catch {}
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return { active:false, startedAt:null, expiresAt:null, remainingMs:0 };
  }
  const expiresAt = startedAt + DURATION_MS;
  const remainingMs = Math.max(0, expiresAt - Date.now());
  if (!remainingMs) {
    try { localStorage.removeItem(START_KEY); } catch {}
    return { active:false, startedAt, expiresAt, remainingMs:0 };
  }
  return { active:true, startedAt, expiresAt, remainingMs };
}

export function isGuestPreviewActive() {
  return getGuestPreview().active;
}

export function guestPreviewRemainingLabel() {
  const { active, remainingMs } = getGuestPreview();
  if (!active) return '';
  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.max(1, Math.ceil((remainingMs % 3600000) / 60000));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export const GUEST_PREVIEW_DURATION_MS = DURATION_MS;
