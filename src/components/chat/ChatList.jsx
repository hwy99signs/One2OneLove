import React from 'react';
import { Search, MoreVertical, Phone, Video, CheckCheck, Pin, PinOff, Archive, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { AvatarWithStatus } from '@/components/presence/UserPresenceIndicator';
import { useLanguage } from '@/Layout';
import { getChatCopy } from '@/lib/chatCopy';

const translations = {
  en: { voiceCall: 'Voice Call', videoCall: 'Video Call', markAsUnread: 'Mark as unread', unpin: 'Unpin', pin: 'Pin', archive: 'Archive', delete: 'Delete', noConversations: 'No conversations yet', noMatches: 'No matching conversations', startChat: 'Connect with a member first, then start a private chat', searchPlaceholder: 'Search conversations' },
  es: { voiceCall: 'Llamada de voz', videoCall: 'Llamada de video', markAsUnread: 'Marcar como no leído', unpin: 'Desanclar', pin: 'Anclar', archive: 'Archivar', delete: 'Eliminar', noConversations: 'Aún no hay conversaciones', noMatches: 'No hay conversaciones coincidentes', startChat: 'Conecta primero con un miembro y luego inicia un chat privado', searchPlaceholder: 'Buscar conversaciones' },
  fr: { voiceCall: 'Appel vocal', videoCall: 'Appel vidéo', markAsUnread: 'Marquer comme non lu', unpin: 'Désépingler', pin: 'Épingler', archive: 'Archiver', delete: 'Supprimer', noConversations: 'Aucune conversation pour le moment', noMatches: 'Aucune conversation correspondante', startChat: 'Connectez-vous d’abord avec un membre puis démarrez un chat privé', searchPlaceholder: 'Rechercher des conversations' },
  it: { voiceCall: 'Chiamata vocale', videoCall: 'Chiamata video', markAsUnread: 'Segna come non letto', unpin: 'Scollega', pin: 'Appunta', archive: 'Archivia', delete: 'Elimina', noConversations: 'Nessuna conversazione ancora', noMatches: 'Nessuna conversazione corrispondente', startChat: 'Connettiti prima con un membro, poi avvia una chat privata', searchPlaceholder: 'Cerca conversazioni' },
  de: { voiceCall: 'Sprachanruf', videoCall: 'Videoanruf', markAsUnread: 'Als ungelesen markieren', unpin: 'Lösen', pin: 'Anheften', archive: 'Archivieren', delete: 'Löschen', noConversations: 'Noch keine Unterhaltungen', noMatches: 'Keine passenden Unterhaltungen', startChat: 'Verbinden Sie sich zuerst mit einem Mitglied und starten Sie dann einen privaten Chat', searchPlaceholder: 'Unterhaltungen durchsuchen' },
};

const LOCALES = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };

const privacySafeAvatar = (value) => {
  const url = String(value || '').trim();
  if (!url || url.includes('api.dicebear.com')) return null;
  return url;
};

const sameLocalDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

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
  callsEnabled = false,
  markUnreadEnabled = false,
  destructiveDeleteEnabled = false,
}) {
  const { currentLanguage } = useLanguage();
  const language = Object.prototype.hasOwnProperty.call(translations, currentLanguage) ? currentLanguage : 'en';
  const t = translations[language];
  const chatCopy = getChatCopy(language);
  const locale = LOCALES[language];
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
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    if (sameLocalDay(date, now)) {
      return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameLocalDay(date, yesterday)) return chatCopy.yesterday;

    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
  };

  const hasAnyConversation = (conversations || []).length > 0;

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">{chatCopy.chatTitle}</h2>
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={handleSearch} className="border-none bg-gray-100 pl-10" /></div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"><CheckCheck className="h-8 w-8 text-gray-400" /></div>
            <p className="text-gray-500">{hasAnyConversation ? t.noMatches : t.noConversations}</p>
            {!hasAnyConversation && <p className="mt-1 text-sm text-gray-400">{t.startChat}</p>}
          </div>
        ) : filteredConversations.map((chat) => {
          const displayName = chat.name || chatCopy.memberFallback;
          return (
            <div key={chat.id} onClick={() => onSelectChat(chat.id)} className={cn('group flex cursor-pointer items-center gap-3 border-b border-gray-100 p-3 transition-colors hover:bg-gray-50', selectedChatId === chat.id && 'bg-gray-50')}>
              <div className="flex-shrink-0">
                <AvatarWithStatus userId={chat.otherUserId} avatarUrl={privacySafeAvatar(chat.avatar)} name={displayName} size="lg" showStatus />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between"><h3 className="truncate text-sm font-semibold text-gray-900">{displayName}</h3>{chat.lastMessageTime && <span className="ml-2 flex-shrink-0 text-xs text-gray-500">{formatLastSeen(chat.lastMessageTime)}</span>}</div>
                <div className="flex items-center justify-between"><p className="flex-1 truncate text-sm text-gray-600">{chat.lastMessage}</p>{chat.unreadCount > 0 && <span className="ml-2 min-w-[20px] flex-shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-center text-xs font-semibold text-white">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span>}</div>
                {chat.isMuted && <div className="mt-1 flex items-center gap-1"><span className="text-xs text-gray-400">🔇 {chatCopy.mutedLabel}</span></div>}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={`${chatCopy.actionsFor} ${displayName}`} onClick={(event) => event.stopPropagation()} className="flex-shrink-0 rounded-full p-1 opacity-0 transition-colors hover:bg-gray-200 group-hover:opacity-100 focus:opacity-100"><MoreVertical className="h-4 w-4 text-gray-600" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[1000] w-56">
                  {callsEnabled && onCall && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onCall(chat.id); }}><Phone className="mr-2 h-4 w-4" />{t.voiceCall}</DropdownMenuItem>}
                  {callsEnabled && onVideoCall && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onVideoCall(chat.id); }}><Video className="mr-2 h-4 w-4" />{t.videoCall}</DropdownMenuItem>}
                  {callsEnabled && (onCall || onVideoCall) && <DropdownMenuSeparator />}
                  {markUnreadEnabled && onMarkAsUnread && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onMarkAsUnread(chat.id); }}><CheckCheck className="mr-2 h-4 w-4" />{t.markAsUnread}</DropdownMenuItem>}
                  {chat.isPinned && onUnpin ? <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onUnpin(chat.id); }}><PinOff className="mr-2 h-4 w-4" />{t.unpin}</DropdownMenuItem> : onPin && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onPin(chat.id); }}><Pin className="mr-2 h-4 w-4" />{t.pin}</DropdownMenuItem>}
                  {onArchive && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onArchive(chat.id); }}><Archive className="mr-2 h-4 w-4" />{t.archive}</DropdownMenuItem>}
                  {destructiveDeleteEnabled && onDelete && <><DropdownMenuSeparator /><DropdownMenuItem onClick={(event) => { event.stopPropagation(); onDelete(chat.id); }} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" />{t.delete}</DropdownMenuItem></>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
