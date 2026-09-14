import { apiRequest } from '@/lib/apiClient';

export const getCalendarEvents = async (_userId, options = {}) => {
  const params = new URLSearchParams();
  if (options.eventType) params.set('eventType', options.eventType);
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.sortOrder) params.set('sortOrder', options.sortOrder);
  if (options.limit) params.set('limit', String(options.limit));
  const suffix = params.toString() ? `?${params.toString()}` : '';

  const payload = await apiRequest(`/api/calendar-events${suffix}`);
  return payload?.events || [];
};

export const getCalendarEvent = async (eventId, _userId) => {
  if (!eventId) throw new Error('Calendar event ID is required');
  const payload = await apiRequest(`/api/calendar-events/${encodeURIComponent(eventId)}`);
  return payload?.event || null;
};

export const createCalendarEvent = async (userId, eventData) => {
  if (!userId) throw new Error('User ID is required');
  if (!eventData?.title?.trim()) throw new Error('Event title is required');
  if (!eventData?.event_date) throw new Error('Event date is required');

  const body = {
    title: eventData.title.trim(),
    description: eventData.description || null,
    event_date: eventData.event_date,
    event_time: eventData.event_time || null,
    event_type: eventData.event_type || 'other',
    location: eventData.location || null,
    notes: eventData.notes || null,
    color: eventData.color || 'pink',
    reminder_enabled: eventData.reminder_enabled !== false,
    reminder_days_before: Number.isFinite(Number(eventData.reminder_days_before))
      ? Number(eventData.reminder_days_before)
      : 1,
    is_recurring: Boolean(eventData.is_recurring),
    recurrence_pattern: eventData.recurrence_pattern || null,
  };

  const payload = await apiRequest('/api/calendar-events', { method: 'POST', body });
  return payload?.event || null;
};

export const updateCalendarEvent = async (eventId, _userId, updates) => {
  if (!eventId) throw new Error('Calendar event ID is required');
  const payload = await apiRequest(`/api/calendar-events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: updates,
  });
  return payload?.event || null;
};

export const deleteCalendarEvent = async (eventId, _userId) => {
  if (!eventId) throw new Error('Calendar event ID is required');
  await apiRequest(`/api/calendar-events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
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
