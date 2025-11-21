import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck, Clock, Play, Pause, Download, MapPin, FileText, Image as ImageIcon, Reply, Copy, Save, Forward, Star, Pin, Trash2, CheckSquare, Share2, Info, MoreVertical, Plus, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const MessageStatus = ({ status, isRead }) => {
  if (status === 'sending') {
    return <Clock className="w-4 h-4 text-gray-400" />;
  }
  if (status === 'sent') {
    return <Check className="w-4 h-4 text-gray-400" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-4 h-4 text-gray-400" />;
  }
  if (status === 'read' && isRead) {
    return <CheckCheck className="w-4 h-4 text-blue-500" />;
  }
  return <CheckCheck className="w-4 h-4 text-gray-400" />;
};

const VoiceNotePlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const audioRef = React.useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/80 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <audio ref={audioRef} src={audioUrl} />
    </div>
  );
};

const ImageMessage = ({ imageUrl, caption }) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="rounded-lg overflow-hidden">
      {imageError ? (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={caption || 'Image'}
          className="max-w-full h-auto rounded-lg"
          onError={() => setImageError(true)}
        />
      )}
      {caption && (
        <p className="mt-2 text-sm">{caption}</p>
      )}
    </div>
  );
};

const DocumentMessage = ({ fileUrl, fileName, fileSize, fileType }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
      <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
        <FileText className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{fileName}</p>
        <p className="text-xs text-white/70">{formatFileSize(fileSize)} • {fileType}</p>
      </div>
      <a
        href={fileUrl}
        download
        className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
      >
        <Download className="w-5 h-5 text-white" />
      </a>
    </div>
  );
};

const LocationMessage = ({ latitude, longitude, address }) => {
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="rounded-lg overflow-hidden border border-white/20">
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center relative">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${longitude},${latitude})/${longitude},${latitude},15,0/400x200?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
            alt="Location"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
            <MapPin className="w-8 h-8 text-white" />
          </div>
        </div>
        {address && (
          <div className="p-3 bg-white/10">
            <p className="text-sm text-white">{address}</p>
          </div>
        )}
      </a>
    </div>
  );
};

const REACTIONS = ['👍', '❤️', '😂', '😮', '😥', '🙏'];

