import { supabase, handleSupabaseError } from './supabase';

/**
 * Calendar Events Service
 * Handles all calendar event operations with Supabase
 */

/**
 * Get all calendar events for the current user
 * @param {string} userId - The user's ID
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Array>} Array of calendar events
 */
export const getCalendarEvents = async (userId, options = {}) => {
  try {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.startDate) {
      query = query.gte('event_date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('event_date', options.endDate);
    }

    // Apply sorting (default: event_date ascending)
    const sortBy = options.sortBy || 'event_date';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get a single calendar event by ID
 * @param {string} eventId - The event ID
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Calendar event
 */
export const getCalendarEvent = async (eventId, userId) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Create a new calendar event
 * @param {string} userId - The user's ID
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
export const createCalendarEvent = async (userId, eventData) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        title: eventData.title,
        description: eventData.description || null,
        event_date: eventData.event_date,
        event_time: eventData.event_time || null,
        event_type: eventData.event_type || 'other',
        location: eventData.location || null,
        notes: eventData.notes || null,
        color: eventData.color || 'pink',
        reminder_enabled: eventData.reminder_enabled !== false,
        reminder_days_before: eventData.reminder_days_before || 1,
        is_recurring: eventData.is_recurring || false,
        recurrence_pattern: eventData.recurrence_pattern || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Update an existing calendar event
 * @param {string} eventId - The event ID
 * @param {string} userId - The user's ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event
 */
export const updateCalendarEvent = async (eventId, userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Delete a calendar event
 * @param {string} eventId - The event ID
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export const deleteCalendarEvent = async (eventId, userId) => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get upcoming events (events in the future)
 * @param {string} userId - The user's ID
 * @param {number} limit - Number of events to return
 * @returns {Promise<Array>} Array of upcoming events
 */
export const getUpcomingEvents = async (userId, limit = 10) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get events for a specific month
 * @param {string} userId - The user's ID
 * @param {Date} month - The month to query
 * @returns {Promise<Array>} Array of events in the month
 */
export const getEventsForMonth = async (userId, month) => {
  try {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events for month:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get events by type
 * @param {string} userId - The user's ID
 * @param {string} eventType - The event type to filter by
 * @returns {Promise<Array>} Array of events
 */
export const getEventsByType = async (userId, eventType) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events by type:', error);
    throw new Error(handleSupabaseError(error));
  }
};

