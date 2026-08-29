import { supabase } from './supabase';

const STORY_FIELDS = 'id,title,content,story_type,author_name,is_anonymous,relationship_length,tags,likes_count,helpful_count,is_featured,created_at';

const getOptionalUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

export async function getStories(orderBy = '-created_at', storyType = null, searchQuery = null) {
  const isDescending = String(orderBy).startsWith('-');
  const requestedField = isDescending ? String(orderBy).slice(1) : String(orderBy);
  const allowedOrderFields = new Set(['created_at', 'likes_count', 'helpful_count']);
  const orderField = allowedOrderFields.has(requestedField) ? requestedField : 'created_at';

  let query = supabase
    .from('success_stories')
    .select(STORY_FIELDS)
    .eq('moderation_status', 'approved')
    .order(orderField, { ascending: !isDescending });

  if (storyType) query = query.eq('story_type', storyType);

  const safeSearch = String(searchQuery || '').trim().replace(/[,%()]/g, ' ').slice(0, 80);
  if (safeSearch) query = query.or(`title.ilike.%${safeSearch}%,content.ilike.%${safeSearch}%`);

  const { data: stories = [], error } = await query;
  if (error) throw error;

  const user = await getOptionalUser();
  if (!user || stories.length === 0) {
    return stories.map((story) => ({ ...story, userHasLiked: false, userMarkedHelpful: false }));
  }

  const storyIds = stories.map((story) => story.id);
  const [{ data: likes = [] }, { data: helpful = [] }] = await Promise.all([
    supabase.from('story_likes').select('story_id').eq('user_id', user.id).in('story_id', storyIds),
    supabase.from('story_helpful').select('story_id').eq('user_id', user.id).in('story_id', storyIds),
  ]);

  const likedIds = new Set(likes.map((item) => item.story_id));
  const helpfulIds = new Set(helpful.map((item) => item.story_id));
  return stories.map((story) => ({
    ...story,
    userHasLiked: likedIds.has(story.id),
    userMarkedHelpful: helpfulIds.has(story.id),
  }));
}

export async function createStory(storyData) {
  const { data, error } = await supabase.rpc('submit_community_story', {
    p_title: String(storyData.title || '').trim(),
    p_content: String(storyData.content || '').trim(),
    p_story_type: storyData.story_type || 'success',
    p_is_anonymous: storyData.is_anonymous !== false,
    p_relationship_length: String(storyData.relationship_length || '').trim() || null,
    p_tags: Array.isArray(storyData.tags) ? storyData.tags.slice(0, 10) : [],
  });
  if (error) throw error;
  return data;
}

async function toggleStoryInteraction(table, storyId, currentlySet) {
  const user = await getOptionalUser();
  if (!user) throw new Error('Authentication required');

  if (currentlySet) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', user.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from(table).insert({ story_id: storyId, user_id: user.id });
  if (error && error.code !== '23505') throw error;
  return true;
}

export const toggleLikeStory = (storyId, isLiked) => toggleStoryInteraction('story_likes', storyId, isLiked);
export const toggleHelpfulStory = (storyId, isHelpful) => toggleStoryInteraction('story_helpful', storyId, isHelpful);
