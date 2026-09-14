import { apiRequest } from './apiClient';

let heartbeatInterval = null;
let pollInterval = null;
let visibilityBound = false;

const stopHeartbeat = () => {
  if (heartbeatInterval) window.clearInterval(heartbeatInterval);
  heartbeatInterval = null;
};

const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatInterval = window.setInterval(() => {
    apiRequest('/api/presence/heartbeat', { method: 'POST', body: {} }).catch(() => {});
  }, 30000);
};

export const updateUserStatus = async (status) => {
  const payload = await apiRequest('/api/presence', { method: 'POST', body: { status } });
  if (status === 'online') startHeartbeat();
  else stopHeartbeat();
  return payload?.presence || { success: true };
};

export const setUserOnline = async () => updateUserStatus('online');
export const setUserOffline = async () => updateUserStatus('offline');

export const getUserPresence = async (userId) => {
  try {
    const payload = await apiRequest(`/api/presence/${encodeURIComponent(userId)}`);
    return payload?.presence || offline(userId);
  } catch {
    return offline(userId);
  }
};

function offline(userId) {
  return { user_id: userId, status: 'offline', is_online: false, last_seen_text: 'Long time ago' };
}

export const getMultipleUserPresence = async (userIds) => {
  if (!userIds?.length) return {};
  try {
    const payload = await apiRequest('/api/presence/batch', {
      method: 'POST',
      body: { user_ids: userIds },
    });
    return payload?.presence || {};
  } catch {
    return Object.fromEntries(userIds.map((id) => [id, offline(id)]));
  }
};

export const getOnlineUsers = async () => {
  try {
    const payload = await apiRequest('/api/presence/online');
    return payload?.users || [];
  } catch {
    return [];
  }
};

export const getOnlineUsersCount = async () => {
  try {
    const payload = await apiRequest('/api/presence/count');
    return payload?.count || 0;
  } catch {
    return 0;
  }
};

export const subscribeToPresence = (callback, userIds = null) => {
  unsubscribeFromPresence();
  let previous = '';
  const poll = async () => {
    const data = userIds?.length ? await getMultipleUserPresence(userIds) : await getOnlineUsers();
    const signature = JSON.stringify(data);
    if (signature !== previous) {
      previous = signature;
      callback?.({ eventType: 'snapshot', data });
    }
  };
  poll().catch(() => {});
  pollInterval = window.setInterval(() => poll().catch(() => {}), 15000);
  return { unsubscribe: unsubscribeFromPresence };
};

export const unsubscribeFromPresence = () => {
  if (pollInterval) window.clearInterval(pollInterval);
  pollInterval = null;
};

const handleVisibilityChange = () => {
  if (document.hidden) stopHeartbeat();
  else setUserOnline().catch(() => {});
};
const handleBrowserOnline = () => setUserOnline().catch(() => {});
const handleBrowserOffline = () => setUserOffline().catch(() => {});

export const initializePresence = async () => {
  try {
    await setUserOnline();
  } catch {
    return;
  }
  if (!visibilityBound) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
    visibilityBound = true;
  }
};

export const cleanupPresence = async () => {
  stopHeartbeat();
  unsubscribeFromPresence();
  try { await setUserOffline(); } catch {}
  if (visibilityBound) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleBrowserOnline);
    window.removeEventListener('offline', handleBrowserOffline);
    visibilityBound = false;
  }
};

export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Long time ago';
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return 'Long time ago';
};

export const getStatusColor = (isOnline) => isOnline ? 'bg-green-500' : 'bg-gray-400';
export const getStatusTextColor = (isOnline) => isOnline ? 'text-green-600' : 'text-gray-500';

export default {
  setUserOnline, setUserOffline, updateUserStatus,
  getUserPresence, getMultipleUserPresence, getOnlineUsers, getOnlineUsersCount,
  subscribeToPresence, unsubscribeFromPresence,
  initializePresence, cleanupPresence,
  formatLastSeen, getStatusColor, getStatusTextColor,
};
