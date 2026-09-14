import { apiRequest } from './apiClient';

function notifyUsageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o2ol-love-note-usage-changed'));
  }
}

export async function getLoveNoteUsage() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const payload = await apiRequest(`/api/love-notes/usage?tz=${encodeURIComponent(timezone)}`);
  return payload?.usage || null;
}

export async function listSentLoveNotes() {
  const payload = await apiRequest('/api/love-notes/sent');
  return payload?.notes || [];
}

export async function recordSentLoveNote(data) {
  const payload = await apiRequest('/api/love-notes/sent', {
    method: 'POST',
    body: {
      note_title: data.note_title,
      note_content: data.note_content,
      recipient_type: data.recipient_type,
      recipient_identifier: data.recipient_identifier || null,
      social_platform: data.social_platform || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  });
  notifyUsageChanged();
  return payload?.note || null;
}

export async function listScheduledLoveNotes() {
  const payload = await apiRequest('/api/love-notes/scheduled');
  return payload?.notes || [];
}

export async function scheduleLoveNote(data) {
  const scheduledTimezone = data.scheduled_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const payload = await apiRequest('/api/love-notes/scheduled', {
    method: 'POST',
    body: {
      note_title: data.note_title,
      note_content: data.note_content,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      scheduled_timezone: scheduledTimezone,
      recipient_phone: data.recipient_phone,
      delivery_method: data.delivery_method || 'sms',
      note_language: data.note_language || 'en',
    },
  });
  notifyUsageChanged();
  return payload?.note || null;
}

export async function cancelScheduledLoveNote(id) {
  const payload = await apiRequest(`/api/love-notes/scheduled/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    body: {},
  });
  notifyUsageChanged();
  return payload?.note || null;
}
