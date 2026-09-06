import { storyApi } from './storyApi';

/**
 * Success Stories Service
 * Public/user story operations now flow through the Cloudflare Worker.
 * Moderation operations are enforced server-side against the Neon Auth admin role.
 */

export async function getStories(orderBy = '-created_at', storyType = null, searchQuery = null) {
  try { return await storyApi.list(orderBy, storyType, searchQuery); }
  catch (error) { console.error('Error fetching stories:', error); throw error; }
}

export async function getStoryById(storyId) {
  try { return await storyApi.get(storyId); }
  catch (error) { console.error('Error fetching story:', error); throw error; }
}

export async function getMyStories() {
  try { return await storyApi.mine(); }
  catch (error) { console.error('Error fetching my stories:', error); throw error; }
}

export async function createStory(storyData) {
  try {
    return await storyApi.create({
      title: storyData?.title,
      content: storyData?.content,
      story_type: storyData?.story_type || 'success',
      is_anonymous: Boolean(storyData?.is_anonymous),
      relationship_length: storyData?.relationship_length || null,
      tags: Array.isArray(storyData?.tags) ? storyData.tags : [],
    });
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
}

export async function updateStory(storyId, updates) {
  try {
    const { id: _id, user_id: _userId, created_at: _createdAt, updated_at: _updatedAt, moderation_status: _moderationStatus, moderated_by: _moderatedBy, moderated_at: _moderatedAt, likes_count: _likes, helpful_count: _helpful, views_count: _views, is_featured: _featured, author_name: _authorName, ...allowed } = updates || {};
    if (allowed.tags !== undefined) allowed.tags = Array.isArray(allowed.tags) ? allowed.tags : [];
    return await storyApi.update(storyId, allowed);
  } catch (error) {
    console.error('Error updating story:', error);
    throw error;
  }
}

export async function deleteStory(storyId) {
  try { await storyApi.remove(storyId); }
  catch (error) { console.error('Error deleting story:', error); throw error; }
}

export async function likeStory(storyId) {
  try { await storyApi.like(storyId, true); }
  catch (error) { console.error('Error liking story:', error); throw error; }
}

export async function unlikeStory(storyId) {
  try { await storyApi.like(storyId, false); }
  catch (error) { console.error('Error unliking story:', error); throw error; }
}

export async function toggleLikeStory(storyId, isLiked) {
  if (isLiked) {
    await unlikeStory(storyId);
    return false;
  }
  await likeStory(storyId);
  return true;
}

export async function markStoryHelpful(storyId) {
  try { await storyApi.helpful(storyId, true); }
  catch (error) { console.error('Error marking story helpful:', error); throw error; }
}

export async function unmarkStoryHelpful(storyId) {
  try { await storyApi.helpful(storyId, false); }
  catch (error) { console.error('Error unmarking story helpful:', error); throw error; }
}

export async function toggleHelpfulStory(storyId, isHelpful) {
  if (isHelpful) {
    await unmarkStoryHelpful(storyId);
    return false;
  }
  await markStoryHelpful(storyId);
  return true;
}

export async function approveStory(storyId) {
  try { return await storyApi.approve(storyId); }
  catch (error) { console.error('Error approving story:', error); throw error; }
}

export async function rejectStory(storyId, notes = '') {
  try { return await storyApi.reject(storyId, notes); }
  catch (error) { console.error('Error rejecting story:', error); throw error; }
}

export async function featureStory(storyId, featured = true) {
  try { return await storyApi.feature(storyId, featured); }
  catch (error) { console.error('Error featuring story:', error); throw error; }
}

export async function getStoryStats() {
  try { return await storyApi.stats(); }
  catch (error) { console.error('Error fetching story stats:', error); throw error; }
}
