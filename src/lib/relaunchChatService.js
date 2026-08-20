import * as chat from './chatService';
import { safeMemberAvatarUrl } from './memberMedia';

export * from './chatService';

const LEGACY_UNKNOWN_MEMBER = 'One2OneLove member';
const neutralMemberName = (value) => {
  const name = String(value || '').trim();
  return name && name !== LEGACY_UNKNOWN_MEMBER ? name : null;
};

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
  const messages = await chat.getMessages(conversationId);
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
