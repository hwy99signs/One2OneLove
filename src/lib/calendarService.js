import { calendarApi } from './calendarApi';

/**
 * Calendar Events Service
 * Public function signatures are retained for compatibility. The userId
 * argument is no longer trusted for authorization; the Worker uses the active
 * Neon Auth session to scope every operation to the signed-in user.
 */

export const getCalendarEvents = async (_userId, options = {}) => {
  try {
    return await calendarApi.list(options);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error(error.message || 'Unable to fetch calendar events');
  }
};

export const getCalendarEvent = async (eventId, _userId) => {
  try {
    return await calendarApi.get(eventId);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    throw new Error(error.message || 'Unable to fetch calendar event');
  }
};

export const createCalendarEvent = async (_userId, eventData) => {
  try {
    if (!eventData?.title?.trim()) throw new Error('Event title is required');
    if (!eventData?.event_date) throw new Error('Event date is required');
    return await calendarApi.create({
      ...eventData,
      title: eventData.title.trim(),
      event_type: eventData.event_type || 'other',
      color: eventData.color || 'pink',
      reminder_enabled: eventData.reminder_enabled !== false,
      reminder_days_before: eventData.reminder_days_before ?? 1,
      is_recurring: Boolean(eventData.is_recurring),
      recurrence_pattern: eventData.recurrence_pattern || null,
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error(error.message || 'Failed to create event');
  }
};

export const updateCalendarEvent = async (eventId, _userId, updates) => {
  try {
    return await calendarApi.update(eventId, updates);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error(error.message || 'Unable to update calendar event');
  }
};

export const deleteCalendarEvent = async (eventId, _userId) => {
  try {
    await calendarApi.remove(eventId);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error(error.message || 'Unable to delete calendar event');
  }
};

export const getUpcomingEvents = async (_userId, limit = 10) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    return await calendarApi.list({ startDate: today, sortBy: 'event_date', sortOrder: 'asc', limit });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw new Error(error.message || 'Unable to fetch upcoming events');
  }
};

export const getEventsForMonth = async (_userId, month) => {
  try {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return await calendarApi.list({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      sortBy: 'event_date',
      sortOrder: 'asc',
    });
  } catch (error) {
    console.error('Error fetching events for month:', error);
    throw new Error(error.message || 'Unable to fetch events for month');
  }
};

export const getEventsByType = async (_userId, eventType) => {
  try {
    return await calendarApi.list({ eventType, sortBy: 'event_date', sortOrder: 'asc' });
  } catch (error) {
    console.error('Error fetching events by type:', error);
    throw new Error(error.message || 'Unable to fetch events by type');
  }
};

export const getTodayEvents = async (_userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    return await calendarApi.list({ startDate: today, endDate: today, sortBy: 'event_time', sortOrder: 'asc' });
  } catch (error) {
    console.error('Error fetching today events:', error);
    throw new Error(error.message || 'Unable to fetch today events');
  }
};

export const getThisWeekEvents = async (_userId) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return await calendarApi.list({
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
      sortBy: 'event_date',
      sortOrder: 'asc',
    });
  } catch (error) {
    console.error('Error fetching this week events:', error);
    throw new Error(error.message || 'Unable to fetch this week events');
  }
};

export const getThisMonthEvents = async (_userId) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return await calendarApi.list({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      sortBy: 'event_date',
      sortOrder: 'asc',
    });
  } catch (error) {
    console.error('Error fetching this month events:', error);
    throw new Error(error.message || 'Unable to fetch this month events');
  }
};

export const getUpcomingEventsFilter = async (_userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    return await calendarApi.list({ startDate: today, sortBy: 'event_date', sortOrder: 'asc' });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw new Error(error.message || 'Unable to fetch upcoming events');
  }
};
