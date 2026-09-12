import { apiRequest } from './one2oneApi';

export const presenceApi = {
  async setStatus(status) {
    const data = await apiRequest('/api/presence', { method: 'PATCH', body: { status } });
    return data?.presence || null;
  },
  async heartbeat() {
    return apiRequest('/api/presence/heartbeat', { method: 'POST', body: {} });
  },
  async get(userId) {
    const data = await apiRequest(`/api/presence/${userId}`);
    return data?.presence || null;
  },
  async batch(userIds) {
    const data = await apiRequest('/api/presence/batch', { method: 'POST', body: { user_ids: userIds } });
    return data?.presence || {};
  },
  async online() {
    const data = await apiRequest('/api/presence/online');
    return data?.users || [];
  },
  async count() {
    const data = await apiRequest('/api/presence/count');
    return data?.count || 0;
  },
};

export default presenceApi;
