import { apiRequest } from './apiClient';
import { loadCollection, saveCollection, insertRecord, deleteRecord, getRecord, isUnauthorized } from './guestStore';

// Love Notes after the 2026-11-25 free-platform change:
// - Writing, saving, sending in-app and scheduling inside One2OneLove are
//   FREE for everyone. Guests keep their notes in the browser-local guest
//   store; members keep the server API (API first, local fallback on 401).
// - SMS delivery is RETIRED (it cost money per send): sendLoveNoteSms and
//   price quotes no longer exist, and scheduling a note now keeps it as an
//   in-app scheduled note instead of a text message.

const LOCAL_SENT = 'sent_love_notes';
const LOCAL_SCHEDULED = 'scheduled_love_notes';
const LOCAL_PREFS = 'love_note_preferences';

function notifyUsageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o2ol-love-note-usage-changed'));
  }
}

function localPreference() {
  return getRecord(LOCAL_PREFS, 'categories') || { categories: [] };
}

export async function getLoveNoteCategoryPreference() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    const payload = await apiRequest(`/api/love-notes/categories?tz=${encodeURIComponent(timezone)}`);
    return payload?.preference || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return localPreference();
  }
}

export async function saveLoveNoteCategoryPreference(categories) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    const payload = await apiRequest(`/api/love-notes/categories?tz=${encodeURIComponent(timezone)}`, {
      method: 'PUT',
      body: { categories },
    });
    return payload?.preference || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    const rows = loadCollection(LOCAL_PREFS).filter(row => row.id !== 'categories');
    rows.push({ id: 'categories', categories: Array.isArray(categories) ? categories : [] });
    saveCollection(LOCAL_PREFS, rows);
    return localPreference();
  }
}

export async function getLoveNoteUsage() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    const payload = await apiRequest(`/api/love-notes/usage?tz=${encodeURIComponent(timezone)}`);
    return payload?.usage || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    // Guests: no quotas, no Credit — just a local count for display.
    return { sentToday: loadCollection(LOCAL_SENT).length, tokenCost: 0, tokenBalance: 0, unlimited: true };
  }
}

export async function listSentLoveNotes() {
  try {
    const payload = await apiRequest('/api/love-notes/sent');
    return payload?.notes || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return loadCollection(LOCAL_SENT);
  }
}

export async function recordSentLoveNote(data) {
  const body = {
    note_title: data.note_title,
    note_content: data.note_content,
    recipient_type: data.recipient_type,
    recipient_identifier: data.recipient_identifier || null,
    social_platform: data.social_platform || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
  try {
    const payload = await apiRequest('/api/love-notes/sent', { method: 'POST', body });
    notifyUsageChanged();
    return payload?.note || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    const note = insertRecord(LOCAL_SENT, body);
    notifyUsageChanged();
    return note;
  }
}

// RETIRED: Love Note SMS delivery cost money per send and was switched off
// when the platform went 100% free (2026-11-25). Kept as a stub so any
// stale import fails loudly instead of silently texting.
export async function sendLoveNoteSms() {
  throw new Error('Love Note texting (SMS) has been retired. One2OneLove is now a free platform — share your note inside the app or through your own messaging apps instead.');
}

// RETIRED: there is no SMS price to quote anymore.
export async function getLoveNotePriceQuote() {
  return null;
}

export async function getLoveNoteDeliveryReadiness() {
  // SMS delivery is retired; in-app sending is always ready.
  return { scheduledSmsReady: false, smsRetired: true, inAppReady: true };
}

export async function listScheduledLoveNotes() {
  try {
    const payload = await apiRequest('/api/love-notes/scheduled');
    const serverNotes = payload?.notes || [];
    return [...serverNotes, ...loadCollection(LOCAL_SCHEDULED)];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return loadCollection(LOCAL_SCHEDULED);
  }
}

export async function scheduleLoveNote(data) {
  const scheduledTimezone = data.scheduled_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const body = {
    note_title: data.note_title,
    note_content: data.note_content,
    scheduled_date: data.scheduled_date,
    scheduled_time: data.scheduled_time,
    scheduled_timezone: scheduledTimezone,
    delivery_method: 'in_app',
    note_language: data.note_language || 'en',
    send_anonymous: data.send_anonymous === true,
    status: 'scheduled',
  };
  try {
    const payload = await apiRequest('/api/love-notes/scheduled', {
      method: 'POST',
      body: { ...body, recipient_phone: data.recipient_phone, delivery_method: data.delivery_method || 'sms' },
    });
    notifyUsageChanged();
    return payload?.note || null;
  } catch (error) {
    // 401 (guest) or 410 (SMS scheduling retired): keep the note as an
    // in-app scheduled note in the local store instead.
    if (!isUnauthorized(error) && Number(error?.status) !== 410) throw error;
    const note = insertRecord(LOCAL_SCHEDULED, body);
    notifyUsageChanged();
    return note;
  }
}

export async function cancelScheduledLoveNote(id) {
  try {
    const payload = await apiRequest(`/api/love-notes/scheduled/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
      body: {},
    });
    notifyUsageChanged();
    return payload?.note || null;
  } catch (error) {
    if (!isUnauthorized(error) && Number(error?.status) !== 410 && Number(error?.status) !== 404) throw error;
    deleteRecord(LOCAL_SCHEDULED, id);
    notifyUsageChanged();
    return { id, status: 'cancelled' };
  }
}
