import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import CallWindow from '@/components/chat/CallWindow';
import { useLanguage } from '@/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { createPageUrl } from '@/utils';
import {
  getMyConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendFileMessage,
  sendLocationMessage,
  markMessagesAsRead,
  markMessageDelivered,
  editMessage,
  deleteMessage,
  updateConversationSettings,
  deleteConversation,
  subscribeToMessages,
  unsubscribeFromMessages,
  subscribeToConversations,
} from '@/lib/chatService';
import { supabase } from '@/lib/supabase';
import { pinMessage, unpinMessage } from '@/lib/chatFeaturesService';

export default function Chat() {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callState, setCallState] = useState({
    isConnected: false,
    isMuted: false,
    isVideoEnabled: true,
    isSpeakerEnabled: false,
    duration: 0,
  });
  const messageSubscriptionRef = useRef(null);
  const conversationSubscriptionRef = useRef(null);

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: getMyConversations,
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedChatId],
    queryFn: () => getMessages(selectedChatId),
    enabled: !!selectedChatId,
    refetchOnWindowFocus: true, // Refetch when window gains focus to get status updates
  });

  // Mark messages as delivered and read when chat is viewed
  useEffect(() => {
    console.log('🔵 Chat page useEffect triggered', { 
      selectedChatId, 
      userId: user?.id,
      hasUser: !!user 
    });

    if (!selectedChatId || !user) {
      console.log('⏸️ Chat page: Missing selectedChatId or user');
      return;
    }

    console.log('🔵 Chat page: Starting mark as read for conversation:', selectedChatId);

    const markAsRead = async () => {
      try {
        console.log('📬 STEP 1: Calling markMessagesAsRead');
        await markMessagesAsRead(selectedChatId);
        console.log('✅ STEP 1 COMPLETE: markMessagesAsRead finished');

        console.log('🔄 STEP 2: Refetching queries');
        // Force immediate refetch of everything
        await Promise.all([
          queryClient.refetchQueries(['messages', selectedChatId], { type: 'active' }),
          queryClient.refetchQueries(['conversations'], { type: 'active' }),
        ]);
        console.log('✅ STEP 2 COMPLETE: Queries refetched');

        console.log('✅✅✅ Chat page: Messages marked as read - UI refreshed');
      } catch (error) {
        console.error('❌❌❌ Chat page ERROR:', error);
        console.error('Error details:', error.message, error.stack);
      }
    };

    // Run immediately when chat is selected
    markAsRead();
  }, [selectedChatId, user?.id, queryClient]);

  // Handle URL parameters to open a specific chat
  useEffect(() => {
    const userId = searchParams.get('userId');
    
    if (userId && user) {
      console.log('📱 Opening chat with userId:', userId);
      handleOpenChatWithUser(userId);
    }
  }, [searchParams, user]);

  // Refetch conversations when Chat page is mounted to ensure badge is up to date
  useEffect(() => {
    if (user) {
      queryClient.refetchQueries(['conversations']);
    }
  }, [user, queryClient]);

  const handleOpenChatWithUser = async (otherUserId) => {
    try {
      console.log('🔄 Getting or creating conversation for user:', otherUserId);
      
      // Get or create conversation
      const conversationId = await getOrCreateConversation(otherUserId);
      console.log('✅ Got conversation ID:', conversationId);
      
      // Refetch conversations to get the latest data
      const { data: updatedConversations } = await queryClient.fetchQuery({
        queryKey: ['conversations'],
        queryFn: getMyConversations
      });
      
      console.log('📬 Updated conversations:', updatedConversations);
      
      // Find the conversation we just created/got
      const conv = updatedConversations?.find(c => c.id === conversationId);
      
      if (conv) {
        console.log('✅ Found conversation, selecting:', conv);
        setSelectedChatId(conversationId);
        setSelectedChat(conv);
        markMessagesAsRead(conversationId);
      } else {
        console.warn('⚠️ Conversation not found in list, setting ID anyway');
        setSelectedChatId(conversationId);
        // Set a minimal chat object
        setSelectedChat({
          id: conversationId,
          otherUserId: otherUserId,
          name: 'Loading...',
          avatar: '',
        });
      }

      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      console.error('❌ Error opening chat:', error);
      toast.error('Failed to open chat: ' + error.message);
    }
  };

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!selectedChatId || !user) return;

    console.log('🔔 Setting up real-time subscription for:', selectedChatId);
    
    const subscription = subscribeToMessages(selectedChatId, async (messageData) => {
      console.log('📨 Real-time message event:', messageData);
      
      // If this is a new message for current user and chat is open, mark as delivered and read IMMEDIATELY
      if (messageData.receiver_id === user.id) {
        console.log('📬 New message received - marking as delivered and read IMMEDIATELY');
        try {
          // Mark as delivered first (if not already)
          if (!messageData.delivered_at) {
            await markMessageDelivered(messageData.id);
            console.log('✅ Message marked as delivered');
          }
          
          // Mark ALL messages in conversation as read (including this new one)
          await markMessagesAsRead(selectedChatId);
          console.log('✅ All messages marked as read - badge should clear');
          
          // Force immediate UI refresh
          await Promise.all([
            queryClient.refetchQueries(['messages', selectedChatId], { type: 'active' }),
            queryClient.refetchQueries(['conversations'], { type: 'active' }),
          ]);
        } catch (error) {
          console.error('❌ Error auto-marking message:', error);
        }
      }
      
      // Always invalidate to update UI (for status changes on sent messages)
      queryClient.invalidateQueries(['messages', selectedChatId]);
      queryClient.invalidateQueries(['conversations']);
    });

    messageSubscriptionRef.current = subscription;

    return () => {
      if (messageSubscriptionRef.current) {
        unsubscribeFromMessages(messageSubscriptionRef.current);
      }
    };
  }, [selectedChatId, user, queryClient]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up conversation updates subscription');
    
    const subscription = subscribeToConversations((payload) => {
      console.log('📬 Conversation updated:', payload);
      queryClient.invalidateQueries(['conversations']);
    });

    conversationSubscriptionRef.current = subscription;

    return () => {
      if (conversationSubscriptionRef.current) {
        unsubscribeFromMessages(conversationSubscriptionRef.current);
      }
    };
  }, [user]);

  // CRITICAL: Global subscription to mark ALL incoming messages as delivered
  // This ensures senders see double ticks even if receiver's chat isn't open
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up GLOBAL message delivery subscription for user:', user.id);

    // Subscribe to ALL new messages where current user is receiver
    const globalSubscription = supabase
      .channel(`global-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new;
          console.log('📬 GLOBAL: New message received for you:', newMessage.id);
          
          // Mark as delivered immediately (even if chat isn't open)
          try {
            if (!newMessage.delivered_at) {
              await markMessageDelivered(newMessage.id);
              console.log('✅ GLOBAL: Message marked as delivered - sender will see double ticks');
            }
            
            // CRITICAL: If chat is open, mark as read immediately and recalculate count
            if (selectedChatId === newMessage.conversation_id) {
              console.log('📬 GLOBAL: Chat is open, marking as read immediately');
              await markMessagesAsRead(newMessage.conversation_id);
              
              // Force immediate recalculation
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error: recalcError } = await supabase
                  .rpc('recalculate_unread_count', {
                    p_conversation_id: newMessage.conversation_id,
                    p_user_id: user.id
                  });
                
                if (recalcError) {
                  console.warn('⚠️ Could not recalculate:', recalcError);
                }
              }
            }
            
            // Invalidate queries to update UI
            queryClient.invalidateQueries(['messages']);
            queryClient.invalidateQueries(['conversations']);
          } catch (error) {
            console.error('❌ GLOBAL: Error processing new message:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from global message delivery');
      supabase.removeChannel(globalSubscription);
    };
  }, [user, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, receiverId, content, type }) => {
      return await sendMessage(conversationId, receiverId, content, type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChatId]);
      queryClient.invalidateQueries(['conversations']);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    },
  });

  // Send file mutation
  const sendFileMutation = useMutation({
    mutationFn: async ({ conversationId, receiverId, file, messageType }) => {
      return await sendFileMessage(conversationId, receiverId, file, messageType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChatId]);
      queryClient.invalidateQueries(['conversations']);
      toast.success('File sent');
    },
    onError: (error) => {
      console.error('Error sending file:', error);
      toast.error('Failed to send file');
    },
  });

  // Send location mutation
  const sendLocationMutation = useMutation({
    mutationFn: async ({ conversationId, receiverId, location }) => {
      return await sendLocationMessage(conversationId, receiverId, location);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChatId]);
      queryClient.invalidateQueries(['conversations']);
      toast.success('Location shared');
    },
    onError: (error) => {
      console.error('Error sharing location:', error);
      toast.error('Failed to share location');
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, newContent }) => {
      return await editMessage(messageId, newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChatId]);
      toast.success('Message updated');
    },
    onError: (error) => {
      console.error('Error editing message:', error);
      toast.error('Failed to update message');
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId }) => {
      return await deleteMessage(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChatId]);
      queryClient.invalidateQueries(['conversations']);
      toast.success('Message deleted');
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    },
  });

  // Update conversation settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ conversationId, settings }) => {
      return await updateConversationSettings(conversationId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async ({ conversationId }) => {
      return await deleteConversation(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      setSelectedChatId(null);
      setSelectedChat(null);
      toast.success('Chat deleted');
    },
    onError: (error) => {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete chat');
    },
  });

  const handleSendMessage = async (text) => {
    if (!selectedChatId || !selectedChat) return;

    await sendMessageMutation.mutateAsync({
      conversationId: selectedChatId,
      receiverId: selectedChat.otherUserId,
      content: text,
      type: 'text',
    });
  };

  const handleSendFile = async (file, type, duration) => {
    if (!selectedChatId || !selectedChat) return;

    await sendFileMutation.mutateAsync({
      conversationId: selectedChatId,
      receiverId: selectedChat.otherUserId,
      file,
      messageType: type,
    });
  };

  const handleSendLocation = async (location) => {
    if (!selectedChatId || !selectedChat) return;

    await sendLocationMutation.mutateAsync({
      conversationId: selectedChatId,
      receiverId: selectedChat.otherUserId,
      location: {
        lat: location.latitude,
        lng: location.longitude,
        address: `${location.latitude}, ${location.longitude}`,
      },
    });
  };

  const handleSelectChat = async (chatId) => {
    console.log('💬 Selecting chat:', chatId);
    setSelectedChatId(chatId);
    const chat = conversations.find((c) => c.id === chatId);
    setSelectedChat(chat);
    
    // Immediately mark messages as read and force UI update
    if (chatId) {
      try {
        // Mark as read first
        await markMessagesAsRead(chatId);
        console.log('✅ Messages marked as read for chat:', chatId);
        
        // Force aggressive refetch to clear badge immediately
        await Promise.all([
          queryClient.invalidateQueries(['messages', chatId]),
          queryClient.invalidateQueries(['conversations']),
        ]);
        
        // Force another immediate refetch of conversations to ensure badge updates
        await queryClient.refetchQueries(['conversations'], { 
          type: 'active',
          exact: false 
        });
        
        console.log('✅ UI updated - badge should be cleared');
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleMarkAsUnread = (chatId) => {
    // This would require a backend update to set unread count
    toast.success('Marked as unread');
  };

  const handlePin = async (chatId) => {
    await updateSettingsMutation.mutateAsync({
      conversationId: chatId,
      settings: { isPinned: true },
    });
    toast.success('Chat pinned');
  };

  const handleUnpin = async (chatId) => {
    await updateSettingsMutation.mutateAsync({
      conversationId: chatId,
      settings: { isPinned: false },
    });
    toast.success('Chat unpinned');
  };

  // Pin/Unpin message handlers
  const handlePinMessage = async (messageId, isPinned, expiryDate) => {
    if (!selectedChatId) return;
    
    try {
      if (isPinned) {
        await pinMessage(messageId, selectedChatId, expiryDate);
        toast.success('Message pinned');
      } else {
        await unpinMessage(messageId, selectedChatId);
        toast.success('Message unpinned');
      }
      // Invalidate pinned messages query to refresh the list
      queryClient.invalidateQueries(['pinnedMessages', selectedChatId]);
    } catch (error) {
      console.error('Error pinning/unpinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  const handleUnpinMessage = async (messageId) => {
    if (!selectedChatId) return;
    
    try {
      await unpinMessage(messageId, selectedChatId);
      toast.success('Message unpinned');
      // Invalidate pinned messages query to refresh the list
      queryClient.invalidateQueries(['pinnedMessages', selectedChatId]);
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast.error('Failed to unpin message');
    }
  };

  const handleArchive = async (chatId) => {
    await updateSettingsMutation.mutateAsync({
      conversationId: chatId,
      settings: { isArchived: true },
    });
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
      setSelectedChat(null);
    }
    toast.success('Chat archived');
  };

  const handleMute = async (chatId, isMuted) => {
    await updateSettingsMutation.mutateAsync({
      conversationId: chatId,
      settings: { isMuted: !isMuted },
    });
    toast.success(isMuted ? 'Chat unmuted' : 'Chat muted');
  };

  const handlePopOut = (chatId) => {
    const chatUrl = `${window.location.origin}${createPageUrl('Chat')}?chatId=${chatId}`;
    window.open(chatUrl, '_blank', 'width=800,height=600');
    toast.info('Chat opened in new window');
  };

  const handleCall = (chatId) => {
    const chat = conversations.find((c) => c.id === chatId);
    setCurrentCall({
      type: 'voice',
      contact: chat,
      isIncoming: false,
    });
  };

  const handleVideoCall = (chatId) => {
    const chat = conversations.find((c) => c.id === chatId);
    setCurrentCall({
      type: 'video',
      contact: chat,
      isIncoming: false,
    });
  };

  const handleAcceptCall = () => {
    setCallState((prev) => ({ ...prev, isConnected: true }));
    // TODO: Initialize WebRTC connection
  };

  const handleRejectCall = () => {
    setCurrentCall(null);
    setCallState({
      isConnected: false,
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerEnabled: false,
      duration: 0,
    });
  };

  const handleEndCall = () => {
    setCurrentCall(null);
    setCallState({
      isConnected: false,
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerEnabled: false,
      duration: 0,
    });
  };

  const handleEditMessage = async (messageId, newText) => {
    await editMessageMutation.mutateAsync({
      messageId,
      newContent: newText,
    });
  };

  const handleDeleteMessage = async (messageId, deleteType) => {
    // For now, we only support delete for everyone
    await deleteMessageMutation.mutateAsync({ messageId });
  };

  const handleClearChat = async (chatId) => {
    // This would require deleting all messages in the conversation
    toast.info('Clear chat feature coming soon');
  };

  const handleDeleteChat = async (chatId) => {
    await deleteConversationMutation.mutateAsync({ conversationId: chatId });
  };

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50" style={{ top: '64px', zIndex: 40 }}>
        <div className="text-center">
          <p className="text-gray-500">Please sign in to use chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-gray-50" style={{ top: '64px', zIndex: 40 }}>
      {/* Chat List */}
      <div
        className={`
          ${selectedChatId ? 'hidden lg:flex' : 'flex'}
          w-full lg:w-96 flex-shrink-0
        `}
      >
        <ChatList
          conversations={conversations}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onCall={handleCall}
          onVideoCall={handleVideoCall}
          onArchive={handleArchive}
          onDelete={handleDeleteChat}
          onMute={(chatId) => {
            const chat = conversations.find((c) => c.id === chatId);
            handleMute(chatId, chat?.isMuted);
          }}
          onPin={handlePin}
          onUnpin={handleUnpin}
          onMarkAsUnread={handleMarkAsUnread}
        />
      </div>

      {/* Chat Window */}
      <div
        className={`
          ${selectedChatId ? 'flex' : 'hidden lg:flex'}
          flex-1
        `}
      >
        <ChatWindow
          chat={selectedChat}
          messages={messages}
          currentUserId={user?.id}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onSendLocation={handleSendLocation}
          onCall={() => handleCall(selectedChatId)}
          onVideoCall={() => handleVideoCall(selectedChatId)}
          onBack={() => {
            setSelectedChatId(null);
            setSelectedChat(null);
          }}
          onMute={(chatId) => {
            const chat = conversations.find((c) => c.id === chatId);
            handleMute(chatId, chat?.isMuted);
          }}
          onClearChat={handleClearChat}
          onDeleteChat={handleDeleteChat}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onMarkAsUnread={handleMarkAsUnread}
          onPin={handlePinMessage}
          onUnpin={handleUnpinMessage}
          onArchive={handleArchive}
          onPopOut={handlePopOut}
          isLoading={messagesLoading}
        />
      </div>

      {/* Call Window */}
      {currentCall && (
        <CallWindow
          callType={currentCall.type}
          contact={currentCall.contact}
          isIncoming={currentCall.isIncoming}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEnd={handleEndCall}
          onToggleMute={() =>
            setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }))
          }
          onToggleVideo={() =>
            setCallState((prev) => ({
              ...prev,
              isVideoEnabled: !prev.isVideoEnabled,
            }))
          }
          onToggleSpeaker={() =>
            setCallState((prev) => ({
              ...prev,
              isSpeakerEnabled: !prev.isSpeakerEnabled,
            }))
          }
          isMuted={callState.isMuted}
          isVideoEnabled={callState.isVideoEnabled}
          isSpeakerEnabled={callState.isSpeakerEnabled}
          callDuration={callState.duration}
          isConnected={callState.isConnected}
        />
      )}
    </div>
  );
}
