/**
 * User Presence Service
 * Presence persistence now runs through the authenticated Cloudflare Worker.
 * The previous Supabase realtime subscription is temporarily represented by a
 * lightweight polling compatibility layer until the dedicated realtime chat /
 * presence transport is cut over.
 */

import { ONE2ONE_API_BASE } from './one2oneApi';
import { presenceApi } from './presenceApi';

let heartbeatInterval = null;
let presenceSubscription = null;
let initialized = false;

const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatInterval = setInterval(async () => {
    try {
      await presenceApi.heartbeat();
    } catch (error) {
      console.warn('Presence heartbeat failed:', error);
      if (error?.status === 401) stopHeartbeat();
    }
  }, 30000);
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

export const setUserOnline = async () => {
  try {
    const presence = await presenceApi.setStatus('online');
    startHeartbeat();
    return { success: true, presence };
  } catch (error) {
    console.error('Error setting user online:', error);
    throw error;
  }
};

export const setUserOffline = async () => {
  try {
    stopHeartbeat();
    const presence = await presenceApi.setStatus('offline');
    return { success: true, presence };
  } catch (error) {
    console.error('Error setting user offline:', error);
    throw error;
  }
};

export const updateUserStatus = async (status) => {
  try {
    const presence = await presenceApi.setStatus(status);
    if (status === 'online') startHeartbeat();
    else stopHeartbeat();
    return { success: true, presence };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const getUserPresence = async (userId) => {
  try {
    return await presenceApi.get(userId);
  } catch (error) {
    console.error('Error fetching user presence:', error);
    return { user_id: userId, status: 'offline', is_online: false, last_seen_text: 'Long time ago' };
  }
};

export const getMultipleUserPresence = async (userIds) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) return {};
    return await presenceApi.batch(userIds);
  } catch (error) {
    console.error('Error fetching multiple user presence:', error);
    return {};
  }
};

export const getOnlineUsers = async () => {
  try { return await presenceApi.online(); }
  catch (error) { console.error('Error fetching online users:', error); return []; }
};

export const getOnlineUsersCount = async () => {
  try { return await presenceApi.count(); }
  catch (error) { console.error('Error fetching online user count:', error); return 0; }
};

export const subscribeToPresence = (callback, userIds = null) => {
  unsubscribeFromPresence();
  let stopped = false;

  const sync = async () => {
    if (stopped) return;
    try {
      let presence;
      if (Array.isArray(userIds) && userIds.length) {
        presence = await getMultipleUserPresence(userIds);
      } else {
        const online = await getOnlineUsers();
        presence = Object.fromEntries(online.map((item) => [item.user_id, item]));
      }
      if (!stopped && typeof callback === 'function') {
        callback({ eventType: 'PRESENCE_SYNC', presence });
      }
    } catch (error) {
      console.warn('Presence subscription sync failed:', error);
    }
  };

  sync();
  const interval = setInterval(sync, 10000);
  presenceSubscription = {
    unsubscribe() {
      stopped = true;
      clearInterval(interval);
    },
  };
  return presenceSubscription;
};

export const unsubscribeFromPresence = () => {
  if (presenceSubscription?.unsubscribe) presenceSubscription.unsubscribe();
  presenceSubscription = null;
};

const handleVisibilityChange = async () => {
  if (document.hidden) {
    stopHeartbeat();
    try { await presenceApi.setStatus('away'); } catch { /* best effort */ }
  } else {
    try { await setUserOnline(); } catch { /* session may have expired */ }
  }
};

const handleBeforeUnload = () => {
  stopHeartbeat();
  try {
    const endpoint = `${ONE2ONE_API_BASE}/api/presence`;
    const payload = new Blob([JSON.stringify({ status: 'offline' })], { type: 'application/json' });
    navigator.sendBeacon(endpoint, payload);
  } catch {
    // Unload presence is best-effort; stale online records expire server-side.
  }
};

const handleBrowserOnline = async () => {
  try { await setUserOnline(); } catch { /* session may have expired */ }
};

const handleBrowserOffline = () => {
  stopHeartbeat();
};

export const initializePresence = async () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    await setUserOnline();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
  } catch (error) {
    initialized = false;
    console.warn('Presence initialization skipped:', error);
  }
};

export const cleanupPresence = async () => {
  stopHeartbeat();
  unsubscribeFromPresence();
  if (typeof window !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('online', handleBrowserOnline);
    window.removeEventListener('offline', handleBrowserOffline);
  }
  if (initialized) {
    try { await presenceApi.setStatus('offline'); } catch { /* best effort */ }
  }
  initialized = false;
};

export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Long time ago';
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now - lastSeenDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return 'Long time ago';
};

export const getStatusColor = (isOnline) => isOnline ? 'bg-green-500' : 'bg-gray-400';
export const getStatusTextColor = (isOnline) => isOnline ? 'text-green-600' : 'text-gray-500';

export default {
  setUserOnline,
  setUserOffline,
  updateUserStatus,
  getUserPresence,
  getMultipleUserPresence,
  getOnlineUsers,
  getOnlineUsersCount,
  subscribeToPresence,
  unsubscribeFromPresence,
  initializePresence,
  cleanupPresence,
  formatLastSeen,
  getStatusColor,
  getStatusTextColor,
};
