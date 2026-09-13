import { apiRequest } from './apiClient';

export async function getCommunities(orderBy = '-created_at', category = null, searchQuery = null) {
  const params = new URLSearchParams({ order: orderBy });
  if (category) params.set('category', category);
  if (searchQuery) params.set('search', searchQuery);
  const payload = await apiRequest(`/api/communities?${params}`);
  return payload?.communities || [];
}

export async function getCommunityById(communityId) {
  const payload = await apiRequest(`/api/communities/${encodeURIComponent(communityId)}`);
  return payload?.community || null;
}

export async function createCommunity(communityData) {
  const payload = await apiRequest('/api/communities', { method: 'POST', body: communityData });
  return payload?.community || null;
}

export async function updateCommunity(communityId, updates) {
  const { id, creator_id, created_at, updated_at, member_count, post_count, ...allowed } = updates || {};
  const payload = await apiRequest(`/api/communities/${encodeURIComponent(communityId)}`, { method: 'PATCH', body: allowed });
  return payload?.community || null;
}

export async function deleteCommunity(communityId) {
  await apiRequest(`/api/communities/${encodeURIComponent(communityId)}`, { method: 'DELETE' });
}

export async function joinCommunity(communityId) {
  const payload = await apiRequest(`/api/communities/${encodeURIComponent(communityId)}/membership`, { method: 'POST', body: {} });
  return payload?.membership || null;
}

export async function leaveCommunity(communityId) {
  await apiRequest(`/api/communities/${encodeURIComponent(communityId)}/membership`, { method: 'DELETE' });
}

export async function getMyCommunities() {
  const payload = await apiRequest('/api/communities/mine');
  return payload?.communities || [];
}

export async function getCommunityPosts(communityId, orderBy = '-created_at', searchQuery = null) {
  const params = new URLSearchParams({ order: orderBy });
  if (searchQuery) params.set('search', searchQuery);
  const payload = await apiRequest(`/api/communities/${encodeURIComponent(communityId)}/posts?${params}`);
  return payload?.posts || [];
}

export async function createPost(communityId, postData) {
  const payload = await apiRequest(`/api/communities/${encodeURIComponent(communityId)}/posts`, { method: 'POST', body: postData });
  return payload?.post || null;
}

export async function updatePost(postId, updates) {
  const { id, author_id, created_at, updated_at, community_id, moderation_status, ...allowed } = updates || {};
  const payload = await apiRequest(`/api/communities/posts/${encodeURIComponent(postId)}`, { method: 'PATCH', body: allowed });
  return payload?.post || null;
}

export async function deletePost(postId) {
  await apiRequest(`/api/communities/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
}

export async function likePost(postId) {
  await apiRequest(`/api/communities/posts/${encodeURIComponent(postId)}/like`, { method: 'POST', body: {} });
}

export async function unlikePost(postId) {
  await apiRequest(`/api/communities/posts/${encodeURIComponent(postId)}/like`, { method: 'DELETE' });
}

export async function togglePostLike(postId, isLiked) {
  if (isLiked) { await unlikePost(postId); return false; }
  await likePost(postId); return true;
}

export async function sharePost(postId, sharedVia = 'internal', sharedToCommunityId = null) {
  const payload = await apiRequest(`/api/communities/posts/${encodeURIComponent(postId)}/share`, {
    method: 'POST',
    body: { shared_via: sharedVia, shared_to_community_id: sharedToCommunityId },
  });
  return payload?.share || null;
}

export async function getPostComments(postId) {
  const payload = await apiRequest(`/api/communities/posts/${encodeURIComponent(postId)}/comments`);
  return payload?.comments || [];
}

export async function createComment(postId, commentData, parentCommentId = null) {
  const payload = await apiRequest(`/api/communities/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: { ...commentData, parent_comment_id: parentCommentId },
  });
  return payload?.comment || null;
}

export async function updateComment(commentId, updates) {
  const { id, author_id, created_at, updated_at, post_id, ...allowed } = updates || {};
  const payload = await apiRequest(`/api/communities/comments/${encodeURIComponent(commentId)}`, { method: 'PATCH', body: allowed });
  return payload?.comment || null;
}

export async function deleteComment(commentId) {
  await apiRequest(`/api/communities/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
}

export async function likeComment(commentId) {
  await apiRequest(`/api/communities/comments/${encodeURIComponent(commentId)}/like`, { method: 'POST', body: {} });
}

export async function unlikeComment(commentId) {
  await apiRequest(`/api/communities/comments/${encodeURIComponent(commentId)}/like`, { method: 'DELETE' });
}

export async function toggleCommentLike(commentId, isLiked) {
  if (isLiked) { await unlikeComment(commentId); return false; }
  await likeComment(commentId); return true;
}
