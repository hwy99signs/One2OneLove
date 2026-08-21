import React, { useEffect, useRef } from 'react';
import { Archive, ArrowLeft, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPresenceBadge } from '@/components/presence/UserPresenceIndicator';
import ChatMessageRelaunch from './ChatMessageRelaunch';
import ChatComposerRelaunch from './ChatComposerRelaunch';
import { markMessagesAsRead } from '@/lib/chatService';
import { getChatCopy } from '@/lib/chatCopy';
import { useLanguage } from '@/Layout';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const privacySafeAvatar = (value) => {
  const url = String(value || '').trim();
  if (!url || url.includes('api.dicebear.com')) return null;
  return url;
};

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
  const { currentLanguage } = useLanguage();
  const t = getChatCopy(currentLanguage);
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
        console.warn('Unable to update opened chat receipt state:', error);
      }
    };

    void markRead();
    return () => { cancelled = true; };
  }, [chat?.id, currentUserId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200"><MessageCircle className="h-8 w-8 text-gray-400" /></div>
          <p className="font-medium text-gray-600">{t.selectChat}</p>
          <p className="mt-1 text-sm text-gray-400">{t.privateBetween}</p>
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
      toast.error(t.unableArchive);
    }
  };

  const avatarUrl = privacySafeAvatar(chat.avatar);
  const displayName = chat.name || t.memberFallback;

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {onBack && (
            <button type="button" onClick={onBack} aria-label={t.back} className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-gray-100 lg:hidden"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
          )}

          <Avatar className="h-10 w-10 flex-shrink-0">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-900">{displayName}</h3>
            <UserPresenceBadge userId={chat.otherUserId} showDot showText size="sm" />
          </div>
        </div>

        {onArchive && (
          <button type="button" onClick={() => void handleArchive()} title={t.archiveChat} aria-label={t.archiveChat} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"><Archive className="h-5 w-5" /></button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl p-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center"><div className="text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-500" /><p className="text-sm text-gray-500">{t.loadingMessages}</p></div></div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center text-center"><div><p className="font-medium text-gray-600">{t.noMessages}</p><p className="mt-1 text-sm text-gray-400">{t.firstMessage}</p></div></div>
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

      <ChatComposerRelaunch onSendMessage={onSendMessage} onSendFile={onSendFile} onSendLocation={onSendLocation} disabled={isLoading} />
    </div>
  );
}
