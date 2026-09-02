const NOTE_DRAFT_KEY = 'o2ol-love-note-draft';
const SEND_SESSION_KEY = 'o2ol-love-note-send-session';
const SEND_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export function createLoveNoteRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const validRequestId = (value) => UUID_PATTERN.test(clean(value, 80));

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
  if (typeof window === 'undefined') return null;

  // Preserve one request ID for the entire logical send attempt. The form is stashed on
  // every edit and before auth/upgrade redirects; regenerating this ID on each stash would
  // defeat provider/database idempotency after a network retry.
  const existing = parse(window.localStorage.getItem(SEND_SESSION_KEY));
  const clientRequestId = validRequestId(input.clientRequestId)
    ? clean(input.clientRequestId, 80)
    : validRequestId(existing?.clientRequestId)
      ? clean(existing.clientRequestId, 80)
      : createLoveNoteRequestId();

  const payload = {
    clientRequestId,
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
  return payload;
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

  // Older pre-idempotency sessions are upgraded once, not discarded.
  if (!validRequestId(payload.clientRequestId)) {
    payload.clientRequestId = createLoveNoteRequestId();
    window.localStorage.setItem(SEND_SESSION_KEY, JSON.stringify(payload));
  }

  return payload;
}

export function clearLoveNoteSendSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SEND_SESSION_KEY);
}
