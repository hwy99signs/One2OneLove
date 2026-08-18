import React, { useEffect, useRef } from 'react';
import { Archive, ArrowLeft, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPresenceBadge } from '@/components/presence/UserPresenceIndicator';
import ChatMessageRelaunch from './ChatMessageRelaunch';
import ChatComposerRelaunch from './ChatComposerRelaunch';
import { markMessagesAsRead } from '@/lib/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Relaunch Chat window.
 *
 * This deliberately exposes only controls backed by a real implementation. The legacy
 * component contained prototype voice/video calling, reply/forward/star/reaction/select,
 * fake mark-unread, clear-chat and destructive-delete affordances. Those remain out of
 * the relaunch surface until their backend/privacy semantics are actually implemented.
 */
export default function ChatWindow({
  chat,
  messages = [],
  currentUserId,
  onSendMessage,
  onSendFile,
  onSendLocation,
  onBack,
  onArchive,
  onEditMessage,
  onDeleteMessage,
  isLoading = false,
}) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chat?.id || !currentUserId) return;
    let cancelled = false;

    const markRead = async () => {
      try {
        await markMessagesAsRead(chat.id);
        if (cancelled) return;
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['messages', chat.id] }),
          queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        ]);
      } catch (error) {
        console.warn('Unable to mark opened chat as read:', error);
      }
    };

    void markRead();
    return () => {
      cancelled = true;
    };
  }, [chat?.id, currentUserId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
            <MessageCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-600">Select a chat to start messaging</p>
          <p className="mt-1 text-sm text-gray-400">Private one-to-one messaging stays between the two participants.</p>
        </div>
      </div>
    );
  }

  const handleArchive = async () => {
    if (!onArchive) return;
    try {
      await onArchive(chat.id);
    } catch (error) {
      console.error('Unable to archive chat:', error);
      toast.error('Unable to archive chat');
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to chats"
              className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-gray-100 lg:hidden"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}

          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={chat.avatar} alt={chat.name || 'Member'} />
            <AvatarFallback>{chat.name?.charAt(0) || 'M'}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-900">{chat.name || 'One2OneLove member'}</h3>
            <UserPresenceBadge userId={chat.otherUserId} showDot showText size="sm" />
          </div>
        </div>

        {onArchive && (
          <button
            type="button"
            onClick={() => void handleArchive()}
            title="Archive chat"
            aria-label="Archive chat"
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <Archive className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl p-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-500" />
                <p className="text-sm text-gray-500">Loading messages…</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center text-center">
              <div>
                <p className="font-medium text-gray-600">No messages yet</p>
                <p className="mt-1 text-sm text-gray-400">Send the first message when you're ready.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => (
                <ChatMessageRelaunch
                  key={message.id || `${message.timestamp || 'message'}-${index}`}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  onEdit={onEditMessage ? (messageId, newText) => onEditMessage(messageId, newText) : undefined}
                  onDelete={onDeleteMessage ? (messageId) => onDeleteMessage(messageId, 'everyone') : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <ChatComposerRelaunch
        onSendMessage={onSendMessage}
        onSendFile={onSendFile}
        onSendLocation={onSendLocation}
        disabled={isLoading}
      />
    </div>
  );
}
