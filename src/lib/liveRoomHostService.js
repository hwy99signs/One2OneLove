import { supabase } from './supabase';

// Keep AI-host context minimal: recent public room text only, no member names or profile fields.
const normalizeRecentMessages = (messages = []) =>
  messages.slice(-8).map((message) => ({
    sender_name: 'Member',
    content: String(message.content || '').slice(0, 400),
  }));

export async function getLiveRoomHostPrompt(roomSlug, recentMessages = [], reason = 'room_empty') {
  try {
    const { data, error } = await supabase.functions.invoke('live-room-host', {
      body: {
        room_slug: roomSlug,
        reason: reason === 'room_quiet' ? 'room_quiet' : 'room_empty',
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
