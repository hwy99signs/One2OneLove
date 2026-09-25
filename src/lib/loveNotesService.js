import { apiRequest } from './apiClient';

function notifyUsageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o2ol-love-note-usage-changed'));
  }
}

function notifyQuotaError(error) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o2ol-love-note-quota-error', {
      detail: {
        message: error?.message || 'Love Note SMS delivery is unavailable.',
        code: error?.payload?.error?.code || null,
        topUpUrl: error?.payload?.error?.topUpUrl || null,
      },
    }));
  }
}

export async function getLoveNoteCategoryPreference() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const payload = await apiRequest(`/api/love-notes/categories?tz=${encodeURIComponent(timezone)}`);
  return payload?.preference || null;
}

export async function saveLoveNoteCategoryPreference(categories) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const payload = await apiRequest(`/api/love-notes/categories?tz=${encodeURIComponent(timezone)}`, {
    method: 'PUT',
    body: { categories },
  });
  return payload?.preference || null;
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
  try {
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
  } catch (error) {
    notifyQuotaError(error);
    throw error;
  }
}

export async function sendLoveNoteSms(data) {
  try {
    const payload = await apiRequest('/api/love-notes/send-sms', {
      method: 'POST',
      body: {
        note_title: data.note_title,
        note_content: data.note_content,
        recipient_phone: data.recipient_phone,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      },
    });
    notifyUsageChanged();
    return payload || null;
  } catch (error) {
    notifyQuotaError(error);
    throw error;
  }
}

export async function getLoveNoteDeliveryReadiness() {
  const payload = await apiRequest('/api/love-notes/delivery-readiness');
  return payload?.delivery || { scheduledSmsReady: false };
}

export async function listScheduledLoveNotes() {
  const payload = await apiRequest('/api/love-notes/scheduled');
  return payload?.notes || [];
}

export async function scheduleLoveNote(data) {
  const scheduledTimezone = data.scheduled_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
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
  } catch (error) {
    notifyQuotaError(error);
    throw error;
  }
}

export async function cancelScheduledLoveNote(id) {
  const payload = await apiRequest(`/api/love-notes/scheduled/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    body: {},
  });
  notifyUsageChanged();
  return payload?.note || null;
}
