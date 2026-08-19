import * as communityService from './communityService';

function normalizeList(result, keys = []) {
  if (Array.isArray(result)) return result;
  for (const key of keys) {
    if (Array.isArray(result?.[key])) return result[key];
  }
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

async function callFirst(names, args = []) {
  for (const name of names) {
    const fn = communityService[name];
    if (typeof fn === 'function') return fn(...args);
  }
  return null;
}

export async function loadCommunityForums() {
  const result = await callFirst([
    'getForums',
    'listForums',
    'getDiscussionForums',
    'fetchForums',
  ]);
  return normalizeList(result, ['forums', 'items']);
}

export async function loadCommunityForumPosts(forumId) {
  if (!forumId) return [];
  const result = await callFirst([
    'getForumPosts',
    'listForumPosts',
    'getPostsByForum',
    'fetchForumPosts',
  ], [forumId]);
  return normalizeList(result, ['posts', 'items']);
}

export async function submitCommunityForumPost(payload) {
  const result = await callFirst([
    'createForumPost',
    'submitForumPost',
    'createPost',
  ], [payload]);

  if (result == null) {
    return { success: false, error: 'Forum posting service is not available.' };
  }
  if (result?.success === false) return result;
  return { success: true, post: result?.post || result?.data || result };
}
