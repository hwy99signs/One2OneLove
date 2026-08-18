import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Search, MoreVertical, Phone, Video, CheckCheck, Pin, PinOff, Archive, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { AvatarWithStatus } from '@/components/presence/UserPresenceIndicator';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    voiceCall: 'Voice Call',
    videoCall: 'Video Call',
    markAsUnread: 'Mark as unread',
    unpin: 'Unpin',
    pin: 'Pin',
    archive: 'Archive',
    delete: 'Delete',
    noConversations: 'No conversations yet',
    noMatches: 'No matching conversations',
    startChat: 'Start a new chat to get started',
    searchPlaceholder: 'Search conversations',
  },
  es: {
    voiceCall: 'Llamada de Voz',
    videoCall: 'Llamada de Video',
    markAsUnread: 'Marcar como no leído',
    unpin: 'Desanclar',
    pin: 'Anclar',
    archive: 'Archivar',
    delete: 'Eliminar',
    noConversations: 'Aún no hay conversaciones',
    noMatches: 'No hay conversaciones coincidentes',
    startChat: 'Inicia un nuevo chat para comenzar',
    searchPlaceholder: 'Buscar conversaciones',
  },
  fr: {
    voiceCall: 'Appel Vocal',
    videoCall: 'Appel Vidéo',
    markAsUnread: 'Marquer comme non lu',
    unpin: 'Désépingler',
    pin: 'Épingler',
    archive: 'Archiver',
    delete: 'Supprimer',
    noConversations: 'Aucune conversation pour le moment',
    noMatches: 'Aucune conversation correspondante',
    startChat: 'Commencez une nouvelle discussion',
    searchPlaceholder: 'Rechercher des conversations',
  },
  it: {
    voiceCall: 'Chiamata Vocale',
    videoCall: 'Chiamata Video',
    markAsUnread: 'Segna come non letto',
    unpin: 'Scollega',
    pin: 'Appunta',
    archive: 'Archivia',
    delete: 'Elimina',
    noConversations: 'Nessuna conversazione ancora',
    noMatches: 'Nessuna conversazione corrispondente',
    startChat: 'Avvia una nuova chat per iniziare',
    searchPlaceholder: 'Cerca conversazioni',
  },
  de: {
    voiceCall: 'Sprachanruf',
    videoCall: 'Videoanruf',
    markAsUnread: 'Als ungelesen markieren',
    unpin: 'Lösen',
    pin: 'Anheften',
    archive: 'Archivieren',
    delete: 'Löschen',
    noConversations: 'Noch keine Unterhaltungen',
    noMatches: 'Keine passenden Unterhaltungen',
    startChat: 'Starten Sie einen neuen Chat',
    searchPlaceholder: 'Unterhaltungen durchsuchen',
  },
  nl: {
    voiceCall: 'Spraakoproep',
    videoCall: 'Video-oproep',
    markAsUnread: 'Markeren als ongelezen',
    unpin: 'Losmaken',
    pin: 'Vastmaken',
    archive: 'Archiveren',
    delete: 'Verwijderen',
    noConversations: 'Nog geen gesprekken',
    noMatches: 'Geen overeenkomende gesprekken',
    startChat: 'Start een nieuwe chat om te beginnen',
    searchPlaceholder: 'Gesprekken zoeken',
  },
};

export default function ChatList({
  conversations,
  selectedChatId,
  onSelectChat,
  onSearch,
  onCall,
  onVideoCall,
  onArchive,
  onDelete,
  onMute,
  onPin,
  onUnpin,
  onMarkAsUnread,
  // Relaunch safety defaults: do not surface controls that are not backed by a complete
  // production-ready implementation. They can be deliberately enabled later.
  callsEnabled = false,
  markUnreadEnabled = false,
  destructiveDeleteEnabled = false,
}) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const filteredConversations = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations || [];

    return (conversations || []).filter((chat) => {
      const name = String(chat?.name || '').toLowerCase();
      const lastMessage = String(chat?.lastMessage || '').toLowerCase();
      return name.includes(query) || lastMessage.includes(query);
    });
  }, [conversations, searchQuery]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const hasAnyConversation = (conversations || []).length > 0;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Chats</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 bg-gray-100 border-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">{hasAnyConversation ? t.noMatches : t.noConversations}</p>
            {!hasAnyConversation && <p className="text-sm text-gray-400 mt-1">{t.startChat}</p>}
          </div>
        ) : (
          filteredConversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                'group flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100',
                selectedChatId === chat.id && 'bg-gray-50'
              )}
            >
              <div className="flex-shrink-0">
                <AvatarWithStatus
                  userId={chat.otherUserId}
                  avatarUrl={chat.avatar}
                  name={chat.name}
                  size="lg"
                  showStatus={true}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{chat.name}</h3>
                  {chat.lastMessageTime && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatLastSeen(chat.lastMessageTime)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate flex-1">{chat.lastMessage}</p>
                  {chat.unreadCount > 0 && (
                    <span className="flex-shrink-0 ml-2 bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  )}
                </div>
                {chat.isMuted && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-400">🔇 Muted</span>
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions for ${chat.name || 'conversation'}`}
                    onClick={(event) => event.stopPropagation()}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[1000]">
                  {callsEnabled && onCall && (
                    <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onCall(chat.id); }}>
                      <Phone className="w-4 h-4 mr-2" />
                      {t.voiceCall}
                    </DropdownMenuItem>
                  )}
                  {callsEnabled && onVideoCall && (
                    <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onVideoCall(chat.id); }}>
                      <Video className="w-4 h-4 mr-2" />
                      {t.videoCall}
                    </DropdownMenuItem>
                  )}
                  {callsEnabled && (onCall || onVideoCall) && <DropdownMenuSeparator />}

                  {markUnreadEnabled && onMarkAsUnread && (
                    <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onMarkAsUnread(chat.id); }}>
                      <CheckCheck className="w-4 h-4 mr-2" />
                      {t.markAsUnread}
                    </DropdownMenuItem>
                  )}
                  {chat.isPinned && onUnpin ? (
                    <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onUnpin(chat.id); }}>
                      <PinOff className="w-4 h-4 mr-2" />
                      {t.unpin}
                    </DropdownMenuItem>
                  ) : onPin && (
                    <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onPin(chat.id); }}>
                      <Pin className="w-4 h-4 mr-2" />
                      {t.pin}
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onArchive(chat.id); }}>
                      <Archive className="w-4 h-4 mr-2" />
                      {t.archive}
                    </DropdownMenuItem>
                  )}

                  {destructiveDeleteEnabled && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(event) => { event.stopPropagation(); onDelete(chat.id); }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t.delete}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
