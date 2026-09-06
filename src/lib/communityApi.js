import { apiRequest } from './one2oneApi';

export const communityApi = {
  async list(orderBy = '-created_at', category = null, searchQuery = null) {
    const params = new URLSearchParams();
    params.set('order', orderBy);
    if (category) params.set('category', category);
    if (searchQuery) params.set('search', searchQuery);
    const data = await apiRequest(`/api/communities?${params.toString()}`);
    return data?.communities || [];
  },
  async get(communityId) {
    const data = await apiRequest(`/api/communities/${communityId}`);
    return data?.community || null;
  },
  async create(payload) {
    const data = await apiRequest('/api/communities', { method: 'POST', body: payload });
    return data?.community || null;
  },
  async update(communityId, payload) {
    const data = await apiRequest(`/api/communities/${communityId}`, { method: 'PATCH', body: payload });
    return data?.community || null;
  },
  async remove(communityId) {
    return apiRequest(`/api/communities/${communityId}`, { method: 'DELETE' });
  },
  async join(communityId) {
    const data = await apiRequest(`/api/communities/${communityId}/membership`, { method: 'POST', body: {} });
    return data?.membership || null;
  },
  async leave(communityId) {
    return apiRequest(`/api/communities/${communityId}/membership`, { method: 'DELETE' });
  },
  async mine() {
    const data = await apiRequest('/api/communities/mine');
    return data?.communities || [];
  },
  async posts(communityId, orderBy = '-created_at', searchQuery = null) {
    const params = new URLSearchParams();
    params.set('order', orderBy);
    if (searchQuery) params.set('search', searchQuery);
    const data = await apiRequest(`/api/communities/${communityId}/posts?${params.toString()}`);
    return data?.posts || [];
  },
  async createPost(communityId, payload) {
    const data = await apiRequest(`/api/communities/${communityId}/posts`, { method: 'POST', body: payload });
    return data?.post || null;
  },
  async updatePost(postId, payload) {
    const data = await apiRequest(`/api/communities/posts/${postId}`, { method: 'PATCH', body: payload });
    return data?.post || null;
  },
  async removePost(postId) {
    return apiRequest(`/api/communities/posts/${postId}`, { method: 'DELETE' });
  },
  async likePost(postId, enabled = true) {
    return apiRequest(`/api/communities/posts/${postId}/like`, { method: enabled ? 'POST' : 'DELETE', body: enabled ? {} : undefined });
  },
  async sharePost(postId, sharedVia = 'internal', sharedToCommunityId = null) {
    const data = await apiRequest(`/api/communities/posts/${postId}/share`, { method: 'POST', body: { shared_via: sharedVia, shared_to_community_id: sharedToCommunityId } });
    return data?.share || null;
  },
  async comments(postId) {
    const data = await apiRequest(`/api/communities/posts/${postId}/comments`);
    return data?.comments || [];
  },
  async createComment(postId, payload, parentCommentId = null) {
    const data = await apiRequest(`/api/communities/posts/${postId}/comments`, { method: 'POST', body: { ...payload, parent_comment_id: parentCommentId } });
    return data?.comment || null;
  },
  async updateComment(commentId, payload) {
    const data = await apiRequest(`/api/communities/comments/${commentId}`, { method: 'PATCH', body: payload });
    return data?.comment || null;
  },
  async removeComment(commentId) {
    return apiRequest(`/api/communities/comments/${commentId}`, { method: 'DELETE' });
  },
  async likeComment(commentId, enabled = true) {
    return apiRequest(`/api/communities/comments/${commentId}/like`, { method: enabled ? 'POST' : 'DELETE', body: enabled ? {} : undefined });
  },
};

export default communityApi;
