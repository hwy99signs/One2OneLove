import * as chat from './chatService';
import { safeMemberAvatarUrl } from './memberMedia';

export * from './chatService';

/**
 * Relaunch read wrapper around the large legacy messaging service. It prevents legacy
 * external/generated avatar URLs from reaching React while leaving message persistence,
 * receipts and realtime behavior unchanged.
 */
export const getMyConversations = async () => {
  const conversations = await chat.getMyConversations();
  return (conversations || []).map((conversation) => ({
    ...conversation,
    avatar: safeMemberAvatarUrl(conversation.avatar),
  }));
};
