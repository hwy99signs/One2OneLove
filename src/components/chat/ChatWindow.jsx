import React, { useEffect, useRef, useState } from 'react';
import { Phone, Video, MoreVertical, ArrowLeft, Search, MessageSquare, Pin, PinOff, Archive, Trash2, Maximize2, X, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import UserProfile from './UserProfile';
import { UserPresenceBadge } from '@/components/presence/UserPresenceIndicator';

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
  isLoading = false
}) {
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (text) => {
    if (onSendMessage && text.trim()) {
      onSendMessage(text);
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
                View Profile
              </DropdownMenuItem>
              {onSearch && (
                <DropdownMenuItem onClick={() => onSearch(chat.id)}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onMarkAsUnread && (
                <DropdownMenuItem onClick={() => onMarkAsUnread(chat.id)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mark as unread
                </DropdownMenuItem>
              )}
              {chat.isPinned && onUnpin ? (
                <DropdownMenuItem onClick={() => onUnpin(chat.id)}>
                  <PinOff className="w-4 h-4 mr-2" />
                  Unpin
                </DropdownMenuItem>
              ) : onPin && (
                <DropdownMenuItem onClick={() => onPin(chat.id)}>
                  <Pin className="w-4 h-4 mr-2" />
                  Pin
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(chat.id)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onClearChat && (
                <DropdownMenuItem onClick={() => onClearChat(chat.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear messages
                </DropdownMenuItem>
              )}
              {onDeleteChat && (
                <DropdownMenuItem 
                  onClick={() => onDeleteChat(chat.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              {onPopOut && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPopOut(chat.id)}>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Pop-out chat
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pinned Messages Section */}
      {messages.filter(msg => msg.isPinned && !msg.deletedForMe).length > 0 && (
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
          {messages
            .filter(msg => msg.isPinned && !msg.deletedForMe)
            .slice(0, 1) // Show only the most recent pinned message
            .map((pinnedMsg) => {
              const isOwn = pinnedMsg.senderId === currentUserId;
              return (
                <div key={pinnedMsg.id} className="flex items-center gap-2 group">
                  <Pin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600 font-medium">
                    {isOwn ? 'You:' : `${pinnedMsg.senderName || 'User'}:`}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {pinnedMsg.type === 'text' 
                      ? pinnedMsg.text 
                      : pinnedMsg.type === 'image' 
                      ? '📷 Photo' 
                      : pinnedMsg.type === 'video'
                      ? '🎥 Video'
                      : pinnedMsg.type === 'document'
                      ? '📄 Document'
                      : pinnedMsg.type === 'location'
                      ? '📍 Location'
                      : 'Media'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity">
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-gray-900 text-white border-gray-700">
                      <DropdownMenuItem 
                        onClick={() => {
                          if (onPin) {
                            onPin(pinnedMsg.id, false, null);
                          }
                        }}
                        className="hover:bg-gray-800"
                      >
                        <PinOff className="w-4 h-4 mr-2" />
                        Unpin
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
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
                        className="hover:bg-gray-800"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Go to message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
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
                      onReply={(msg) => {
                        // TODO: Implement reply functionality
                        console.log('Reply to:', msg);
                      }}
                      onForward={(msg) => {
                        // TODO: Implement forward functionality
                        console.log('Forward:', msg);
                      }}
                      onStar={(msg, isStarred) => {
                        // TODO: Implement star functionality
                        console.log('Star:', msg, isStarred);
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
                      onShare={(msg) => {
                        // TODO: Implement share functionality
                        console.log('Share:', msg);
                      }}
                      onReact={(msg, emoji) => {
                        // TODO: Implement reaction functionality
                        console.log('React:', msg, emoji);
                      }}
                      onCopy={(msg) => {
                        // TODO: Implement copy functionality
                        console.log('Copy:', msg);
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