export default function ChatMessage({ 
  message, 
  isOwn, 
  showAvatar = true, 
  showTime = true,
  onReply,
  onForward,
  onStar,
  onPin,
  onDelete,
  onSelect,
  onShare,
  onReact,
  onCopy,
  onEdit
}) {
  const [reactions, setReactions] = useState(message.reactions || []);
  const [isStarred, setIsStarred] = useState(message.isStarred || false);
  const [isPinned, setIsPinned] = useState(message.isPinned || false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, HH:mm');
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success('Message copied to clipboard');
      onCopy?.(message);
    } else {
      toast.info('Nothing to copy');
    }
  };

  const handleSave = () => {
    if (message.type === 'image' && message.imageUrl) {
      const link = document.createElement('a');
      link.href = message.imageUrl;
      link.download = `image-${message.id}.jpg`;
      link.click();
      toast.success('Image saved');
    } else if (message.type === 'document' && message.fileUrl) {
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName || 'document';
      link.click();
      toast.success('File saved');
    } else {
      toast.info('This message cannot be saved');
    }
  };

  const handleReact = (emoji) => {
    const newReactions = reactions.includes(emoji)
      ? reactions.filter(r => r !== emoji)
      : [...reactions, emoji];
    setReactions(newReactions);
    onReact?.(message, emoji);
    setShowReactions(false);
  };

  const handleStar = () => {
    setIsStarred(!isStarred);
    onStar?.(message, !isStarred);
    toast.success(isStarred ? 'Removed from starred' : 'Starred');
  };

  const handlePin = () => {
    setIsPinned(!isPinned);
    onPin?.(message, !isPinned);
    toast.success(isPinned ? 'Unpinned' : 'Pinned');
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete?.(message);
      toast.success('Message deleted');
    }
  };

  const handleForward = () => {
    onForward?.(message);
    toast.info('Select a chat to forward to');
  };

  const handleReply = () => {
    onReply?.(message);
  };

  const handleSelect = () => {
    onSelect?.(message);
  };

  const handleShare = () => {
    if (navigator.share) {
      const shareData = {
        title: 'Message from chat',
        text: message.text || 'Check this out',
        url: message.imageUrl || message.fileUrl || window.location.href,
      };
      navigator.share(shareData).catch(() => {
        toast.error('Failed to share');
      });
    } else {
      onShare?.(message);
    }
  };

  const handleEdit = () => {
    if (message.type === 'text' && isOwn) {
      setIsEditing(true);
      setEditText(message.text || '');
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit?.(message, editText.trim());
      toast.success('Message edited');
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text || '');
  };

  return (
    <div className={cn("flex gap-2 px-4 py-1 group hover:bg-gray-50/50 transition-colors relative", isOwn && "flex-row-reverse")}>
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback>{message.senderName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col max-w-[70%] relative", isOwn && "items-end")}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-gray-500 mb-1 px-1">{message.senderName}</span>
        )}
        
        <div
          className={cn(
            "rounded-lg px-3 py-2 shadow-sm relative",
            isOwn
              ? "bg-[#DCF8C6] text-gray-900"
              : "bg-white text-gray-900 border border-gray-200"
          )}
        >
          {/* Message Actions - Visible on hover */}
          <div className={cn(
            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10",
            isOwn ? "-left-12" : "-right-12"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-48 bg-gray-900 text-white border-gray-700">
                <DropdownMenuItem onClick={handleReply} className="hover:bg-gray-800">
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                {isOwn && message.type === 'text' && (
                  <DropdownMenuItem onClick={handleEdit} className="hover:bg-gray-800">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopy} className="hover:bg-gray-800">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {(message.type === 'image' || message.type === 'document') && (
                  <DropdownMenuItem onClick={handleSave} className="hover:bg-gray-800">
                    <Save className="w-4 h-4 mr-2" />
                    Save as...
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleForward} className="hover:bg-gray-800">
                  <Forward className="w-4 h-4 mr-2" />
                  Forward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStar} className="hover:bg-gray-800">
                  <Star className={cn("w-4 h-4 mr-2", isStarred && "fill-yellow-400 text-yellow-400")} />
                  {isStarred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePin} className="hover:bg-gray-800">
                  <Pin className={cn("w-4 h-4 mr-2", isPinned && "fill-blue-400 text-blue-400")} />
                  {isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={handleDelete} className="hover:bg-gray-800 text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSelect} className="hover:bg-gray-800">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Select
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} className="hover:bg-gray-800">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">
                  <Info className="w-4 h-4 mr-2" />
                  Info
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-1 mt-1 mb-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => handleReact(reaction)}
                  className="text-lg hover:scale-110 transition-transform"
                  title="Click to remove"
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}
          {/* Text Message */}
          {message.type === 'text' && (
            <>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    rows={Math.min(editText.split('\n').length, 5)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  {message.isEdited && (
                    <span className="text-xs text-gray-500 italic">(edited)</span>
                  )}
                </>
              )}
            </>
          )}

          {/* Voice Note */}
          {message.type === 'voice' && message.audioUrl && (
            <VoiceNotePlayer
              audioUrl={message.audioUrl}
              duration={message.duration || 0}
            />
          )}

          {/* Image */}
          {message.type === 'image' && message.imageUrl && (
            <ImageMessage
              imageUrl={message.imageUrl}
              caption={message.caption}
            />
          )}

          {/* Document */}
          {message.type === 'document' && message.fileUrl && (
            <DocumentMessage
              fileUrl={message.fileUrl}
              fileName={message.fileName}
              fileSize={message.fileSize}
              fileType={message.fileType}
            />
          )}

          {/* Location */}
          {message.type === 'location' && message.latitude && message.longitude && (
            <LocationMessage
              latitude={message.latitude}
              longitude={message.longitude}
              address={message.address}
            />
          )}
        </div>

        {/* Message Time and Status */}
        <div className={cn("flex items-center gap-1 mt-0.5 px-1", isOwn && "flex-row-reverse")}>
          {showTime && message.timestamp && (
            <span className="text-xs text-gray-500">{formatMessageTime(message.timestamp)}</span>
          )}
          {isOwn && (
            <MessageStatus status={message.status || 'sent'} isRead={message.isRead} />
          )}
        </div>

        {/* Quick Reactions - Visible on hover */}
        <div className={cn(
          "absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
          isOwn ? "right-0" : "left-0"
        )}>
          <div className="flex items-center gap-1 bg-gray-900 rounded-full px-2 py-1 shadow-lg">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-lg hover:scale-125 transition-transform px-1"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-white hover:bg-gray-700 rounded-full p-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

