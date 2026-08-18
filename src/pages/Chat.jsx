import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { getChatCopy } from '@/lib/chatCopy';
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
} from '@/lib/relaunchChatService';
import { supabase } from '@/lib/supabase';

export default function Chat() {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getChatCopy(currentLanguage);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState(null);

  const conversationsQuery = useQuery({ queryKey: ['conversations', user?.id], queryFn: getMyConversations, enabled: Boolean(user?.id), refetchInterval: 30000, refetchOnMount: true, refetchOnWindowFocus: true });
  const conversations = conversationsQuery.data || [];
  const visibleConversations = useMemo(() => conversations.filter((conversation) => !conversation.isArchived), [conversations]);
  const selectedChat = useMemo(() => conversations.find((conversation) => conversation.id === selectedChatId) || null, [conversations, selectedChatId]);

  const messagesQuery = useQuery({ queryKey: ['messages', selectedChatId], queryFn: () => getMessages(selectedChatId), enabled: Boolean(user?.id && selectedChatId), refetchOnWindowFocus: true });
  const messages = messagesQuery.data || [];

  const refreshChatData = async (conversationId = selectedChatId) => {
    const jobs = [queryClient.invalidateQueries({ queryKey: ['conversations'] })];
    if (conversationId) jobs.push(queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }));
    await Promise.all(jobs);
  };

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
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Unable to open member chat:', error);
        if (!cancelled) toast.error(t.unableOpen);
      }
    };

    void openConversation();
    return () => { cancelled = true; };
  }, [queryClient, searchParams, t.unableOpen, user?.id]);

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

  useEffect(() => {
    if (!user?.id) return undefined;
    const subscription = subscribeToConversations(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }));
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [queryClient, user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const channel = supabase
      .channel(`pairwise-delivery:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, async ({ new: incoming }) => {
        try {
          if (incoming?.id && !incoming.delivered_at) await markMessageDelivered(incoming.id);
          if (incoming?.conversation_id === selectedChatId) await markMessagesAsRead(incoming.conversation_id);
        } catch (error) {
          console.warn('Unable to update global message receipt:', error);
        } finally {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          if (incoming?.conversation_id) queryClient.invalidateQueries({ queryKey: ['messages', incoming.conversation_id] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, selectedChatId, user?.id]);

  const sendTextMutation = useMutation({
    mutationFn: ({ conversationId, receiverId, content }) => sendMessage(conversationId, receiverId, content, 'text'),
    onSuccess: (_, variables) => refreshChatData(variables.conversationId),
    onError: (error) => { console.error('Unable to send message:', error); toast.error(t.unableSend); },
  });

  const sendFileMutation = useMutation({
    mutationFn: ({ conversationId, receiverId, file, messageType }) => sendFileMessage(conversationId, receiverId, file, messageType),
    onSuccess: (_, variables) => { void refreshChatData(variables.conversationId); toast.success(t.attachmentSent); },
    onError: (error) => { console.error('Unable to send attachment:', error); toast.error(error?.message || t.unableAttachment); },
  });

  const sendLocationMutation = useMutation({
    mutationFn: ({ conversationId, receiverId, location }) => sendLocationMessage(conversationId, receiverId, location),
    onSuccess: (_, variables) => { void refreshChatData(variables.conversationId); toast.success(t.locationShared); },
    onError: (error) => { console.error('Unable to share location:', error); toast.error(t.unableLocation); },
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, newContent }) => editMessage(messageId, newContent),
    onSuccess: () => { void refreshChatData(); toast.success(t.messageUpdated); },
    onError: (error) => { console.error('Unable to edit message:', error); toast.error(t.unableEdit); },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId }) => deleteMessage(messageId),
    onSuccess: () => { void refreshChatData(); toast.success(t.messageDeleted); },
    onError: (error) => { console.error('Unable to delete message:', error); toast.error(t.unableDelete); },
  });

  const settingsMutation = useMutation({
    mutationFn: ({ conversationId, settings }) => updateConversationSettings(conversationId, settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    onError: (error) => { console.error('Unable to update chat setting:', error); toast.error(t.unableUpdateChat); },
  });

  const requireSelectedChat = () => {
    if (!selectedChatId || !selectedChat?.otherUserId) throw new Error(t.selectChat);
    return selectedChat;
  };

  const handleSendMessage = async (text) => {
    const chat = requireSelectedChat();
    return sendTextMutation.mutateAsync({ conversationId: selectedChatId, receiverId: chat.otherUserId, content: text });
  };

  const handleSendFile = async (file, messageType) => {
    const chat = requireSelectedChat();
    return sendFileMutation.mutateAsync({ conversationId: selectedChatId, receiverId: chat.otherUserId, file, messageType });
  };

  const handleSendLocation = async ({ latitude, longitude }) => {
    const chat = requireSelectedChat();
    return sendLocationMutation.mutateAsync({ conversationId: selectedChatId, receiverId: chat.otherUserId, location: { lat: latitude, lng: longitude, address: `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` } });
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

  const updateSetting = (conversationId, settings) => settingsMutation.mutateAsync({ conversationId, settings });
  const handlePin = async (conversationId) => { await updateSetting(conversationId, { isPinned: true }); toast.success(t.pinned); };
  const handleUnpin = async (conversationId) => { await updateSetting(conversationId, { isPinned: false }); toast.success(t.unpinned); };
  const handleMute = async (conversationId) => {
    const chat = conversations.find((item) => item.id === conversationId);
    await updateSetting(conversationId, { isMuted: !chat?.isMuted });
    toast.success(chat?.isMuted ? t.unmuted : t.muted);
  };
  const handleArchive = async (conversationId) => { await updateSetting(conversationId, { isArchived: true }); if (selectedChatId === conversationId) setSelectedChatId(null); toast.success(t.archived); };

  if (!user) {
    return <div className="fixed inset-0 flex items-center justify-center bg-gray-50" style={{ top: '64px', zIndex: 40 }}><div className="text-center"><p className="font-medium text-gray-600">{t.signInChat}</p></div></div>;
  }

  return (
    <div className="fixed inset-0 flex bg-gray-50" style={{ top: '64px', zIndex: 40 }}>
      <div className={`${selectedChatId ? 'hidden lg:flex' : 'flex'} w-full flex-shrink-0 lg:w-96`}>
        <ChatList conversations={visibleConversations} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} onArchive={handleArchive} onMute={handleMute} onPin={handlePin} onUnpin={handleUnpin} />
      </div>
      <div className={`${selectedChatId ? 'flex' : 'hidden lg:flex'} flex-1`}>
        <ChatWindow chat={selectedChat} messages={messages} currentUserId={user.id} onSendMessage={handleSendMessage} onSendFile={handleSendFile} onSendLocation={handleSendLocation} onBack={() => setSelectedChatId(null)} onArchive={handleArchive} onEditMessage={(messageId, newText) => editMessageMutation.mutateAsync({ messageId, newContent: newText })} onDeleteMessage={(messageId) => deleteMessageMutation.mutateAsync({ messageId })} isLoading={messagesQuery.isLoading || conversationsQuery.isLoading} />
      </div>
    </div>
  );
}