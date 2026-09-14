import React, { useEffect, useRef, useState } from 'react';
import { Phone, Video, MoreVertical, ArrowLeft, Search, MessageSquare, Pin, PinOff, Archive, Trash2, Maximize2, X, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useLanguage } from '@/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import UserProfile from './UserProfile';
import { UserPresenceBadge } from '@/components/presence/UserPresenceIndicator';
import { getPinnedMessages, toggleReaction, toggleStarMessage } from '@/lib/chatFeaturesService';
import { getMessages, markMessagesAsRead, markMessageDelivered } from '@/lib/chatService';

const translations = {
  en: {
    viewProfile: "View Profile",
    search: "Search",
    markAsUnread: "Mark as unread",
    unpin: "Unpin",
    pin: "Pin",
    archive: "Archive",
    clearMessages: "Clear messages",
    delete: "Delete",
    popOutChat: "Pop-out chat"
  },
  es: {
    viewProfile: "Ver Perfil",
    search: "Buscar",
    markAsUnread: "Marcar como no leído",
    unpin: "Desanclar",
    pin: "Anclar",
    archive: "Archivar",
    clearMessages: "Limpiar mensajes",
    delete: "Eliminar",
    popOutChat: "Abrir chat en ventana"
  },
  fr: {
    viewProfile: "Voir le Profil",
    search: "Rechercher",
    markAsUnread: "Marquer comme non lu",
    unpin: "Désépingler",
    pin: "Épingler",
    archive: "Archiver",
    clearMessages: "Effacer les messages",
    delete: "Supprimer",
    popOutChat: "Ouvrir le chat dans une fenêtre"
  },
  it: {
    viewProfile: "Visualizza Profilo",
    search: "Cerca",
    markAsUnread: "Segna come non letto",
    unpin: "Scollega",
    pin: "Appunta",
    archive: "Archivia",
    clearMessages: "Cancella messaggi",
    delete: "Elimina",
    popOutChat: "Apri chat in finestra"
  },
  de: {
    viewProfile: "Profil Anzeigen",
    search: "Suchen",
    markAsUnread: "Als ungelesen markieren",
    unpin: "Lösen",
    pin: "Anheften",
    archive: "Archivieren",
    clearMessages: "Nachrichten löschen",
    delete: "Löschen",
    popOutChat: "Chat in Fenster öffnen"
  }
};

