import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserX, ArrowLeft, Users, Mail, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  getReceivedBuddyRequests,
  getSentBuddyRequests,
  acceptBuddyRequest,
  rejectBuddyRequest,
  cancelBuddyRequest,
} from '@/lib/buddyService';

export default function FriendRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  // Fetch requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching friend requests for user:', user.id);
        const [received, sent] = await Promise.all([
          getReceivedBuddyRequests(user.id),
          getSentBuddyRequests(user.id),
        ]);
        
        console.log('Received requests:', received);
        console.log('Sent requests:', sent);
        
        setReceivedRequests(received);
        setSentRequests(sent);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast.error(error.message || 'Failed to load friend requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?.id]);

  const handleAccept = async (requestId) => {
    try {
      await acceptBuddyRequest(requestId, user.id);
      setReceivedRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success('Friend request accepted! 🎉');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectBuddyRequest(requestId, user.id);
      setReceivedRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success('Friend request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const handleCancelSent = async (requestId) => {
    try {
      await cancelBuddyRequest(requestId, user.id);
      setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success('Friend request cancelled');
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error.message || 'Failed to cancel request');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Community'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Friend Requests</h1>
          </div>
          <p className="text-gray-600 mt-2">Manage your friend connections</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Received ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Received Requests Tab */}
          <TabsContent value="received">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading requests...</p>
              </div>
            ) : receivedRequests.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No friend requests yet</p>
                  <p className="text-gray-400 mt-2">When someone sends you a friend request, it will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={request.from_user?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                            {request.from_user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.from_user?.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600">{request.from_user?.email}</p>
                          {request.from_user?.bio && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {request.from_user.bio}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(request.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleAccept(request.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading requests...</p>
              </div>
            ) : sentRequests.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No pending sent requests</p>
                  <p className="text-gray-400 mt-2">Visit Find Buddies to send friend requests</p>
                  <Button
                    onClick={() => navigate(createPageUrl('FindFriends'))}
                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Find Friends
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={request.to_user?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                            {request.to_user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.to_user?.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600">{request.to_user?.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Sent {formatDate(request.created_at)}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              Pending
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => handleCancelSent(request.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

