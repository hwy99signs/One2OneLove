const LOCAL_KEY = 'o2ol_calendar_events_local_v1';

function storageKey(userId) {
  return `${LOCAL_KEY}:${userId || 'guest'}`;
}

function readLocal(userId) {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(userId, events) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(events));
  } catch {
    // Local persistence is a resilience fallback only.
  }
}

function localId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Calendar request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function shouldFallback(error) {
  return !error?.status || error.status === 401 || error.status === 403 || error.status === 404;
}

function sortEvents(events, sortBy = 'event_date', sortOrder = 'asc') {
  const direction = sortOrder === 'desc' ? -1 : 1;
  return [...events].sort((a, b) => {
    const av = a?.[sortBy] ?? '';
    const bv = b?.[sortBy] ?? '';
    if (av === bv) return String(a?.event_time || '').localeCompare(String(b?.event_time || '')) * direction;
    return String(av).localeCompare(String(bv)) * direction;
  });
}

function filterLocal(events, options = {}) {
  let out = [...events];
  if (options.eventType) out = out.filter(event => event.event_type === options.eventType);
  if (options.startDate) out = out.filter(event => String(event.event_date) >= options.startDate);
  if (options.endDate) out = out.filter(event => String(event.event_date) <= options.endDate);
  out = sortEvents(out, options.sortBy || 'event_date', options.sortOrder || 'asc');
  if (options.limit) out = out.slice(0, options.limit);
  return out;
}

export const getCalendarEvents = async (userId, options = {}) => {
  const params = new URLSearchParams();
  if (options.eventType) params.set('eventType', options.eventType);
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.sortOrder) params.set('sortOrder', options.sortOrder);
  if (options.limit) params.set('limit', String(options.limit));
  const suffix = params.toString() ? `?${params.toString()}` : '';

  try {
    const payload = await apiRequest(`/api/calendar-events${suffix}`);
    return payload.events || [];
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return filterLocal(readLocal(userId), options);
  }
};

export const getCalendarEvent = async (eventId, userId) => {
  if (!String(eventId || '').startsWith('local-')) {
    try {
      const payload = await apiRequest(`/api/calendar-events/${encodeURIComponent(eventId)}`);
      return payload.event;
    } catch (error) {
      if (!shouldFallback(error)) throw error;
    }
  }
  return readLocal(userId).find(event => event.id === eventId) || null;
};

export const createCalendarEvent = async (userId, eventData) => {
  if (!userId) throw new Error('User ID is required');
  if (!eventData?.title?.trim()) throw new Error('Event title is required');
  if (!eventData?.event_date) throw new Error('Event date is required');

  const payload = {
    title: eventData.title.trim(),
    description: eventData.description || null,
    event_date: eventData.event_date,
    event_time: eventData.event_time || null,
    event_type: eventData.event_type || 'other',
    location: eventData.location || null,
    notes: eventData.notes || null,
    color: eventData.color || 'pink',
    reminder_enabled: eventData.reminder_enabled !== false,
    reminder_days_before: Number.isFinite(Number(eventData.reminder_days_before)) ? Number(eventData.reminder_days_before) : 1,
    is_recurring: Boolean(eventData.is_recurring),
    recurrence_pattern: eventData.recurrence_pattern || null,
  };

  try {
    const result = await apiRequest('/api/calendar-events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.event;
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    const events = readLocal(userId);
    const event = {
      id: localId(),
      user_id: userId,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      __local: true,
    };
    writeLocal(userId, [event, ...events]);
    return event;
  }
};

export const updateCalendarEvent = async (eventId, userId, updates) => {
  if (!String(eventId || '').startsWith('local-')) {
    try {
      const payload = await apiRequest(`/api/calendar-events/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return payload.event;
    } catch (error) {
      if (!shouldFallback(error)) throw error;
    }
  }

  const events = readLocal(userId);
  const index = events.findIndex(event => event.id === eventId);
  if (index === -1) throw new Error('Calendar event not found');
  const updated = { ...events[index], ...updates, updated_at: new Date().toISOString(), __local: true };
  const next = [...events];
  next[index] = updated;
  writeLocal(userId, next);
  return updated;
};

export const deleteCalendarEvent = async (eventId, userId) => {
  if (!String(eventId || '').startsWith('local-')) {
    try {
      await apiRequest(`/api/calendar-events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
      return;
    } catch (error) {
      if (!shouldFallback(error)) throw error;
    }
  }
  writeLocal(userId, readLocal(userId).filter(event => event.id !== eventId));
};

export const getUpcomingEvents = async (userId, limit = 10) => {
  const today = new Date().toISOString().split('T')[0];
  return getCalendarEvents(userId, {
    startDate: today,
    sortBy: 'event_date',
    sortOrder: 'asc',
    limit,
  });
};

export const getEventsForMonth = async (userId, month) => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return getCalendarEvents(userId, {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    sortBy: 'event_date',
    sortOrder: 'asc',
  });
};

export const getEventsByType = async (userId, eventType) => getCalendarEvents(userId, {
  eventType,
  sortBy: 'event_date',
  sortOrder: 'asc',
});

export const getTodayEvents = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  return getCalendarEvents(userId, {
    startDate: today,
    endDate: today,
    sortBy: 'event_date',
    sortOrder: 'asc',
  });
};

export const getThisWeekEvents = async (userId) => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return getCalendarEvents(userId, {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    sortBy: 'event_date',
    sortOrder: 'asc',
  });
};

export const getThisMonthEvents = async (userId) => getEventsForMonth(userId, new Date());

export const getUpcomingEventsFilter = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  return getCalendarEvents(userId, {
    startDate: today,
    sortBy: 'event_date',
    sortOrder: 'asc',
  });
};
