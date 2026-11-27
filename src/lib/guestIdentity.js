// Guest identity for the free, no-signup platform (owner decision,
// 2026-11-25). A guest is identified only by a random id kept in this
// browser's local storage plus a display name they choose. Nothing is
// registered server-side: the id lets Chat Rooms / Communities attribute
// guest posts and lets the guest edit/delete their own posts, and the
// display name is what other visitors see. Clearing browser storage
// simply starts a fresh guest identity.

const ID_KEY = 'o2ol_guest_id';
const NAME_KEY = 'o2ol_guest_name';

function newId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch { /* fall through */ }
  return 'guest-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

export function getGuestId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return newId();
  }
}

export function getGuestName() {
  try {
    return String(localStorage.getItem(NAME_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setGuestName(name) {
  const clean = String(name || '').trim().slice(0, 40);
  try {
    if (clean) localStorage.setItem(NAME_KEY, clean);
    else localStorage.removeItem(NAME_KEY);
  } catch { /* storage unavailable — name just won't persist */ }
  return clean;
}

export function guestDisplayName() {
  return getGuestName() || 'Guest';
}

// Headers the worker reads on guest writes (community chat + communities).
export function guestHeaders() {
  const headers = { 'x-o2ol-guest-id': getGuestId() };
  const name = getGuestName();
  if (name) headers['x-o2ol-guest-name'] = name;
  return headers;
}
