import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import {
  editMessage,
  getMessages,
  getMyConversations,
  getOrCreateConversation,
  markMessageDelivered,
  markMessagesAsRead,
  sendFileMessage,
  sendLocationMessage,
  sendMessage,
  subscribeToConversations,
  subscribeToMessages,
  unsubscribeFromMessages,
  updateConversationSettings,
  deleteMessage,
} from '@/lib/chatService';
import { supabase } from '@/lib/supabase';

/**
 * Relaunch pairwise Chat.
 *
 * Only working launch-scope behavior lives here: conversation discovery, private text /
 * attachment / location messages, delivery/read state, pin/mute/archive settings, editing
 * own text, and deleting one's own message for the conversation. Legacy prototype call,
 * pop-out, fake mark-unread, clear-chat, and destructive-conversation-delete code has been
 * removed rather than merely hidden.
 */
export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState(null);

  const conversationsQuery = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: getMyConversations,
    enabled: Boolean(user?.id),
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const conversations = conversationsQuery.data || [];
  const visibleConversations = useMemo(
    () => conversations.filter((conversation) => !conversation.isArchived),
    [conversations]
  );

  const selectedChat = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedChatId) || null,
    [conversations, selectedChatId]
  );

  const messagesQuery = useQuery({
    queryKey: ['messages', selectedChatId],
    queryFn: () => getMessages(selectedChatId),
    enabled: Boolean(user?.id && selectedChatId),
    refetchOnWindowFocus: true,
  });

  const messages = messagesQuery.data || [];

  const refreshChatData = async (conversationId = selectedChatId) => {
    const jobs = [queryClient.invalidateQueries({ queryKey: ['conversations'] })];
    if (conversationId) jobs.push(queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }));
    await Promise.all(jobs);
  };

  // Deep-link from a member/friend profile: /Chat?userId=<member uuid>.
  useEffect(() => {
    const otherUserId = searchParams.get('userId');
    if (!user?.id || !otherUserId || otherUserId === user.id) return;

    let cancelled = false;

    const openConversation = async () => {
      try {
        const conversationId = await getOrCreateConversation(otherUserId);
        if (cancelled) return;

        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
        if (cancelled) return;
        setSelectedChatId(conversationId);

        const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
        window.history.replaceState({}, '', cleanUrl);
      } catch (error) {
        console.error('Unable to open member chat:', error);
        if (!cancelled) toast.error('Unable to open this chat');
      }
    };

    void openConversation();
    return () => {
      cancelled = true;
    };
  }, [queryClient, searchParams, user?.id]);

  // Keep the selected conversation live without polling every message continuously.
  useEffect(() => {
    if (!selectedChatId || !user?.id) return undefined;

    const subscription = subscribeToMessages(selectedChatId, async (messageData) => {
      if (messageData?.receiver_id === user.id) {
        try {
          if (!messageData.delivered_at) await markMessageDelivered(messageData.id);
          await markMessagesAsRead(selectedChatId);
        } catch (error) {
          console.warn('Unable to update incoming message receipt state:', error);
        }
      }

      await refreshChatData(selectedChatId);
    });

    return () => unsubscribeFromMessages(subscription);
  }, [selectedChatId, user?.id]);

  // Conversation metadata (last message, unread count, pin/mute/archive) is shared by the
  // list and header, so listen for its database updates separately.
  useEffect(() => {
    if (!user?.id) return undefined;

    const subscription = subscribeToConversations(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [queryClient, user?.id]);

  // Mark new incoming messages as delivered while the Chat page is open even when their
  // conversation is not selected. Read status is set only when that conversation is open.
  useEffect(() => {
    if (!user?.id) return undefined;

    const channel = supabase
      .channel(`pairwise-delivery:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async ({ new: incoming }) => {
          try {
            if (incoming?.id && !incoming.delivered_at) await markMessageDelivered(incoming.id);
            if (incoming?.conversation_id === selectedChatId) {
              await markMessagesAsRead(incoming.conversation_id);
            }
          } catch (error) {
            console.warn('Unable to update global message receipt:', error);
          } finally {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            if (incoming?.conversation_id) {
              queryClient.invalidateQueries({ queryKey: ['messages', incoming.conversation_id] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedChatId, user?.id]);

  const sendTextMutation = useMutation({
    mutationFn: ({ conversationId, receiverId, content }) =>
      sendMessage(conversationId, receiverId, content, 'text'),
    onSuccess: (_, variables) => refreshChatData(variables.conversationId),
    onError: (error) => {
      console.error('Unable to send message:', error);
      toast.error('Unable to send message');
    },
  });

  const sendFileMutation = useMutation({
    mutationFn: ({ conversationId, receiverId, file, messageType }) =>
      sendFileMessage(conversationId, receiverId, file, messageType),
    onSuccess: (_, variables) => {
      void refreshChatData(variables.conversationId);
      toast.success('Attachment sent');
    },
    onError: (error) => {
      console.error('Unable to send attachment:', error);
      toast.error(error?.message || 'Unable to send attachment');
    },
  });

  const sendLocationMutation = useMutation({
    mutationFn: ({ conversationId, receiverId, location }) =>
      sendLocationMessage(conversationId, receiverId, location),
    onSuccess: (_, variables) => {
      void refreshChatData(variables.conversationId);
      toast.success('Location shared');
    },
    onError: (error) => {
      console.error('Unable to share location:', error);
      toast.error('Unable to share location');
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, newContent }) => editMessage(messageId, newContent),
    onSuccess: () => {
      void refreshChatData();
      toast.success('Message updated');
    },
    onError: (error) => {
      console.error('Unable to edit message:', error);
      toast.error('Unable to edit message');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId }) => deleteMessage(messageId),
    onSuccess: () => {
      void refreshChatData();
      toast.success('Message deleted');
    },
    onError: (error) => {
      console.error('Unable to delete message:', error);
      toast.error('Unable to delete message');
    },
  });

  const settingsMutation = useMutation({
    mutationFn: ({ conversationId, settings }) => updateConversationSettings(conversationId, settings),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    onError: (error) => {
      console.error('Unable to update chat setting:', error);
      toast.error('Unable to update chat');
    },
  });

  const requireSelectedChat = () => {
    if (!selectedChatId || !selectedChat?.otherUserId) throw new Error('Select a chat first');
    return selectedChat;
  };

  const handleSendMessage = async (text) => {
    const chat = requireSelectedChat();
    return sendTextMutation.mutateAsync({
      conversationId: selectedChatId,
      receiverId: chat.otherUserId,
      content: text,
    });
  };

  const handleSendFile = async (file, messageType) => {
    const chat = requireSelectedChat();
    return sendFileMutation.mutateAsync({
      conversationId: selectedChatId,
      receiverId: chat.otherUserId,
      file,
      messageType,
    });
  };

  const handleSendLocation = async ({ latitude, longitude }) => {
    const chat = requireSelectedChat();
    return sendLocationMutation.mutateAsync({
      conversationId: selectedChatId,
      receiverId: chat.otherUserId,
      location: {
        lat: latitude,
        lng: longitude,
        address: `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`,
      },
    });
  };

  const handleSelectChat = async (conversationId) => {
    setSelectedChatId(conversationId);
    try {
      await markMessagesAsRead(conversationId);
      await refreshChatData(conversationId);
    } catch (error) {
      console.warn('Unable to mark selected conversation read:', error);
    }
  };

  const updateSetting = (conversationId, settings) =>
    settingsMutation.mutateAsync({ conversationId, settings });

  const handlePin = async (conversationId) => {
    await updateSetting(conversationId, { isPinned: true });
    toast.success('Chat pinned');
  };

  const handleUnpin = async (conversationId) => {
    await updateSetting(conversationId, { isPinned: false });
    toast.success('Chat unpinned');
  };

  const handleMute = async (conversationId) => {
    const chat = conversations.find((item) => item.id === conversationId);
    await updateSetting(conversationId, { isMuted: !chat?.isMuted });
    toast.success(chat?.isMuted ? 'Chat unmuted' : 'Chat muted');
  };

  const handleArchive = async (conversationId) => {
    await updateSetting(conversationId, { isArchived: true });
    if (selectedChatId === conversationId) setSelectedChatId(null);
    toast.success('Chat archived');
  };

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50" style={{ top: '64px', zIndex: 40 }}>
        <div className="text-center">
          <p className="font-medium text-gray-600">Please sign in to use private chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-gray-50" style={{ top: '64px', zIndex: 40 }}>
      <div className={`${selectedChatId ? 'hidden lg:flex' : 'flex'} w-full flex-shrink-0 lg:w-96`}>
        <ChatList
          conversations={visibleConversations}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onArchive={handleArchive}
          onMute={handleMute}
          onPin={handlePin}
          onUnpin={handleUnpin}
        />
      </div>

      <div className={`${selectedChatId ? 'flex' : 'hidden lg:flex'} flex-1`}>
        <ChatWindow
          chat={selectedChat}
          messages={messages}
          currentUserId={user.id}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onSendLocation={handleSendLocation}
          onBack={() => setSelectedChatId(null)}
          onArchive={handleArchive}
          onEditMessage={(messageId, newText) => editMessageMutation.mutateAsync({ messageId, newContent: newText })}
          onDeleteMessage={(messageId) => deleteMessageMutation.mutateAsync({ messageId })}
          isLoading={messagesQuery.isLoading || conversationsQuery.isLoading}
        />
      </div>
    </div>
  );
}
