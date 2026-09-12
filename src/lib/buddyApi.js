import { apiRequest } from './one2oneApi';

export const buddyApi = {
  async users(options = {}) {
    const params = new URLSearchParams();
    if (options.userType) params.set('userType', options.userType);
    if (options.search) params.set('search', options.search);
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options.limit) params.set('limit', String(options.limit));
    const query = params.toString();
    const data = await apiRequest(`/api/buddies/users${query ? `?${query}` : ''}`);
    return data?.users || [];
  },
  async user(userId) {
    const data = await apiRequest(`/api/buddies/users/${userId}`);
    return data?.user || null;
  },
  async send(toUserId) {
    const data = await apiRequest('/api/buddies/requests', { method: 'POST', body: { to_user_id: toUserId } });
    return data?.request || null;
  },
  async requests(direction) {
    const data = await apiRequest(`/api/buddies/requests?direction=${encodeURIComponent(direction)}`);
    return data?.requests || [];
  },
  async cancel(requestId) {
    return apiRequest(`/api/buddies/requests/${requestId}`, { method: 'DELETE' });
  },
  async respond(requestId, action) {
    const data = await apiRequest(`/api/buddies/requests/${requestId}`, { method: 'PATCH', body: { action } });
    return data?.request || null;
  },
  async mine() {
    const data = await apiRequest('/api/buddies');
    return data?.buddies || [];
  },
};

export default buddyApi;
