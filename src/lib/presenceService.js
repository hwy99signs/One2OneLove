/**
 * User Presence Service
 * Handles online/offline status tracking and real-time updates.
 *
 * Privacy rule: the database returns neutral presence timestamps/status only. It never
 * returns account email or English display prose. Relative “last seen” copy is derived
 * here from One2OneLove's selected language (`preferredLanguage`).
 */

import { supabase } from './supabase';

let heartbeatInterval = null;
let lifecycleListenersBound = false;
let presenceSubscriptionCounter = 0;
const activePresenceSubscriptions = new Set();

const PRESENCE_SELECT = 'user_id,status,last_seen,last_active,updated_at,name,avatar_url,is_online';
const ALLOWED_STATUSES = new Set(['online', 'offline', 'away', 'busy']);
const ACTIVE_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'de']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRESENCE_COPY = {
  en: { online: 'Online', longAgo: 'Long time ago', justNow: 'Just now', minutesAgo: (count) => `${count} min${count === 1 ? '' : 's'} ago`, hoursAgo: (count) => `${count} hour${count === 1 ? '' : 's'} ago`, daysAgo: (count) => `${count} day${count === 1 ? '' : 's'} ago` },
  es: { online: 'En línea', longAgo: 'Hace tiempo', justNow: 'Ahora mismo', minutesAgo: (count) => `Hace ${count} min`, hoursAgo: (count) => `Hace ${count} h`, daysAgo: (count) => `Hace ${count} d` },
  fr: { online: 'En ligne', longAgo: 'Il y a longtemps', justNow: 'À l’instant', minutesAgo: (count) => `Il y a ${count} min`, hoursAgo: (count) => `Il y a ${count} h`, daysAgo: (count) => `Il y a ${count} j` },
  it: { online: 'Online', longAgo: 'Molto tempo fa', justNow: 'Adesso', minutesAgo: (count) => `${count} min fa`, hoursAgo: (count) => `${count} h fa`, daysAgo: (count) => `${count} g fa` },
  de: { online: 'Online', longAgo: 'Vor längerer Zeit', justNow: 'Gerade eben', minutesAgo: (count) => `vor ${count} Min.`, hoursAgo: (count) => `vor ${count} Std.`, daysAgo: (count) => `vor ${count} T.` },
};

const resolvePresenceLanguage = (requestedLanguage = null) => {
  const requested = String(requestedLanguage || '').trim().toLowerCase();
  if (ACTIVE_LANGUAGES.has(requested)) return requested;

  if (typeof window !== 'undefined') {
    const preferred = String(window.localStorage?.getItem('preferredLanguage') || '').trim().toLowerCase();
    if (ACTIVE_LANGUAGES.has(preferred)) return preferred;
  }

  return 'en';
};

const validUserId = (value) => UUID_PATTERN.test(String(value || '').trim());

export const formatLastSeen = (lastSeen, language = null) => {
  const copy = PRESENCE_COPY[resolvePresenceLanguage(language)];
  if (!lastSeen) return copy.longAgo;

  const lastSeenDate = new Date(lastSeen);
  if (Number.isNaN(lastSeenDate.getTime())) return copy.longAgo;

  const diffMs = Math.max(0, Date.now() - lastSeenDate.getTime());
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return copy.justNow;
  if (diffMins < 60) return copy.minutesAgo(diffMins);
  if (diffHours < 24) return copy.hoursAgo(diffHours);
  if (diffDays < 7) return copy.daysAgo(diffDays);
  return copy.longAgo;
};

export const localizePresence = (presence, language = null) => {
  const resolvedLanguage = resolvePresenceLanguage(language);
  const copy = PRESENCE_COPY[resolvedLanguage];
  if (!presence) return null;

  return {
    ...presence,
    last_seen_text: presence.is_online ? copy.online : formatLastSeen(presence.last_seen, resolvedLanguage),
  };
};

const offlinePresence = (userId, language = null) => localizePresence({
  user_id: validUserId(userId) ? String(userId).trim() : null,
  status: 'offline',
  last_seen: null,
  last_active: null,
  updated_at: null,
  name: null,
  avatar_url: null,
  is_online: false,
}, language);

const getAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
};

export const setUserOnline = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false };

    const { error } = await supabase.rpc('update_user_presence', { p_user_id: user.id, p_status: 'online' });
    if (error) throw error;
    startHeartbeat();
    return { success: true };
  } catch {
    console.warn('Unable to set presence online.');
    return { success: false, code: 'O2OL_PRESENCE_UPDATE_FAILED' };
  }
};

export const setUserOffline = async () => {
  try {
    const user = await getAuthenticatedUser();
    stopHeartbeat();
    if (!user) return { success: true };

    const { error } = await supabase.rpc('update_user_presence', { p_user_id: user.id, p_status: 'offline' });
    if (error) throw error;
    return { success: true };
  } catch {
    console.warn('Unable to set presence offline.');
    return { success: false, code: 'O2OL_PRESENCE_UPDATE_FAILED' };
  }
};

