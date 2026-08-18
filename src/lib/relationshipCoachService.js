import { supabase } from './supabase';

const clean = (value, max = 4000) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const invoke = async (body) => {
  const { data, error } = await supabase.functions.invoke('relationship-coach', { body });
  if (error || data?.error) {
    const message = data?.error || error?.message || 'Relationship Coach is unavailable right now.';
    const enriched = new Error(message);
    enriched.code = data?.error || null;
    enriched.feature = data?.feature || null;
    throw enriched;
  }
  return data;
};

export const listCoachConversations = async (language = 'en') => {
  const data = await invoke({ action: 'list_conversations', language });
  return data?.conversations || [];
};

export const createCoachConversation = async ({ title = 'Coaching Session', language = 'en' } = {}) => {
  const data = await invoke({ action: 'create_conversation', title: clean(title, 120), language });
  return data?.conversation || null;
};

export const getCoachConversation = async (conversationId, language = 'en') => {
  return invoke({ action: 'get_conversation', conversation_id: conversationId, language });
};

export const deleteCoachConversation = async (conversationId, language = 'en') => {
  return invoke({ action: 'delete_conversation', conversation_id: conversationId, language });
};

/**
 * One request ID belongs to one deliberate member submission. A caller may pass the same
 * request ID again after a network ambiguity so the server can replay the stored result
 * rather than spending on a duplicate model generation.
 */
export const sendCoachMessage = async ({ conversationId, message, language = 'en', requestId = null }) => {
  const text = clean(message, 4000);
  if (!text) throw new Error('Type a message first.');
  return invoke({
    action: 'send_message',
    conversation_id: conversationId,
    message: text,
    language,
    request_id: requestId || createRequestId(),
  });
};

export const newCoachRequestId = createRequestId;
