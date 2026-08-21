import * as chat from './chatService';
import { safeMemberAvatarUrl } from './memberMedia';

export * from './chatService';

const LEGACY_UNKNOWN_MEMBER = 'One2OneLove member';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const neutralMemberName = (value) => {
  const name = String(value || '').trim();
  return name && name !== LEGACY_UNKNOWN_MEMBER ? name : null;
};

const requireUuid = (value, code) => {
  const id = String(value || '').trim();
  if (!UUID_PATTERN.test(id)) throw new Error(code);
  return id;
};

/**
 * Deep-link member IDs are untrusted browser input. Reject malformed values before they
 * can reach the SECURITY DEFINER conversation RPC; the RPC remains the final participant
 * and accepted-connection authority for valid UUIDs.
 */
export const getOrCreateConversation = async (otherUserId) =>
  chat.getOrCreateConversation(requireUuid(otherUserId, 'O2OL_CHAT_INVALID_MEMBER_ID'));

/**
 * Relaunch read wrapper around the large legacy messaging service. It prevents legacy
 * external/generated avatar URLs from reaching React and removes English fallback names
 * so the current five-language UI supplies the member fallback locally.
 */
export const getMyConversations = async () => {
  const conversations = await chat.getMyConversations();
  return (conversations || []).map((conversation) => ({
    ...conversation,
    name: neutralMemberName(conversation.name),
    avatar: safeMemberAvatarUrl(conversation.avatar),
  }));
};

/**
 * Message-level member avatars historically bypassed the conversation-list wrapper.
 * Sanitize those reads too so opening a private chat cannot contact DiceBear or another
 * third-party avatar host. Reply sender names are also left neutral for UI localization.
 */
export const getMessages = async (conversationId) => {
  const safeConversationId = requireUuid(conversationId, 'O2OL_CHAT_INVALID_CONVERSATION_ID');
  const messages = await chat.getMessages(safeConversationId);
  return (messages || []).map((message) => ({
    ...message,
    senderName: neutralMemberName(message.senderName),
    senderAvatar: safeMemberAvatarUrl(message.senderAvatar),
    replyToMessage: message.replyToMessage
      ? {
          ...message.replyToMessage,
          senderName: neutralMemberName(message.replyToMessage.senderName),
        }
      : null,
  }));
};
