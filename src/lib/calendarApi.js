import { apiRequest } from './one2oneApi';

export const calendarApi = {
  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.eventType) params.set('eventType', options.eventType);
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options.limit) params.set('limit', String(options.limit));
    const query = params.toString();
    const data = await apiRequest(`/api/calendar-events${query ? `?${query}` : ''}`);
    return data?.events || [];
  },
  async get(eventId) {
    const data = await apiRequest(`/api/calendar-events/${eventId}`);
    return data?.event || null;
  },
  async create(payload) {
    const data = await apiRequest('/api/calendar-events', { method: 'POST', body: payload });
    return data?.event || null;
  },
  async update(eventId, payload) {
    const data = await apiRequest(`/api/calendar-events/${eventId}`, { method: 'PATCH', body: payload });
    return data?.event || null;
  },
  async remove(eventId) {
    return apiRequest(`/api/calendar-events/${eventId}`, { method: 'DELETE' });
  },
};

export default calendarApi;
