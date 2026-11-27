import { loadCollection, saveCollection, insertRecord, deleteRecord, getRecord } from './guestStore';

// Love Notes after the 2026-11-25 free-platform change, with the member
// system disabled the same day (owner ruling, 2026-11-25 10:58 CT):
// - Writing, saving, sending in-app and scheduling inside One2OneLove
//   are FREE for everyone, and guest mode is the only mode: notes live
//   in the browser-local guest store and this service never calls the
//   member API. The server love-notes API still exists in the worker
//   but the member parts are switched off with the rest of the member
//   system, ready for future re-activation.
// - SMS delivery is RETIRED (it cost money per send): sendLoveNoteSms
//   and price quotes no longer exist, and scheduling a note keeps it as
//   an in-app scheduled note instead of a text message.

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
  return localPreference();
}

export async function saveLoveNoteCategoryPreference(categories) {
  const rows = loadCollection(LOCAL_PREFS).filter(row => row.id !== 'categories');
  rows.push({ id: 'categories', categories: Array.isArray(categories) ? categories : [] });
  saveCollection(LOCAL_PREFS, rows);
  return localPreference();
}

export async function getLoveNoteUsage() {
  // No quotas, no Credit — just a local count for display.
  return { sentToday: loadCollection(LOCAL_SENT).length, tokenCost: 0, tokenBalance: 0, unlimited: true };
}

export async function listSentLoveNotes() {
  return loadCollection(LOCAL_SENT);
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
  const note = insertRecord(LOCAL_SENT, body);
  notifyUsageChanged();
  return note;
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
  return loadCollection(LOCAL_SCHEDULED);
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
  const note = insertRecord(LOCAL_SCHEDULED, body);
  notifyUsageChanged();
  return note;
}

export async function cancelScheduledLoveNote(id) {
  deleteRecord(LOCAL_SCHEDULED, id);
  notifyUsageChanged();
  return { id, status: 'cancelled' };
}
