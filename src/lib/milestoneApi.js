import { apiRequest, ONE2ONE_API_BASE } from './one2oneApi';

export const milestoneApi = {
  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.order) params.set('order', options.order);
    if (options.type) params.set('type', options.type);
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);
    if (options.recurring === true) params.set('recurring', 'true');
    if (options.recurring === false) params.set('recurring', 'false');
    const query = params.toString();
    const data = await apiRequest(`/api/milestones${query ? `?${query}` : ''}`);
    return data?.milestones || [];
  },
  async get(milestoneId) {
    const data = await apiRequest(`/api/milestones/${milestoneId}`);
    return data?.milestone || null;
  },
  async create(payload) {
    const data = await apiRequest('/api/milestones', { method: 'POST', body: payload });
    return data?.milestone || null;
  },
  async update(milestoneId, payload) {
    const data = await apiRequest(`/api/milestones/${milestoneId}`, { method: 'PATCH', body: payload });
    return data?.milestone || null;
  },
  async remove(milestoneId) {
    return apiRequest(`/api/milestones/${milestoneId}`, { method: 'DELETE' });
  },
  async uploadPhoto(file, milestoneId = null) {
    const query = milestoneId ? `?milestoneId=${encodeURIComponent(milestoneId)}` : '';
    const response = await fetch(`${ONE2ONE_API_BASE}/api/milestones/media${query}`, {
      method: 'POST',
      headers: { 'content-type': file.type },
      body: file,
      credentials: 'include',
      cache: 'no-store',
    });
    const type = response.headers.get('content-type') || '';
    const data = type.includes('application/json') ? await response.json() : null;
    if (!response.ok) throw new Error(data?.error?.message || `Photo upload failed (${response.status})`);
    return data?.url || null;
  },
  async deletePhoto(photoUrl) {
    const match = String(photoUrl || '').match(/\/api\/media\/milestones\/[0-9a-f-]{36}\/([0-9a-f-]{36})/i);
    if (!match) throw new Error('Invalid milestone photo URL');
    return apiRequest(`/api/milestones/media/${match[1]}`, { method: 'DELETE' });
  },
};

export default milestoneApi;
