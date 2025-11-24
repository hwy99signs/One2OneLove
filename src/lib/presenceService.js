/**
 * User Presence Service
 * Handles online/offline status tracking and real-time updates
 */

import { supabase } from './supabase';

let heartbeatInterval = null;
let presenceSubscription = null;

// =====================================================
// PRESENCE MANAGEMENT
// =====================================================

/**
 * Set user as online
 * Call this when user logs in or app becomes active
 */
export const setUserOnline = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⚠️ No user found, cannot set online');
      return;
    }

    console.log('🟢 Setting user online:', user.id);

    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: user.id,
      p_status: 'online'
    });

    if (error) throw error;

    // Start heartbeat to keep user online
    startHeartbeat();

    console.log('✅ User set to online');
    return { success: true };
  } catch (error) {
    console.error('❌ Error setting user online:', error);
    throw error;
  }
};

/**
 * Set user as offline
 * Call this when user logs out or app closes
 */
export const setUserOffline = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('🔴 Setting user offline:', user.id);

    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: user.id,
      p_status: 'offline'
    });

    if (error) throw error;

    // Stop heartbeat
    stopHeartbeat();

    console.log('✅ User set to offline');
    return { success: true };
  } catch (error) {
    console.error('❌ Error setting user offline:', error);
    throw error;
  }
};

/**
 * Update user status (online, offline, away, busy)
 * @param {string} status - User status
 */
export const updateUserStatus = async (status) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`🔄 Updating user status to: ${status}`);

    const { error } = await supabase.rpc('update_user_presence', {
      p_user_id: user.id,
      p_status: status
    });

    if (error) throw error;

    if (status === 'online') {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    console.log('✅ User status updated');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    throw error;
  }
};

// =====================================================
// HEARTBEAT SYSTEM
// =====================================================

/**
 * Start heartbeat to keep user online
 * Sends a heartbeat every 30 seconds
 */
const startHeartbeat = () => {
  // Clear any existing interval
  stopHeartbeat();

  console.log('💓 Starting presence heartbeat');

  // Send heartbeat every 30 seconds
  heartbeatInterval = setInterval(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ No user found, stopping heartbeat');
        stopHeartbeat();
        return;
      }

      console.log('💓 Sending heartbeat');

      const { error } = await supabase.rpc('heartbeat_user_presence', {
        p_user_id: user.id
      });

      if (error) {
        console.error('❌ Heartbeat error:', error);
      }
    } catch (error) {
      console.error('❌ Heartbeat failed:', error);
    }
  }, 30000); // 30 seconds
};

/**
 * Stop heartbeat
 */
const stopHeartbeat = () => {
  if (heartbeatInterval) {
    console.log('💔 Stopping presence heartbeat');
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

// =====================================================
// PRESENCE QUERIES
// =====================================================

/**
 * Get presence status for a specific user
 * @param {string} userId - User ID
 */
export const getUserPresence = async (userId) => {
  try {
    console.log('👤 Fetching presence for user:', userId);

    const { data, error } = await supabase
      .from('user_presence_view')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no presence record, return offline
    if (!data) {
      return {
        user_id: userId,
        status: 'offline',
        is_online: false,
        last_seen_text: 'Long time ago',
      };
    }

    console.log('✅ User presence:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching user presence:', error);
    // Return offline as default
    return {
      user_id: userId,
      status: 'offline',
      is_online: false,
      last_seen_text: 'Long time ago',
    };
  }
};

/**
 * Get presence status for multiple users
 * @param {string[]} userIds - Array of user IDs
 */
export const getMultipleUserPresence = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return {};
    }

    console.log('👥 Fetching presence for multiple users:', userIds.length);

    const { data, error } = await supabase
      .from('user_presence_view')
      .select('*')
      .in('user_id', userIds);

    if (error) throw error;

    // Convert to map for easy lookup
    const presenceMap = {};
    data?.forEach(presence => {
      presenceMap[presence.user_id] = presence;
    });

    // Add offline status for users without presence records
    userIds.forEach(userId => {
      if (!presenceMap[userId]) {
        presenceMap[userId] = {
          user_id: userId,
          status: 'offline',
          is_online: false,
          last_seen_text: 'Long time ago',
        };
      }
    });

    console.log(`✅ Fetched presence for ${Object.keys(presenceMap).length} users`);
    return presenceMap;
  } catch (error) {
    console.error('❌ Error fetching multiple user presence:', error);
    return {};
  }
};

/**
 * Get all online users
 */
