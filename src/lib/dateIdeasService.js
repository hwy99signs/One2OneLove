import { supabase } from './supabase';

// Private Date Idea persistence is intentionally OFF until the ownership/RLS migration
// has been approved, applied and tested. The public built-in catalog never depends on it.
const DATE_IDEA_PERSISTENCE_ENABLED = import.meta.env.VITE_DATE_IDEA_PERSISTENCE_ENABLED === 'true';
export const dateIdeaPersistenceEnabled = () => DATE_IDEA_PERSISTENCE_ENABLED;

const DATE_IDEA_COLUMNS = [
  'id',
  'user_id',
  'title',
  'description',
  'category',
  'budget',
  'location_type',
  'occasion',
  'relationship_stage',
  'is_favorite',
  'is_completed',
  'created_at',
  'updated_at',
].join(',');

const SAFE_FIELDS = new Set([
  'title',
  'description',
  'category',
  'budget',
  'location_type',
  'occasion',
  'relationship_stage',
  'is_favorite',
  'is_completed',
]);

const ENUMS = {
  category: new Set(['romantic', 'adventure', 'relaxing', 'indoor', 'outdoor', 'creative']),
  budget: new Set(['free', 'low', 'medium', 'high']),
  location_type: new Set(['home', 'outdoor', 'restaurant', 'activity_center', 'cultural', 'nature', 'urban']),
  occasion: new Set(['regular', 'anniversary', 'birthday', 'valentines', 'special', 'apology', 'celebration']),
  relationship_stage: new Set(['new', 'dating', 'committed', 'married', 'long_term', 'any']),
};

const requirePersistenceEnabled = () => {
  if (!DATE_IDEA_PERSISTENCE_ENABLED) {
    throw new Error('Private Date Idea saving is staged and not active yet. The built-in catalog remains available.');
  }
};

const requireAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Sign in to save your Date Ideas.');
  if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
    throw new Error('Confirm your email before saving Date Ideas.');
  }
  return data.user;
};

const cleanText = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

const sanitize = (input = {}, { requireTitle = false } = {}) => {
  const output = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (!SAFE_FIELDS.has(key)) continue;
    if (key === 'title') output.title = cleanText(value, 120);
    else if (key === 'description') output.description = cleanText(value, 1200) || null;
    else if (key === 'is_favorite' || key === 'is_completed') output[key] = Boolean(value);
    else if (ENUMS[key]) output[key] = ENUMS[key].has(String(value)) ? String(value) : null;
  }
  if (requireTitle && !output.title) throw new Error('Give your Date Idea a title.');
  return output;
};

export async function listMyDateIdeas() {
  if (!DATE_IDEA_PERSISTENCE_ENABLED) return [];
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase.from('custom_date_ideas').select(DATE_IDEA_COLUMNS).eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createMyDateIdea(input) {
  requirePersistenceEnabled();
  const user = await requireAuthenticatedUser();
  const values = sanitize(input, { requireTitle: true });
  const { data, error } = await supabase.from('custom_date_ideas').insert({ ...values, user_id: user.id }).select(DATE_IDEA_COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function updateMyDateIdea(id, patch) {
  requirePersistenceEnabled();
  const user = await requireAuthenticatedUser();
  const values = sanitize(patch);
  if (!id || Object.keys(values).length === 0) throw new Error('Nothing to update.');
  const { data, error } = await supabase.from('custom_date_ideas').update(values).eq('id', id).eq('user_id', user.id).select(DATE_IDEA_COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function deleteMyDateIdea(id) {
  requirePersistenceEnabled();
  const user = await requireAuthenticatedUser();
  const { error } = await supabase.from('custom_date_ideas').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
  return true;
}

export async function saveBuiltInDateIdea(idea) {
  requirePersistenceEnabled();
  const user = await requireAuthenticatedUser();
  const title = cleanText(idea?.title, 120);
  const description = cleanText(idea?.description, 1200);
  if (!title) throw new Error('Date Idea is missing a title.');

  let existingQuery = supabase.from('custom_date_ideas').select(DATE_IDEA_COLUMNS).eq('user_id', user.id).eq('title', title);
  if (description) existingQuery = existingQuery.eq('description', description);
  const { data: existing, error: existingError } = await existingQuery.limit(1).maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    if (existing.is_favorite) return existing;
    return updateMyDateIdea(existing.id, { is_favorite: true });
  }

  return createMyDateIdea({
    title,
    description,
    category: idea?.category,
    budget: idea?.budget,
    location_type: idea?.location_type,
    occasion: idea?.occasion,
    relationship_stage: idea?.relationship_stage,
    is_favorite: true,
    is_completed: false,
  });
}
