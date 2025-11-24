/**
 * User Presence Indicator Component
 * Displays online/offline status with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { getUserPresence, subscribeToPresence } from '@/lib/presenceService';

/**
 * Online Status Dot
 * Shows a colored dot indicator
 */
export const OnlineStatusDot = ({ isOnline, size = 'sm', showPulse = true }) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span className="relative inline-flex">
      <span
        className={`inline-block rounded-full ${sizeClasses[size]} ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {isOnline && showPulse && (
        <span
          className={`absolute inline-flex rounded-full ${sizeClasses[size]} ${
            isOnline ? 'bg-green-400' : 'bg-gray-300'
          } opacity-75 animate-ping`}
        />
      )}
    </span>
  );
};

/**
 * Last Seen Text
 * Shows "Online" or "Last seen X ago"
 */
export const LastSeenText = ({ isOnline, lastSeenText, className = '' }) => {
  return (
    <span
      className={`text-xs ${
        isOnline ? 'text-green-600' : 'text-gray-500'
      } ${className}`}
    >
      {isOnline ? 'Online' : lastSeenText || 'Offline'}
    </span>
  );
};

/**
 * User Presence Badge
 * Combined indicator with dot and text
 */
export const UserPresenceBadge = ({ userId, showText = true, showDot = true, size = 'sm' }) => {
  const [presence, setPresence] = useState({
    is_online: false,
    last_seen_text: 'Offline',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Load initial presence
    loadPresence();

    // Subscribe to real-time updates
    const subscription = subscribeToPresence((payload) => {
      // Check if this update is for our user
      if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
        console.log('🔔 Presence update for user:', userId);
        loadPresence();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userId]);

  const loadPresence = async () => {
    try {
      setLoading(true);
      const data = await getUserPresence(userId);
      setPresence(data);
    } catch (error) {
      console.error('Error loading presence:', error);
      setPresence({
        is_online: false,
        last_seen_text: 'Offline',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        {showDot && <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />}
        {showText && <span className="text-xs text-gray-400">Loading...</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showDot && <OnlineStatusDot isOnline={presence.is_online} size={size} />}
      {showText && (
        <LastSeenText
          isOnline={presence.is_online}
          lastSeenText={presence.last_seen_text}
        />
      )}
    </div>
  );
};

/**
 * Avatar with Online Status
 * Shows user avatar with online indicator overlay
 */
export const AvatarWithStatus = ({ 
  userId, 
  avatarUrl, 
  name, 
  size = 'md',
  showStatus = true 
}) => {
  const [presence, setPresence] = useState({ is_online: false });

  useEffect(() => {
    if (!userId) return;

    loadPresence();

    const subscription = subscribeToPresence((payload) => {
      if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
        loadPresence();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userId]);

  const loadPresence = async () => {
    try {
      const data = await getUserPresence(userId);
      setPresence(data);
    } catch (error) {
      console.error('Error loading presence:', error);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const statusSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  return (
    <div className="relative inline-block">
      <img
        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
        alt={name || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full ${
            presence.is_online ? 'bg-green-500' : 'bg-gray-400'
          } border-2 border-white`}
        />
      )}
    </div>
  );
};

/**
 * Presence Status Selector
 * Allows user to change their status
 */
export const PresenceStatusSelector = ({ currentStatus = 'online', onStatusChange }) => {
  const statuses = [
    { value: 'online', label: 'Online', color: 'bg-green-500', icon: '🟢' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500', icon: '🟡' },
    { value: 'busy', label: 'Busy', color: 'bg-red-500', icon: '🔴' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-400', icon: '⚫' },
  ];

  return (
    <div className="flex flex-col gap-2 p-2 bg-white rounded-lg shadow-lg border">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => onStatusChange?.(status.value)}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            currentStatus === status.value
              ? 'bg-purple-50 border border-purple-300'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${status.color}`} />
          <span className="text-sm font-medium">{status.label}</span>
          {currentStatus === status.value && (
            <span className="ml-auto text-purple-600">✓</span>
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * Online Users Counter
 * Shows total number of online users
 */
export const OnlineUsersCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadCount();

    // Update count when presence changes
    const subscription = subscribeToPresence(() => {
      loadCount();
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadCount = async () => {
    try {
      const { getOnlineUsersCount } = await import('@/lib/presenceService');
      const onlineCount = await getOnlineUsersCount();
      setCount(onlineCount);
    } catch (error) {
      console.error('Error loading online count:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <OnlineStatusDot isOnline={true} size="xs" showPulse={false} />
      <span>{count} online</span>
    </div>
  );
};

export default {
  OnlineStatusDot,
  LastSeenText,
  UserPresenceBadge,
  AvatarWithStatus,
  PresenceStatusSelector,
  OnlineUsersCounter,
};

