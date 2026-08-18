const NOTE_DRAFT_KEY = 'o2ol-love-note-draft';
const SEND_SESSION_KEY = 'o2ol-love-note-send-session';
const SEND_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const clean = (value, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const parse = (raw) => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
};

export function stashLoveNoteDraft({ message, source = 'new', title = '', recipientName = '' } = {}) {
  if (typeof window === 'undefined') return;
  const payload = {
    message: clean(message, 500),
    source: clean(source, 40) || 'new',
    title: clean(title, 120),
    recipientName: clean(recipientName, 80),
  };
  window.sessionStorage.setItem(NOTE_DRAFT_KEY, JSON.stringify(payload));
}

export function loadLoveNoteDraft() {
  if (typeof window === 'undefined') return null;
  return parse(window.sessionStorage.getItem(NOTE_DRAFT_KEY));
}

export function clearLoveNoteDraft() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(NOTE_DRAFT_KEY);
}

export function stashLoveNoteSendSession(input = {}) {
  if (typeof window === 'undefined') return;
  const payload = {
    senderName: clean(input.senderName, 80),
    recipientName: clean(input.recipientName, 80),
    delivery: input.delivery === 'email' ? 'email' : 'text',
    contact: clean(input.contact, 160),
    message: clean(input.message, 500),
    deliveryTime: input.deliveryTime === 'schedule' ? 'schedule' : 'now',
    scheduleDate: clean(input.scheduleDate, 20),
    scheduleTime: clean(input.scheduleTime, 20),
    source: clean(input.source, 40) || 'new',
    step: Number(input.step) >= 2 ? Math.min(Number(input.step), 3) : 1,
    expiresAt: Date.now() + SEND_SESSION_TTL_MS,
  };
  window.localStorage.setItem(SEND_SESSION_KEY, JSON.stringify(payload));
}

export function loadLoveNoteSendSession() {
  if (typeof window === 'undefined') return null;

  // A freshly chosen/written/reply Love Note always wins over an older in-progress
  // sender session. This prevents a stale form from replacing the new note when
  // the user starts another send flow without first clearing local storage.
  if (window.sessionStorage.getItem(NOTE_DRAFT_KEY)) {
    window.localStorage.removeItem(SEND_SESSION_KEY);
    return null;
  }

  const payload = parse(window.localStorage.getItem(SEND_SESSION_KEY));
  if (!payload) return null;
  if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
    window.localStorage.removeItem(SEND_SESSION_KEY);
    return null;
  }
  return payload;
}

export function clearLoveNoteSendSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SEND_SESSION_KEY);
}
