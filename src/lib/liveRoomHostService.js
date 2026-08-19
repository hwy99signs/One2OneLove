import { supabase } from './supabase';

const SUPPORTED_HOST_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'de', 'nl']);

// Keep AI-host context minimal: recent public room text only, no member names or profile fields.
const normalizeRecentMessages = (messages = []) =>
  messages.slice(-8).map((message) => ({
    content: String(message.content || '').slice(0, 400),
  }));

const currentHostLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage?.getItem('preferredLanguage') || 'en';
  return SUPPORTED_HOST_LANGUAGES.has(stored) ? stored : 'en';
};

const normalizeRequest = (roomOrOptions, recentMessages = [], reason = 'room_empty') => {
  if (roomOrOptions && typeof roomOrOptions === 'object') {
    return {
      roomSlug: roomOrOptions.room?.slug || roomOrOptions.room?.id || roomOrOptions.roomSlug || '',
      recentMessages: roomOrOptions.recentMessages || recentMessages,
      reason: roomOrOptions.reason || reason,
      language: roomOrOptions.language || currentHostLanguage(),
    };
  }

  return {
    roomSlug: roomOrOptions || '',
    recentMessages,
    reason,
    language: currentHostLanguage(),
  };
};

export async function getLiveRoomHostPrompt(roomOrOptions, recentMessages = [], reason = 'room_empty') {
  const request = normalizeRequest(roomOrOptions, recentMessages, reason);
  if (!request.roomSlug) return null;

  try {
    const { data, error } = await supabase.functions.invoke('live-room-host', {
      body: {
        room_slug: request.roomSlug,
        reason: request.reason === 'room_quiet' ? 'room_quiet' : 'room_empty',
        language: SUPPORTED_HOST_LANGUAGES.has(request.language) ? request.language : 'en',
        recent_messages: normalizeRecentMessages(request.recentMessages),
      },
    });

    if (error) {
      console.warn('Live room host function unavailable:', error);
      return null;
    }

    if (!data?.prompt || typeof data.prompt !== 'string') return null;

    const prompt = data.prompt.trim();
    return {
      prompt,
      text: prompt,
      source: data.source === 'ai' ? 'ai' : 'fallback',
    };
  } catch (error) {
    console.warn('Live room host request failed:', error);
    return null;
  }
}
