/**
 * User Presence Service
 * Handles online/offline status tracking and real-time updates.
 *
 * Privacy rule: client presence queries request only the fields required to render
 * status. They do not request profile/email fields from user_presence_view.
 */

import { supabase } from './supabase';

let heartbeatInterval = null;
let presenceSubscription = null;
let lifecycleListenersBound = false;

const PRESENCE_SELECT = 'user_id,status,last_active,is_online,last_seen_text';
const ALLOWED_STATUSES = new Set(['online', 'offline', 'away', 'busy']);

const offlinePresence = (userId) => ({
  user_id: userId,
  status: 'offline',
  is_online: false,
  last_seen_text: 'Long time ago',
});

const getAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
};

// =====================================================
// PRESENCE MANAGEMENT
// =====================================================

export const setUserOnline = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false };

    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: user.id,
      p_status: 'online',
    });

    if (error) throw error;
    startHeartbeat();
    return { success: true };
  } catch (error) {
    console.warn('Unable to set presence online:', error);
    return { success: false, error };
  }
};

export const setUserOffline = async () => {
  try {
    const user = await getAuthenticatedUser();
    stopHeartbeat();
    if (!user) return { success: true };

    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: user.id,
      p_status: 'offline',
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.warn('Unable to set presence offline:', error);
    return { success: false, error };
  }
};

export const updateUserStatus = async (status) => {
  if (!ALLOWED_STATUSES.has(status)) throw new Error('Invalid presence status');

  const user = await getAuthenticatedUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.rpc('update_user_presence', {
    p_user_id: user.id,
    p_status: status,
  });

  if (error) throw error;
  if (status === 'online') startHeartbeat();
  else stopHeartbeat();
  return { success: true };
};

// =====================================================
// HEARTBEAT SYSTEM
// =====================================================

const startHeartbeat = () => {
  stopHeartbeat();

  heartbeatInterval = window.setInterval(async () => {
    try {
      const user = await getAuthenticatedUser();
      if (!user) {
        stopHeartbeat();
        return;
      }

      const { error } = await supabase.rpc('heartbeat_user_presence', {
        p_user_id: user.id,
      });

      if (error) console.warn('Presence heartbeat failed:', error);
    } catch (error) {
      console.warn('Presence heartbeat failed:', error);
    }
  }, 30_000);
};

const stopHeartbeat = () => {
  if (!heartbeatInterval) return;
  window.clearInterval(heartbeatInterval);
  heartbeatInterval = null;
};

// =====================================================
// PRESENCE QUERIES
// =====================================================

export const getUserPresence = async (userId) => {
  if (!userId) return offlinePresence(userId);

  try {
    const { data, error } = await supabase
      .from('user_presence_view')
      .select(PRESENCE_SELECT)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || offlinePresence(userId);
  } catch (error) {
    console.warn('Unable to fetch user presence:', error);
    return offlinePresence(userId);
  }
};

export const getMultipleUserPresence = async (userIds) => {
  try {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
    if (!uniqueIds.length) return {};

    const { data, error } = await supabase
      .from('user_presence_view')
      .select(PRESENCE_SELECT)
      .in('user_id', uniqueIds);

    if (error) throw error;

    const presenceMap = {};
    (data || []).forEach((presence) => {
      presenceMap[presence.user_id] = presence;
    });
    uniqueIds.forEach((userId) => {
      if (!presenceMap[userId]) presenceMap[userId] = offlinePresence(userId);
    });
    return presenceMap;
  } catch (error) {
    console.warn('Unable to fetch multiple presence records:', error);
    return {};
  }
};

export const getOnlineUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_presence_view')
      .select(PRESENCE_SELECT)
      .eq('is_online', true)
      .order('last_active', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Unable to fetch online users:', error);
    return [];
  }
};

export const getOnlineUsersCount = async () => {
  try {
    const { data, error } = await supabase.rpc('get_online_users_count');
    if (error) throw error;
    return Number(data) || 0;
  } catch (error) {
    console.warn('Unable to fetch online user count:', error);
    return 0;
  }
};

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

export const subscribeToPresence = (callback, userIds = null) => {
  unsubscribeFromPresence();

  const ids = [...new Set((userIds || []).filter(Boolean))];
  const config = {
    event: '*',
    schema: 'public',
    table: 'user_presence',
  };
  if (ids.length) config.filter = `user_id=in.(${ids.join(',')})`;

  presenceSubscription = supabase
    .channel(`user-presence-changes:${ids.length ? ids.join('-') : 'all'}`)
    .on('postgres_changes', config, (payload) => {
      if (typeof callback === 'function') callback(payload);
    })
    .subscribe();

  return presenceSubscription;
};

export const unsubscribeFromPresence = () => {
  if (!presenceSubscription) return;
  supabase.removeChannel(presenceSubscription);
  presenceSubscription = null;
};

// =====================================================
// LIFECYCLE MANAGEMENT
// =====================================================

const handleVisibilityChange = async () => {
  if (document.hidden) {
    stopHeartbeat();
    return;
  }
  await setUserOnline();
};

const handlePageHide = () => {
  // Do not attempt to synchronously destructure supabase.auth.getUser(): it is a
  // Promise and network work is not reliable during unload. Stop the heartbeat;
  // the server-side presence freshness window will age the session out. Explicit
  // sign-out still calls setUserOffline before the auth session is cleared.
  stopHeartbeat();
};

const handleBrowserOnline = async () => {
  await setUserOnline();
};

const handleBrowserOffline = () => {
  stopHeartbeat();
};

const bindLifecycleListeners = () => {
  if (lifecycleListenersBound) return;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('online', handleBrowserOnline);
  window.addEventListener('offline', handleBrowserOffline);
  lifecycleListenersBound = true;
};

const unbindLifecycleListeners = () => {
  if (!lifecycleListenersBound) return;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('pagehide', handlePageHide);
  window.removeEventListener('online', handleBrowserOnline);
  window.removeEventListener('offline', handleBrowserOffline);
  lifecycleListenersBound = false;
};

export const initializePresence = async () => {
  bindLifecycleListeners();
  return setUserOnline();
};

export const cleanupPresence = async () => {
  try {
    await setUserOffline();
  } finally {
    stopHeartbeat();
    unsubscribeFromPresence();
    unbindLifecycleListeners();
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Long time ago';

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now - lastSeenDate;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return 'Long time ago';
};

export const getStatusColor = (isOnline) =>
  isOnline ? 'bg-green-500' : 'bg-gray-400';

export const getStatusTextColor = (isOnline) =>
  isOnline ? 'text-green-600' : 'text-gray-500';

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
