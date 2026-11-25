import { formatLocalDateInput } from '@/utils/localDate';
import { loadCollection, insertRecord, updateRecord, deleteRecord, getRecord } from './guestStore';

// Guest mode is the ONLY mode (owner ruling, 2026-11-25): there are no
// members in the 100% free platform, so calendar events live in the
// browser-local guest store and this service never calls the member
// API. The server calendar API still exists in the worker but is
// switched off (410) with the rest of the member system, ready for
// future re-activation. User-id arguments are accepted for call-site
// compatibility and ignored.
const LOCAL = 'calendar_events';

function localEvents(options = {}) {
  let rows = loadCollection(LOCAL);
  if (options.eventType) rows = rows.filter(event => event?.event_type === options.eventType);
  if (options.startDate) rows = rows.filter(event => String(event?.event_date || '') >= String(options.startDate));
  if (options.endDate) rows = rows.filter(event => String(event?.event_date || '') <= String(options.endDate));
  const sortBy = options.sortBy || 'event_date';
  const dir = String(options.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  rows = [...rows].sort((a, b) => String(a?.[sortBy] || '').localeCompare(String(b?.[sortBy] || '')) * dir);
  if (options.limit) rows = rows.slice(0, Number(options.limit));
  return rows;
}

export const getCalendarEvents = async (_userId, options = {}) => localEvents(options);

export const getCalendarEvent = async (eventId, _userId) => {
  if (!eventId) throw new Error('Calendar event ID is required');
  return getRecord(LOCAL, eventId);
};

export const createCalendarEvent = async (_userId, eventData) => {
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

  return insertRecord(LOCAL, body);
};

export const updateCalendarEvent = async (eventId, _userId, updates) => {
  if (!eventId) throw new Error('Calendar event ID is required');
  return updateRecord(LOCAL, eventId, updates || {});
};

export const deleteCalendarEvent = async (eventId, _userId) => {
  if (!eventId) throw new Error('Calendar event ID is required');
  deleteRecord(LOCAL, eventId);
};

export const getUpcomingEvents = async (userId, limit = 10) => {
  const today = formatLocalDateInput();
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
    startDate: formatLocalDateInput(start),
    endDate: formatLocalDateInput(end),
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
  const today = formatLocalDateInput();
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
    startDate: formatLocalDateInput(start),
    endDate: formatLocalDateInput(end),
    sortBy: 'event_date',
    sortOrder: 'asc',
  });
};

export const getThisMonthEvents = async (userId) => getEventsForMonth(userId, new Date());

export const getUpcomingEventsFilter = async (userId) => {
  const today = formatLocalDateInput();
  return getCalendarEvents(userId, {
    startDate: today,
    sortBy: 'event_date',
    sortOrder: 'asc',
  });
};
