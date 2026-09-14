import React, { useState, useMemo } from 'react';
import { X, Phone, Video, MessageCircle, MapPin, Calendar, Heart, Image as ImageIcon, FileText, Mic, MapPin as LocationIcon, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UserProfile({
  user,
  messages = [],
  isOpen,
  onClose,
  onCall,
  onVideoCall,
  onMessage,
}) {
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Extract shared media from messages
  const sharedMedia = useMemo(() => {
    const media = {
      images: [],
      documents: [],
      voiceNotes: [],
      locations: [],
    };

    messages.forEach((msg) => {
      if (msg.type === 'image' && msg.imageUrl) {
        media.images.push({
          id: msg.id,
          url: msg.imageUrl,
          caption: msg.caption || '',
          timestamp: msg.timestamp,
        });
      } else if (msg.type === 'document' && msg.fileUrl) {
        media.documents.push({
          id: msg.id,
          url: msg.fileUrl,
          name: msg.fileName || 'Document',
          size: msg.fileSize || 0,
          type: msg.fileType || 'application/octet-stream',
          timestamp: msg.timestamp,
        });
      } else if (msg.type === 'voice' && msg.audioUrl) {
        media.voiceNotes.push({
          id: msg.id,
          url: msg.audioUrl,
          duration: msg.duration || 0,
          timestamp: msg.timestamp,
        });
      } else if (msg.type === 'location') {
        media.locations.push({
          id: msg.id,
          latitude: msg.latitude,
          longitude: msg.longitude,
          address: msg.address || '',
          timestamp: msg.timestamp,
        });
      }
    });

    return media;
  }, [messages]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Profile</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-3xl">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.name}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                  {user.isOnline ? (
                    <span className="flex items-center gap-2 text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Online
                    </span>
                  ) : user.lastSeen ? (
                    <span className="text-gray-500 text-sm">
                      Last seen {new Date(user.lastSeen).toLocaleTimeString()}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">Offline</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onCall?.(user.id);
                      onClose();
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onVideoCall?.(user.id);
                      onClose();
                    }}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMessage?.(user.id);
                      onClose();
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="media">
                  Media ({sharedMedia.images.length + sharedMedia.documents.length + sharedMedia.voiceNotes.length})
                </TabsTrigger>
                <TabsTrigger value="locations">
                  Locations ({sharedMedia.locations.length})
                </TabsTrigger>
                <TabsTrigger value="documents">
                  Documents ({sharedMedia.documents.length})
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                {/* About Section */}
                {user.about && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-700 leading-relaxed">{user.about}</p>
                  </div>
                )}

                {/* Public Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
                  
                  {user.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {user.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900 font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-gray-900 font-medium">{user.location}</p>
                      </div>
                    </div>
                  )}

                  {user.relationshipStatus && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Relationship Status</p>
                        <p className="text-gray-900 font-medium capitalize">
                          {user.relationshipStatus.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {user.anniversaryDate && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Anniversary</p>
                        <p className="text-gray-900 font-medium">
                          {formatDate(user.anniversaryDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {user.loveLanguage && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Love Language</p>
                        <p className="text-gray-900 font-medium capitalize">
                          {user.loveLanguage.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {user.partnerName && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Partner</p>
                        <p className="text-gray-900 font-medium">{user.partnerName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                    <p className="text-sm text-gray-500">Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{sharedMedia.images.length}</p>
                    <p className="text-sm text-gray-500">Photos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{sharedMedia.documents.length}</p>
                    <p className="text-sm text-gray-500">Files</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{sharedMedia.voiceNotes.length}</p>
                    <p className="text-sm text-gray-500">Voice Notes</p>
                  </div>
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="mt-6">
                <div className="space-y-6">
                  {/* Images */}
                  {sharedMedia.images.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Photos ({sharedMedia.images.length})
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {sharedMedia.images.map((image) => (
                          <div
                            key={image.id}
                            className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-100"
                            onClick={() => setSelectedMedia(image)}
                          >
                            <img
                              src={image.url}
                              alt={image.caption || 'Shared photo'}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="hidden absolute inset-0 items-center justify-center bg-gray-200">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voice Notes */}
                  {sharedMedia.voiceNotes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Voice Notes ({sharedMedia.voiceNotes.length})
                      </h3>
                      <div className="space-y-2">
                        {sharedMedia.voiceNotes.map((note) => (
                          <div
                            key={note.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Mic className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">
                                {formatDate(note.timestamp)}
                              </p>
                              <p className="text-gray-900">
                                {Math.floor(note.duration)}s voice note
                              </p>
                            </div>
                            <audio controls className="h-8">
                              <source src={note.url} type="audio/webm" />
                              <source src={note.url} type="audio/mpeg" />
                            </audio>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sharedMedia.images.length === 0 && sharedMedia.voiceNotes.length === 0 && (
                    <div className="text-center py-12">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No shared media yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Locations Tab */}
              <TabsContent value="locations" className="mt-6">
                {sharedMedia.locations.length > 0 ? (
                  <div className="space-y-4">
                    {sharedMedia.locations.map((location) => (
                      <div
                        key={location.id}
                        className="border rounded-lg overflow-hidden bg-gray-50"
                      >
                        <div className="aspect-video bg-gray-200 relative">
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                            <LocationIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-500 mb-1">
                            {formatDate(location.timestamp)}
                          </p>
                          <p className="text-gray-900 font-medium mb-2">
                            {location.address || `${location.latitude}, ${location.longitude}`}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <MapPin className="w-4 h-4" />
                            Open in Maps
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LocationIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No shared locations yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-6">
                {sharedMedia.documents.length > 0 ? (
                  <div className="space-y-2">
                    {sharedMedia.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.size)} • {formatDate(doc.timestamp)}
                          </p>
                        </div>
                        <a
                          href={doc.url}
                          download={doc.name}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Download className="w-5 h-5 text-gray-600" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No shared documents yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>

      {/* Image Modal */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl p-0">
            <div className="relative">
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption || 'Shared photo'}
                className="w-full max-h-[80vh] object-contain"
              />
              {selectedMedia.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  <p>{selectedMedia.caption}</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