export const getOnlineUsers = async () => {
  try {
    console.log('🟢 Fetching all online users');

    const { data, error } = await supabase
      .from('user_presence_view')
      .select('*')
      .eq('is_online', true)
      .order('last_active', { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} online users`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching online users:', error);
    return [];
  }
};

/**
 * Get online users count
 */
export const getOnlineUsersCount = async () => {
  try {
    const { data, error } = await supabase.rpc('get_online_users_count');

    if (error) throw error;

    console.log(`✅ Online users count: ${data}`);
    return data || 0;
  } catch (error) {
    console.error('❌ Error fetching online users count:', error);
    return 0;
  }
};

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to presence changes for real-time updates
 * @param {Function} callback - Callback function to handle presence changes
 * @param {string[]} userIds - Optional: specific user IDs to watch
 */
export const subscribeToPresence = (callback, userIds = null) => {
  try {
    console.log('🔔 Subscribing to presence changes');

    // Unsubscribe from any existing subscription
    unsubscribeFromPresence();

    // Subscribe to all presence changes
    presenceSubscription = supabase
      .channel('user-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: userIds ? `user_id=in.(${userIds.join(',')})` : undefined,
        },
        (payload) => {
          console.log('🔔 Presence change detected:', payload);
          
          if (callback && typeof callback === 'function') {
            callback(payload);
          }
        }
      )
      .subscribe();

    console.log('✅ Subscribed to presence changes');
    return presenceSubscription;
  } catch (error) {
    console.error('❌ Error subscribing to presence:', error);
    throw error;
  }
};

/**
 * Unsubscribe from presence changes
 */
export const unsubscribeFromPresence = () => {
  if (presenceSubscription) {
    console.log('🔕 Unsubscribing from presence changes');
    supabase.removeChannel(presenceSubscription);
    presenceSubscription = null;
  }
};

// =====================================================
// LIFECYCLE MANAGEMENT
// =====================================================

/**
 * Initialize presence tracking
 * Call this when user logs in or app starts
 */
export const initializePresence = async () => {
  try {
    console.log('🚀 Initializing presence tracking');

    // Set user as online
    await setUserOnline();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle before unload (user closing tab/window)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Handle online/offline browser events
    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);

    console.log('✅ Presence tracking initialized');
  } catch (error) {
    console.error('❌ Error initializing presence:', error);
  }
};

/**
 * Cleanup presence tracking
 * Call this when user logs out or app unmounts
 */
export const cleanupPresence = async () => {
  try {
    console.log('🧹 Cleaning up presence tracking');

    // Set user as offline
    await setUserOffline();

    // Stop heartbeat
    stopHeartbeat();

    // Unsubscribe from presence changes
    unsubscribeFromPresence();

    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('online', handleBrowserOnline);
    window.removeEventListener('offline', handleBrowserOffline);

    console.log('✅ Presence tracking cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up presence:', error);
  }
};

// =====================================================
// EVENT HANDLERS
// =====================================================

/**
 * Handle page visibility changes
 */
const handleVisibilityChange = async () => {
  if (document.hidden) {
    console.log('👋 Page hidden, pausing heartbeat');
    stopHeartbeat();
  } else {
    console.log('👀 Page visible, resuming presence');
    await setUserOnline();
  }
};

/**
 * Handle before unload (user closing tab)
 */
const handleBeforeUnload = () => {
  console.log('👋 User leaving, setting offline');
  // Use navigator.sendBeacon for more reliable delivery
  const { data: { user } } = supabase.auth.getUser();
  if (user) {
    setUserOffline();
  }
};

/**
 * Handle browser going online
 */
const handleBrowserOnline = async () => {
  console.log('🌐 Browser back online');
  await setUserOnline();
};

/**
 * Handle browser going offline
 */
const handleBrowserOffline = async () => {
  console.log('📡 Browser offline');
  await setUserOffline();
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format last seen timestamp to readable text
 * @param {Date|string} lastSeen - Last seen timestamp
 */
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

/**
 * Get status color for UI
 * @param {boolean} isOnline - Online status
 */
export const getStatusColor = (isOnline) => {
  return isOnline ? 'bg-green-500' : 'bg-gray-400';
};

/**
 * Get status text color for UI
 * @param {boolean} isOnline - Online status
 */
export const getStatusTextColor = (isOnline) => {
  return isOnline ? 'text-green-600' : 'text-gray-500';
};

export default {
  // Main functions
  setUserOnline,
  setUserOffline,
  updateUserStatus,
  
  // Queries
  getUserPresence,
  getMultipleUserPresence,
  getOnlineUsers,
  getOnlineUsersCount,
  
  // Realtime
  subscribeToPresence,
  unsubscribeFromPresence,
  
  // Lifecycle
  initializePresence,
  cleanupPresence,
  
  // Utils
  formatLastSeen,
  getStatusColor,
  getStatusTextColor,
};

