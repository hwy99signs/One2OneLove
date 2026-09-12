import { apiRequest } from './one2oneApi';

export const storyApi = {
  async list(orderBy = '-created_at', storyType = null, searchQuery = null) {
    const params = new URLSearchParams();
    params.set('order', orderBy);
    if (storyType) params.set('type', storyType);
    if (searchQuery) params.set('search', searchQuery);
    const data = await apiRequest(`/api/stories?${params.toString()}`);
    return data?.stories || [];
  },
  async get(storyId) {
    const data = await apiRequest(`/api/stories/${storyId}`);
    return data?.story || null;
  },
  async mine() {
    const data = await apiRequest('/api/stories/mine');
    return data?.stories || [];
  },
  async create(payload) {
    const data = await apiRequest('/api/stories', { method: 'POST', body: payload });
    return data?.story || null;
  },
  async update(storyId, payload) {
    const data = await apiRequest(`/api/stories/${storyId}`, { method: 'PATCH', body: payload });
    return data?.story || null;
  },
  async remove(storyId) {
    return apiRequest(`/api/stories/${storyId}`, { method: 'DELETE' });
  },
  async like(storyId, enabled = true) {
    return apiRequest(`/api/stories/${storyId}/like`, { method: enabled ? 'POST' : 'DELETE', body: enabled ? {} : undefined });
  },
  async helpful(storyId, enabled = true) {
    return apiRequest(`/api/stories/${storyId}/helpful`, { method: enabled ? 'POST' : 'DELETE', body: enabled ? {} : undefined });
  },
  async approve(storyId) {
    const data = await apiRequest(`/api/stories/${storyId}/approve`, { method: 'PATCH', body: {} });
    return data?.story || null;
  },
  async reject(storyId, notes = '') {
    const data = await apiRequest(`/api/stories/${storyId}/reject`, { method: 'PATCH', body: { notes } });
    return data?.story || null;
  },
  async feature(storyId, featured = true) {
    const data = await apiRequest(`/api/stories/${storyId}/feature`, { method: 'PATCH', body: { featured } });
    return data?.story || null;
  },
  async stats() {
    const data = await apiRequest('/api/stories/stats');
    return data?.stats || { total: 0, approved: 0, pending: 0, rejected: 0, totalLikes: 0, totalViews: 0 };
  },
};

export default storyApi;
