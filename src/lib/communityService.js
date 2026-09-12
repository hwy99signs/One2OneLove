import { communityApi } from './communityApi';

export async function getCommunities(orderBy = '-created_at', category = null, searchQuery = null) {
  try { return await communityApi.list(orderBy, category, searchQuery); }
  catch (error) { console.error('Error fetching communities:', error); throw error; }
}

export async function getCommunityById(communityId) {
  try { return await communityApi.get(communityId); }
  catch (error) { console.error('Error fetching community:', error); throw error; }
}

export async function createCommunity(communityData) {
  try {
    return await communityApi.create({
      name: communityData?.name,
      description: communityData?.description || null,
      icon: communityData?.icon || '💬',
      category: communityData?.category || 'general',
      is_public: communityData?.is_public !== false,
      requires_approval: Boolean(communityData?.requires_approval),
      allow_member_posts: communityData?.allow_member_posts !== false,
    });
  } catch (error) { console.error('Error creating community:', error); throw error; }
}

export async function updateCommunity(communityId, updates) {
  try {
    const { creator_id: _creatorId, id: _id, created_at: _createdAt, member_count: _memberCount, post_count: _postCount, ...allowed } = updates || {};
    return await communityApi.update(communityId, allowed);
  } catch (error) { console.error('Error updating community:', error); throw error; }
}

export async function deleteCommunity(communityId) {
  try { await communityApi.remove(communityId); }
  catch (error) { console.error('Error deleting community:', error); throw error; }
}

export async function joinCommunity(communityId, _asAdmin = false) {
  try { return await communityApi.join(communityId); }
  catch (error) { console.error('Error joining community:', error); throw error; }
}

export async function leaveCommunity(communityId) {
  try { await communityApi.leave(communityId); }
  catch (error) { console.error('Error leaving community:', error); throw error; }
}

export async function getMyCommunities() {
  try { return await communityApi.mine(); }
  catch (error) { console.error('Error fetching my communities:', error); throw error; }
}

export async function getCommunityPosts(communityId, orderBy = '-created_at', searchQuery = null) {
  try { return await communityApi.posts(communityId, orderBy, searchQuery); }
  catch (error) { console.error('Error fetching posts:', error); throw error; }
}

export async function createPost(communityId, postData) {
  try {
    return await communityApi.createPost(communityId, {
      title: postData?.title,
      content: postData?.content,
      is_anonymous: Boolean(postData?.is_anonymous),
      tags: Array.isArray(postData?.tags) ? postData.tags : [],
    });
  } catch (error) { console.error('Error creating post:', error); throw error; }
}

export async function updatePost(postId, updates) {
  try {
    const { author_id: _authorId, id: _id, created_at: _createdAt, community_id: _communityId, moderation_status: _moderationStatus, likes_count: _likes, comments_count: _comments, shares_count: _shares, views_count: _views, is_pinned: _pinned, is_locked: _locked, author_name: _authorName, ...allowed } = updates || {};
    if (allowed.tags !== undefined) allowed.tags = Array.isArray(allowed.tags) ? allowed.tags : [];
    return await communityApi.updatePost(postId, allowed);
  } catch (error) { console.error('Error updating post:', error); throw error; }
}

export async function deletePost(postId) {
  try { await communityApi.removePost(postId); }
  catch (error) { console.error('Error deleting post:', error); throw error; }
}

export async function likePost(postId) {
  try { await communityApi.likePost(postId, true); }
  catch (error) { console.error('Error liking post:', error); throw error; }
}

export async function unlikePost(postId) {
  try { await communityApi.likePost(postId, false); }
  catch (error) { console.error('Error unliking post:', error); throw error; }
}

export async function togglePostLike(postId, isLiked) {
  if (isLiked) { await unlikePost(postId); return false; }
  await likePost(postId); return true;
}

export async function sharePost(postId, sharedVia = 'internal', sharedToCommunityId = null) {
  try { return await communityApi.sharePost(postId, sharedVia, sharedToCommunityId); }
  catch (error) { console.error('Error sharing post:', error); throw error; }
}

export async function getPostComments(postId) {
  try { return await communityApi.comments(postId); }
  catch (error) { console.error('Error fetching comments:', error); throw error; }
}

export async function createComment(postId, commentData, parentCommentId = null) {
  try {
    return await communityApi.createComment(postId, {
      content: commentData?.content,
      is_anonymous: Boolean(commentData?.is_anonymous),
    }, parentCommentId);
  } catch (error) { console.error('Error creating comment:', error); throw error; }
}

export async function updateComment(commentId, updates) {
  try {
    const { author_id: _authorId, id: _id, created_at: _createdAt, post_id: _postId, parent_comment_id: _parentId, moderation_status: _status, likes_count: _likes, author_name: _authorName, ...allowed } = updates || {};
    return await communityApi.updateComment(commentId, allowed);
  } catch (error) { console.error('Error updating comment:', error); throw error; }
}

export async function deleteComment(commentId) {
  try { await communityApi.removeComment(commentId); }
  catch (error) { console.error('Error deleting comment:', error); throw error; }
}

export async function likeComment(commentId) {
  try { await communityApi.likeComment(commentId, true); }
  catch (error) { console.error('Error liking comment:', error); throw error; }
}

export async function unlikeComment(commentId) {
  try { await communityApi.likeComment(commentId, false); }
  catch (error) { console.error('Error unliking comment:', error); throw error; }
}

export async function toggleCommentLike(commentId, isLiked) {
  if (isLiked) { await unlikeComment(commentId); return false; }
  await likeComment(commentId); return true;
}
