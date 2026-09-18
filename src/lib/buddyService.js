import { apiRequest } from './apiClient';

function userParams(options = {}) {
  const params = new URLSearchParams();
  if (options.userType) params.set('userType', options.userType);
  if (options.search) params.set('search', options.search);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.sortOrder) params.set('sortOrder', options.sortOrder);
  if (options.limit) params.set('limit', String(options.limit));
  return params;
}

export const getAllUsers = async (_currentUserId, options = {}) => {
  const params = userParams(options);
  const payload = await apiRequest(`/api/buddies/users${params.toString() ? `?${params}` : ''}`);
  return payload?.users || [];
};

export const searchUsers = async (_currentUserId, searchQuery) => {
  const params = userParams({ search: searchQuery, userType: 'regular', sortBy: 'name', sortOrder: 'asc', limit: 100 });
  const payload = await apiRequest(`/api/buddies/users?${params}`);
  return payload?.users || [];
};

export const findUserByEmail = async (email) => {
  const params = new URLSearchParams({ email: String(email || '').trim() });
  const payload = await apiRequest(`/api/buddies/users/by-email?${params}`);
  return payload?.user || null;
};

export const getUserProfile = async (userId) => {
  const payload = await apiRequest(`/api/buddies/users/${encodeURIComponent(userId)}`);
  return payload?.user || null;
};

export const sendBuddyRequest = async (_fromUserId, toUserId) => {
  const payload = await apiRequest('/api/buddies/requests', {
    method: 'POST',
    body: { to_user_id: toUserId },
  });
  return payload?.request || null;
};

export const cancelBuddyRequest = async (requestId) => {
  await apiRequest(`/api/buddies/requests/${encodeURIComponent(requestId)}`, { method: 'DELETE' });
};

export const getSentBuddyRequests = async () => {
  const payload = await apiRequest('/api/buddies/requests?direction=sent');
  return payload?.requests || [];
};

export const getReceivedBuddyRequests = async () => {
  const payload = await apiRequest('/api/buddies/requests?direction=received');
  return payload?.requests || [];
};

export const acceptBuddyRequest = async (requestId) => {
  const payload = await apiRequest(`/api/buddies/requests/${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    body: { action: 'accept' },
  });
  return payload?.request || null;
};

export const rejectBuddyRequest = async (requestId) => {
  await apiRequest(`/api/buddies/requests/${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    body: { action: 'reject' },
  });
};

export const getMyBuddies = async () => {
  const payload = await apiRequest('/api/buddies');
  return payload?.buddies || [];
};
