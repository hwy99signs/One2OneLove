import React, { useEffect, useState } from 'react';
import { getOnlineUsersCount, getUserPresence, subscribeToPresence, unsubscribeFromPresence } from '@/lib/presenceService';
import { safeMemberAvatarUrl } from '@/lib/memberMedia';

const ACTIVE_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'de']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const UI_COPY = {
  en: { online: 'Online', offline: 'Offline', away: 'Away', busy: 'Busy', loading: 'Loading…', member: 'Member', onlineCount: (count) => `${count} online` },
  es: { online: 'En línea', offline: 'Desconectado', away: 'Ausente', busy: 'Ocupado', loading: 'Cargando…', member: 'Miembro', onlineCount: (count) => `${count} en línea` },
  fr: { online: 'En ligne', offline: 'Hors ligne', away: 'Absent', busy: 'Occupé', loading: 'Chargement…', member: 'Membre', onlineCount: (count) => `${count} en ligne` },
  it: { online: 'Online', offline: 'Offline', away: 'Assente', busy: 'Occupato', loading: 'Caricamento…', member: 'Membro', onlineCount: (count) => `${count} online` },
  de: { online: 'Online', offline: 'Offline', away: 'Abwesend', busy: 'Beschäftigt', loading: 'Wird geladen…', member: 'Mitglied', onlineCount: (count) => `${count} online` },
};

const currentLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const requested = String(window.localStorage?.getItem('preferredLanguage') || '').trim().toLowerCase();
  return ACTIVE_LANGUAGES.has(requested) ? requested : 'en';
};

const copy = () => UI_COPY[currentLanguage()] || UI_COPY.en;
const validUserId = (value) => UUID_PATTERN.test(String(value || '').trim());

export const OnlineStatusDot = ({ isOnline, size = 'sm', showPulse = true }) => {
  const sizeClasses = { xs: 'w-2 h-2', sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <span className="relative inline-flex" aria-hidden="true">
      <span className={`inline-block rounded-full ${sizeClasses[size]} ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      {isOnline && showPulse && <span className={`absolute inline-flex rounded-full ${sizeClasses[size]} bg-green-400 opacity-75 animate-ping`} />}
    </span>
  );
};

export const LastSeenText = ({ isOnline, status = 'offline', lastSeenText, className = '' }) => {
  const t = copy();
  const label = isOnline ? t.online : status === 'away' ? t.away : status === 'busy' ? t.busy : lastSeenText || t.offline;
  return <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'} ${className}`}>{label}</span>;
};

export const UserPresenceBadge = ({ userId, showText = true, showDot = true, size = 'sm' }) => {
  const [presence, setPresence] = useState({ is_online: false, status: 'offline', last_seen_text: null });
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!validUserId(userId)) {
      setPresence({ is_online: false, status: 'offline', last_seen_text: null });
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const loadPresence = async () => {
      try {
        setLoading(true);
        const data = await getUserPresence(userId);
        if (!cancelled) setPresence(data || { is_online: false, status: 'offline', last_seen_text: null });
      } catch {
        if (!cancelled) setPresence({ is_online: false, status: 'offline', last_seen_text: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPresence();
    const subscription = subscribeToPresence((payload) => {
      if (payload.new?.user_id === userId || payload.old?.user_id === userId) void loadPresence();
    }, [userId]);

    return () => {
      cancelled = true;
      if (subscription) unsubscribeFromPresence(subscription);
    };
  }, [userId]);

  if (loading) {
    return <div className="flex items-center gap-2">{showDot && <div className="h-3 w-3 animate-pulse rounded-full bg-gray-200" />}{showText && <span className="text-xs text-gray-400">{copy().loading}</span>}</div>;
  }

  return <div className="flex items-center gap-2">{showDot && <OnlineStatusDot isOnline={presence.is_online} size={size} />}{showText && <LastSeenText isOnline={presence.is_online} status={presence.status} lastSeenText={presence.last_seen_text} />}</div>;
};

export const AvatarWithStatus = ({ userId, avatarUrl, name, size = 'md', showStatus = true }) => {
  const [presence, setPresence] = useState({ is_online: false });

  useEffect(() => {
    if (!validUserId(userId)) {
      setPresence({ is_online: false });
      return undefined;
    }

    let cancelled = false;
    const loadPresence = async () => {
      try {
        const data = await getUserPresence(userId);
        if (!cancelled) setPresence(data || { is_online: false });
      } catch {
        if (!cancelled) setPresence({ is_online: false });
      }
    };

    void loadPresence();
    const subscription = subscribeToPresence((payload) => {
      if (payload.new?.user_id === userId || payload.old?.user_id === userId) void loadPresence();
    }, [userId]);

    return () => {
      cancelled = true;
      if (subscription) unsubscribeFromPresence(subscription);
    };
  }, [userId]);

  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  const statusSizeClasses = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-3.5 h-3.5', xl: 'w-4 h-4' };
  const displayName = String(name || copy().member).trim() || copy().member;
  const safeAvatar = safeMemberAvatarUrl(avatarUrl);

  return (
    <div className="relative inline-block">
      {safeAvatar ? (
        <img src={safeAvatar} alt={displayName} className={`${sizeClasses[size]} rounded-full object-cover`} />
      ) : (
        <div role="img" aria-label={displayName} className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-600`}>{displayName.charAt(0).toUpperCase()}</div>
      )}
      {showStatus && <span aria-hidden="true" className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full ${presence.is_online ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white`} />}
    </div>
  );
};

export const PresenceStatusSelector = ({ currentStatus = 'online', onStatusChange }) => {
  const t = copy();
  const statuses = [
    { value: 'online', label: t.online, color: 'bg-green-500' },
    { value: 'away', label: t.away, color: 'bg-yellow-500' },
    { value: 'busy', label: t.busy, color: 'bg-red-500' },
    { value: 'offline', label: t.offline, color: 'bg-gray-400' },
  ];

  return <div className="flex flex-col gap-2 rounded-lg border bg-white p-2 shadow-lg">{statuses.map((status) => <button type="button" key={status.value} onClick={() => onStatusChange?.(status.value)} className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${currentStatus === status.value ? 'border border-purple-300 bg-purple-50' : 'hover:bg-gray-50'}`}><span aria-hidden="true" className={`h-3 w-3 rounded-full ${status.color}`} /><span className="text-sm font-medium">{status.label}</span>{currentStatus === status.value && <span aria-hidden="true" className="ml-auto text-purple-600">✓</span>}</button>)}</div>;
};

export const OnlineUsersCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      const onlineCount = await getOnlineUsersCount();
      if (!cancelled) setCount(onlineCount);
    };

    void loadCount();
    const subscription = subscribeToPresence(() => { void loadCount(); });
    return () => {
      cancelled = true;
      if (subscription) unsubscribeFromPresence(subscription);
    };
  }, []);

  return <div className="flex items-center gap-2 text-sm text-gray-600"><OnlineStatusDot isOnline size="xs" showPulse={false} /><span>{copy().onlineCount(count)}</span></div>;
};

export default { OnlineStatusDot, LastSeenText, UserPresenceBadge, AvatarWithStatus, PresenceStatusSelector, OnlineUsersCounter };