export default function ChatWindow({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onSendFile,
  onSendLocation,
  onCall,
  onVideoCall,
  onBack,
  onMute,
  onViewProfile,
  onSearch,
  onClearChat,
  onDeleteChat,
  onMarkAsUnread,
  onPin,
  onUnpin,
  onArchive,
  onPopOut,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
  isLoading = false
}) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const queryClient = useQueryClient();

  // Fetch pinned messages for the current conversation
  const { data: pinnedMessagesData = [] } = useQuery({
    queryKey: ['pinnedMessages', chat?.id],
    queryFn: () => getPinnedMessages(chat?.id),
    enabled: !!chat?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Transform pinned messages to match the message format
  const pinnedMessages = React.useMemo(() => {
    if (!pinnedMessagesData || pinnedMessagesData.length === 0) return [];
    
    return pinnedMessagesData.map(msg => {
      const isOwn = msg.sender_id === currentUserId;
      return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        senderName: isOwn ? 'You' : chat?.name || 'User',
        type: msg.message_type,
        text: msg.content,
        content: msg.content,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        fileType: msg.file_type,
        locationLat: msg.location_lat,
        locationLng: msg.location_lng,
        locationAddress: msg.location_address,
        isRead: msg.is_read,
        isEdited: msg.is_edited,
        timestamp: msg.created_at,
        createdAt: msg.created_at,
        isOwn: isOwn,
        isPinned: true,
        pinned_at: msg.pinned_at,
        pin_expires_at: msg.pin_expires_at,
      };
    });
  }, [pinnedMessagesData, currentUserId, chat]);

  // CRITICAL: Mark messages as delivered and read when chat window opens
  useEffect(() => {
    // Always log to verify this runs
    console.log('🔵 ChatWindow useEffect triggered', { 
      chatId: chat?.id, 
      userId: currentUserId,
      hasMessages: messages?.length > 0 
    });

    if (!chat?.id || !currentUserId) {
      console.log('⏸️ ChatWindow: Missing chat.id or currentUserId');
      return;
    }

    console.log('🔵 ChatWindow: Starting mark as read process for chat:', chat.id);

    const markAsDeliveredAndRead = async () => {
      try {
        console.log('📬 STEP 1: Calling markMessagesAsRead for conversation:', chat.id);
        
        // Mark ALL messages as delivered and read
        const result = await markMessagesAsRead(chat.id);
        console.log('✅ STEP 1 COMPLETE: markMessagesAsRead returned', result);

        console.log('🔄 STEP 2: Invalidating all message and conversation queries');
        // Invalidate everything
        queryClient.invalidateQueries(['messages']);
        queryClient.invalidateQueries(['conversations']);
        
        console.log('🔄 STEP 3: Refetching messages for chat:', chat.id);
        // Refetch messages
        const messagesResult = await queryClient.refetchQueries({
          queryKey: ['messages', chat.id],
          type: 'active'
        });
        console.log('✅ STEP 3 COMPLETE: Messages refetched', messagesResult);
        
        console.log('🔄 STEP 4: Refetching conversations to update badge');
        // CRITICAL: Refetch conversations to get updated unread count (should be 0)
        const convsResult = await queryClient.refetchQueries({
          queryKey: ['conversations'],
          type: 'active'
        });
        console.log('✅ STEP 4 COMPLETE: Conversations refetched - badge should show 0', convsResult);

        // Double-check: Refetch one more time after a short delay to ensure badge clears
        setTimeout(async () => {
          console.log('🔄 STEP 5: Final refetch to ensure badge is cleared');
          await queryClient.refetchQueries({
            queryKey: ['conversations'],
            type: 'active'
          });
          console.log('✅✅✅ FINAL: Badge should definitely be cleared now');
        }, 500);

        console.log('✅✅✅ ALL STEPS COMPLETE: Messages marked as read - badge should be cleared NOW');
      } catch (error) {
        console.error('❌❌❌ ERROR in markAsDeliveredAndRead:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        toast.error('Failed to mark messages as read: ' + error.message);
      }
    };

    // Run immediately
    markAsDeliveredAndRead();
  }, [chat?.id, currentUserId, queryClient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (text) => {
    if (onSendMessage && text.trim()) {
      onSendMessage(text, replyingTo?.id || null);
      setReplyingTo(null);
    }
  };

  const handleSendFile = (file, type, duration) => {
    if (onSendFile) {
      onSendFile(file, type, duration);
    }
  };

  const handleSendLocation = (location) => {
    if (onSendLocation) {
      onSendLocation(location);
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={chat.avatar} alt={chat.name} />
            <AvatarFallback>{chat.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {chat.name}
            </h3>
            {/* Real-time online/offline status */}
            <UserPresenceBadge 
              userId={chat.otherUserId} 
              showDot={true} 
              showText={true} 
              size="sm" 
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onCall?.(chat.id)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Voice Call"
          >
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => onVideoCall?.(chat.id)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Video Call"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[1000]">
              <DropdownMenuItem onClick={() => setShowProfile(true)}>
                <Search className="w-4 h-4 mr-2" />
                {t.viewProfile}
              </DropdownMenuItem>
              {onSearch && (
                <DropdownMenuItem onClick={() => onSearch(chat.id)}>
                  <Search className="w-4 h-4 mr-2" />
                  {t.search}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onMarkAsUnread && (
                <DropdownMenuItem onClick={() => onMarkAsUnread(chat.id)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t.markAsUnread}
                </DropdownMenuItem>
              )}
              {chat.isPinned && onUnpin ? (
                <DropdownMenuItem onClick={() => onUnpin(chat.id)}>
                  <PinOff className="w-4 h-4 mr-2" />
                  {t.unpin}
                </DropdownMenuItem>
              ) : onPin && (
                <DropdownMenuItem onClick={() => onPin(chat.id)}>
                  <Pin className="w-4 h-4 mr-2" />
                  {t.pin}
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(chat.id)}>
                  <Archive className="w-4 h-4 mr-2" />
                  {t.archive}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onClearChat && (
                <DropdownMenuItem onClick={() => onClearChat(chat.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.clearMessages}
                </DropdownMenuItem>
              )}
              {onDeleteChat && (
                <DropdownMenuItem 
                  onClick={() => onDeleteChat(chat.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.delete}
                </DropdownMenuItem>
              )}
              {onPopOut && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPopOut(chat.id)}>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    {t.popOutChat}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pinned Messages Section - WhatsApp Style */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="bg-[#f0f2f5] border-b border-gray-300">
          <div className="px-4 py-2 space-y-0.5 max-h-32 overflow-y-auto">
            {pinnedMessages.map((pinnedMsg) => {
              const isOwn = pinnedMsg.isOwn;
              const getMessagePreview = () => {
                if (pinnedMsg.type === 'text') {
                  const text = pinnedMsg.text || pinnedMsg.content || '';
                  // Truncate long messages
                  return text.length > 50 ? text.substring(0, 50) + '...' : text;
                } else if (pinnedMsg.type === 'image') {
                  return '📷 Photo';
                } else if (pinnedMsg.type === 'video') {
                  return '🎥 Video';
                } else if (pinnedMsg.type === 'audio' || pinnedMsg.type === 'voice') {
                  return '🎤 Audio';
                } else if (pinnedMsg.type === 'document' || pinnedMsg.type === 'file') {
                  const fileName = pinnedMsg.fileName || 'Document';
                  return `📄 ${fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}`;
                } else if (pinnedMsg.type === 'location') {
                  return '📍 Location';
                } else {
                  return 'Media';
                }
              };

              return (
                <div 
                  key={pinnedMsg.id} 
                  className="flex items-center gap-2.5 group cursor-pointer hover:bg-gray-200/70 rounded-lg px-2.5 py-2 transition-colors"
                  onClick={() => {
                    // Scroll to message
                    const messageElement = document.querySelector(`[data-message-id="${pinnedMsg.id}"]`);
                    if (messageElement) {
                      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Highlight the message briefly
                      messageElement.classList.add('bg-yellow-100', 'transition-colors', 'duration-300');
                      setTimeout(() => {
                        messageElement.classList.remove('bg-yellow-100');
                      }, 2000);
                    } else {
                      // If message not found, try scrolling to bottom and retry
                      setTimeout(() => {
                        const retryElement = document.querySelector(`[data-message-id="${pinnedMsg.id}"]`);
                        if (retryElement) {
                          retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          retryElement.classList.add('bg-yellow-100');
                          setTimeout(() => {
                            retryElement.classList.remove('bg-yellow-100');
                          }, 2000);
                        }
                      }, 500);
                    }
                  }}
                >
                  <Pin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-[#25D366] whitespace-nowrap">
                        {pinnedMsg.senderName || 'User'}:
                      </span>
                      <span className="text-sm text-gray-800 break-words">
                        {getMessagePreview()}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-300 rounded-full transition-opacity flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-gray-900 text-white border-gray-700">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUnpin) {
                            onUnpin(pinnedMsg.id);
                          }
                        }}
                        className="hover:bg-gray-800 cursor-pointer"
                      >
                        <PinOff className="w-4 h-4 mr-2" />
                        {t.unpin}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Scroll to message
                          const messageElement = document.querySelector(`[data-message-id="${pinnedMsg.id}"]`);
                          if (messageElement) {
                            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Highlight the message briefly
                            messageElement.classList.add('bg-yellow-100');
                            setTimeout(() => {
                              messageElement.classList.remove('bg-yellow-100');
                            }, 2000);
                          }
                        }}
                        className="hover:bg-gray-800 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {t.viewProfile === "View Profile" ? "Go to message" : "Ir al mensaje"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn = message.senderId === currentUserId;
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                const showTime = index === messages.length - 1 || 
                  new Date(message.timestamp) - new Date(messages[index + 1].timestamp) > 300000; // 5 minutes

                return (
                  <div key={message.id || index} data-message-id={message.id}>
                    <ChatMessage
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showTime={showTime}
                      onReply={(msg) => setReplyingTo(msg)}
                      onForward={(msg) => onForwardMessage?.(msg)}
                      onStar={async (msg) => {
                        try {
                          await toggleStarMessage(msg.id);
                          queryClient.invalidateQueries({ queryKey: ['messages', chat?.id] });
                        } catch (error) {
                          toast.error(error?.message || 'Failed to update starred message');
                        }
                      }}
                      onPin={(msg, isPinned, expiryDate) => {
                        if (onPin) {
                          onPin(msg.id, isPinned, expiryDate);
                        }
                      }}
                      onDelete={(msg, deleteType) => {
                        if (onDeleteMessage) {
                          onDeleteMessage(msg.id, deleteType);
                        }
                      }}
                      onSelect={(msg) => {
                        // TODO: Implement select functionality
                        console.log('Select:', msg);
                      }}
                      onShare={async (msg) => {
                        const content = msg?.text || msg?.content || msg?.fileUrl || '';
                        if (content) {
                          await navigator.clipboard.writeText(content);
                          toast.success('Message copied for sharing');
                        }
                      }}
                      onReact={async (msg, emoji) => {
                        try {
                          await toggleReaction(msg.id, emoji);
                          queryClient.invalidateQueries({ queryKey: ['messages', chat?.id] });
                        } catch (error) {
                          toast.error(error?.message || 'Failed to update reaction');
                        }
                      }}
                      onEdit={(msg, newText) => {
                        if (onEditMessage) {
                          onEditMessage(msg.id, newText);
                        }
                      }}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {replyingTo && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-600">Replying to {replyingTo.senderName || 'message'}</p>
            <p className="text-sm text-gray-500 truncate">{replyingTo.text || replyingTo.content || replyingTo.fileName || 'Attachment'}</p>
          </div>
          <button type="button" onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-gray-200" aria-label="Cancel reply">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onSendLocation={handleSendLocation}
        disabled={isLoading}
      />

      {/* User Profile Modal */}
      <UserProfile
        user={chat}
        messages={messages}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onCall={() => {
          onCall?.(chat.id);
          setShowProfile(false);
        }}
        onVideoCall={() => {
          onVideoCall?.(chat.id);
          setShowProfile(false);
        }}
        onMessage={() => {
          setShowProfile(false);
        }}
      />
    </div>
  );
}

