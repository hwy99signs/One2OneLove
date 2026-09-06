import { apiRequest } from './one2oneApi';

export const journalApi = {
  async list({ orderBy = '-entry_date', mood = null, favorite = false } = {}) {
    const params = new URLSearchParams();
    params.set('order', orderBy);
    if (mood) params.set('mood', mood);
    if (favorite) params.set('favorite', 'true');
    const data = await apiRequest(`/api/journals?${params.toString()}`);
    return data?.entries || [];
  },
  async get(entryId) {
    const data = await apiRequest(`/api/journals/${entryId}`);
    return data?.entry || null;
  },
  async create(payload) {
    const data = await apiRequest('/api/journals', { method: 'POST', body: payload });
    return data?.entry || null;
  },
  async update(entryId, payload) {
    const data = await apiRequest(`/api/journals/${entryId}`, { method: 'PATCH', body: payload });
    return data?.entry || null;
  },
  async remove(entryId) {
    return apiRequest(`/api/journals/${entryId}`, { method: 'DELETE' });
  },
  async stats() {
    const data = await apiRequest('/api/journals/stats');
    return data?.stats || { total: 0, favorites: 0, byMood: {} };
  },
};

export default journalApi;
