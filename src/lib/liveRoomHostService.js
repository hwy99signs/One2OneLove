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

export async function getLiveRoomHostPrompt(roomSlug, recentMessages = [], reason = 'room_empty') {
  try {
    const { data, error } = await supabase.functions.invoke('live-room-host', {
      body: {
        room_slug: roomSlug,
        reason: reason === 'room_quiet' ? 'room_quiet' : 'room_empty',
        language: currentHostLanguage(),
        recent_messages: normalizeRecentMessages(recentMessages),
      },
    });

    if (error) {
      console.warn('Live room host function unavailable:', error);
      return null;
    }

    if (!data?.prompt || typeof data.prompt !== 'string') return null;

    return {
      prompt: data.prompt.trim(),
      source: data.source === 'ai' ? 'ai' : 'fallback',
    };
  } catch (error) {
    console.warn('Live room host request failed:', error);
    return null;
  }
}