export const updateUserStatus = async (status) => {
  if (!ALLOWED_STATUSES.has(status)) throw new Error('O2OL_PRESENCE_STATUS_INVALID');

  const user = await getAuthenticatedUser();
  if (!user) throw new Error('O2OL_AUTH_REQUIRED');

  const { error } = await supabase.rpc('update_user_presence', { p_user_id: user.id, p_status: status });
  if (error) throw new Error('O2OL_PRESENCE_UPDATE_FAILED');
  if (status === 'online') startHeartbeat();
  else stopHeartbeat();
  return { success: true };
};

const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatInterval = window.setInterval(async () => {
    try {
      const user = await getAuthenticatedUser();
      if (!user) {
        stopHeartbeat();
        return;
      }
      const { error } = await supabase.rpc('heartbeat_user_presence', { p_user_id: user.id });
      if (error) console.warn('Presence heartbeat failed.');
    } catch {
      console.warn('Presence heartbeat failed.');
    }
  }, 30_000);
};

const stopHeartbeat = () => {
  if (!heartbeatInterval) return;
  window.clearInterval(heartbeatInterval);
  heartbeatInterval = null;
};

export const getUserPresence = async (userId, language = null) => {
  if (!validUserId(userId)) return offlinePresence(null, language);

  try {
    const { data, error } = await supabase
      .from('user_presence_view')
      .select(PRESENCE_SELECT)
      .eq('user_id', String(userId).trim())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? localizePresence(data, language) : offlinePresence(userId, language);
  } catch {
    console.warn('Unable to fetch user presence.');
    return offlinePresence(userId, language);
  }
};

export const getMultipleUserPresence = async (userIds, language = null) => {
  try {
    const uniqueIds = [...new Set((userIds || []).map((id) => String(id || '').trim()).filter(validUserId))];
    if (!uniqueIds.length) return {};

    const { data, error } = await supabase
      .from('user_presence_view')
      .select(PRESENCE_SELECT)
      .in('user_id', uniqueIds);

    if (error) throw error;

    const presenceMap = {};
    (data || []).forEach((presence) => { presenceMap[presence.user_id] = localizePresence(presence, language); });
    uniqueIds.forEach((userId) => { if (!presenceMap[userId]) presenceMap[userId] = offlinePresence(userId, language); });
    return presenceMap;
  } catch {
    console.warn('Unable to fetch multiple presence records.');
    return {};
  }
};

export const getOnlineUsers = async (language = null) => {
  try {
    const { data, error } = await supabase
      .from('user_presence_view')
      .select(PRESENCE_SELECT)
      .eq('is_online', true)
      .order('last_active', { ascending: false });

    if (error) throw error;
    return (data || []).map((presence) => localizePresence(presence, language));
  } catch {
    console.warn('Unable to fetch online users.');
    return [];
  }
};

export const getOnlineUsersCount = async () => {
  try {
    const { data, error } = await supabase.rpc('get_online_users_count');
    if (error) throw error;
    return Number(data) || 0;
  } catch {
    console.warn('Unable to fetch online user count.');
    return 0;
  }
};

export const subscribeToPresence = (callback, userIds = null) => {
  const requestedIds = Array.isArray(userIds) ? userIds : null;
  const ids = [...new Set((requestedIds || []).map((id) => String(id || '').trim()).filter(validUserId))];
  if (requestedIds && !ids.length) return null;

  const config = { event: '*', schema: 'public', table: 'user_presence' };
  if (ids.length) config.filter = `user_id=in.(${ids.join(',')})`;

  presenceSubscriptionCounter += 1;
  const channel = supabase
    .channel(`user-presence-changes:${presenceSubscriptionCounter}`)
    .on('postgres_changes', config, (payload) => {
      if (typeof callback === 'function') callback(payload);
    })
    .subscribe();

  activePresenceSubscriptions.add(channel);
  return channel;
};

export const unsubscribeFromPresence = (subscription = null) => {
  if (subscription) {
    activePresenceSubscriptions.delete(subscription);
    supabase.removeChannel(subscription);
    return;
  }

  for (const channel of activePresenceSubscriptions) supabase.removeChannel(channel);
  activePresenceSubscriptions.clear();
};

const handleVisibilityChange = async () => {
  if (document.hidden) {
    stopHeartbeat();
    return;
  }
  await setUserOnline();
};

const handlePageHide = () => {
  stopHeartbeat();
};

const handleBrowserOnline = async () => { await setUserOnline(); };
const handleBrowserOffline = () => { stopHeartbeat(); };

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
  localizePresence,
  getStatusColor,
  getStatusTextColor,
};
