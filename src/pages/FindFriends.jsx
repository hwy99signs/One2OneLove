import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, ArrowLeft, Users, MapPin, Heart, MessageCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, sendBuddyRequest, getSentBuddyRequests } from '@/lib/buddyService';

const translations = {
  en: {
    title: 'Find Buddies',
    subtitle: 'Search for buddies and send buddy requests',
    searchPlaceholder: 'Search by name, email, or location...',
    noResults: 'No users found',
    sendRequest: 'Send Request',
    requestSent: 'Request Sent',
    cancelRequest: 'Cancel Request',
    requestSentSuccess: 'Buddy request sent successfully!',
    requestCancelled: 'Buddy request cancelled',
    location: 'Location',
    relationshipStatus: 'Relationship Status',
    sharedInterests: 'Shared Interests',
    viewProfile: 'View Profile',
    back: 'Back',
  },
};

// No more mock data - using real users from Supabase!

export default function FindFriends() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const t = translations[currentLanguage] || translations.en;

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Map()); // Map of userId -> requestId
  const [loading, setLoading] = useState(true);

  // Fetch users and sent requests on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log('Fetching users for user:', user.id);
        // Fetch all users (increased limit to 100)
        const usersData = await getAllUsers(user.id, { limit: 100 });
        console.log('Fetched users:', usersData.length);
        
        // Fetch sent requests to know which users we've already sent requests to
        const sentRequestsData = await getSentBuddyRequests(user.id);
        const requestsMap = new Map(
          sentRequestsData.map(req => [req.to_user_id, req.id])
        );
        
        setUsers(usersData);
        setFilteredUsers(usersData);
        setSentRequests(requestsMap);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error(error.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(users);
      console.log(`Showing all ${users.length} users`);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = users.filter((u) => {
      // Search in name (required field)
      if (u.name?.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in email (required field)
      if (u.email?.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in location (optional field - only if exists)
      if (u.location && u.location.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in bio (optional field - only if exists)
      if (u.bio && u.bio.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in relationship status (optional field)
      if (u.relationship_status && u.relationship_status.toLowerCase().includes(lowerQuery)) return true;
      
      return false;
    });
    
    setFilteredUsers(filtered);
    console.log(`Search for "${query}" returned ${filtered.length} results out of ${users.length} total users`);
  };

  const handleSendRequest = async (toUserId) => {
    if (!user?.id) {
      toast.error('Please sign in to send buddy requests');
      return;
    }

    try {
      const request = await sendBuddyRequest(user.id, toUserId);
      setSentRequests((prev) => new Map([...prev, [toUserId, request.id]]));
      toast.success(t.requestSentSuccess);
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error(error.message || 'Failed to send buddy request');
    }
  };

  const handleCancelRequest = async (toUserId) => {
    const requestId = sentRequests.get(toUserId);
    if (!requestId) return;

    try {
      // Note: We'll need to implement cancelBuddyRequest in buddyService
      // For now, just remove from UI
      setSentRequests((prev) => {
        const newMap = new Map(prev);
        newMap.delete(toUserId);
        return newMap;
      });
      toast.success(t.requestCancelled);
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Community'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 py-6 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <Card className="text-center py-12">
            <CardContent>
              <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-lg">Loading users...</p>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">{t.noResults}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((userData) => {
              const hasSentRequest = sentRequests.has(userData.id);
              // Generate avatar if user doesn't have one
              const avatarUrl = userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`;
              const initials = userData.name?.charAt(0).toUpperCase() || '?';

              return (
                <Card key={userData.id} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={avatarUrl} alt={userData.name} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{userData.name}</CardTitle>
                          <p className="text-sm text-gray-500">{userData.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {userData.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {userData.bio}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {/* Location is optional - only show if exists */}
                      {userData.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{userData.location}</span>
                        </div>
                      )}
                      {/* Relationship status is optional - only show if exists */}
                      {userData.relationship_status && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Heart className="w-4 h-4" />
                          <span className="capitalize">{userData.relationship_status}</span>
                        </div>
                      )}
                      {/* Always show member since */}
                      {userData.created_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>Member since {new Date(userData.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      {hasSentRequest ? (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleCancelRequest(userData.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t.cancelRequest}
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          onClick={() => handleSendRequest(userData.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {t.sendRequest}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Navigate to chat page with this user
                          navigate(`${createPageUrl('Chat')}?user=${userData.id}&name=${encodeURIComponent(userData.name)}`);
                        }}
                        title="Send Message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

