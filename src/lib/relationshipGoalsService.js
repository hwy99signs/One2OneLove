import { supabase } from './supabase';

const GOAL_COLUMNS = 'id,user_id,title,description,category,status,progress,target_date,completed_date,created_at,updated_at';
const STEP_COLUMNS = 'id,goal_id,step_text,step_order,is_completed,completed_at,created_at,updated_at';
const CATEGORIES = new Set(['communication','quality_time','intimacy','personal_growth','financial','family','health','adventure','home','career']);
const STATUSES = new Set(['in_progress','completed','cancelled']);

const requireConfirmedUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) throw new Error('Sign in to use Relationship Goals.');
  if (!user.email_confirmed_at && !user.confirmed_at) throw new Error('Confirm your email before using Relationship Goals.');
  return user;
};

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const safeProgress = (value) => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0));
const safeDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;

const sanitizeGoal = (input = {}, { create = false } = {}) => {
  const output = {};
  if (create || Object.prototype.hasOwnProperty.call(input, 'title')) output.title = clean(input.title, 160);
  if (create || Object.prototype.hasOwnProperty.call(input, 'description')) output.description = clean(input.description, 1600) || null;
  if (create || Object.prototype.hasOwnProperty.call(input, 'category')) output.category = CATEGORIES.has(input.category) ? input.category : 'communication';
  if (create || Object.prototype.hasOwnProperty.call(input, 'target_date')) output.target_date = safeDate(input.target_date);
  if (Object.prototype.hasOwnProperty.call(input, 'progress')) output.progress = safeProgress(input.progress);
  if (Object.prototype.hasOwnProperty.call(input, 'status')) output.status = STATUSES.has(input.status) ? input.status : 'in_progress';

  if (output.progress === 100) output.status = 'completed';
  if (output.status === 'completed') output.progress = 100;
  if (create && !output.title) throw new Error('Give the goal a title.');
  if (create && !output.target_date) throw new Error('Choose a target date.');
  return output;
};

const sanitizeSteps = (steps = []) => (Array.isArray(steps) ? steps : [])
  .map((step) => clean(step, 300))
  .filter(Boolean)
  .slice(0, 20);

const loadSteps = async (goalIds) => {
  if (!goalIds.length) return new Map();
  const { data, error } = await supabase
    .from('goal_action_steps')
    .select(STEP_COLUMNS)
    .in('goal_id', goalIds)
    .order('step_order', { ascending: true });
  if (error) throw error;

  const byGoal = new Map(goalIds.map((id) => [id, []]));
  for (const step of data || []) {
    if (!byGoal.has(step.goal_id)) byGoal.set(step.goal_id, []);
    byGoal.get(step.goal_id).push(step);
  }
  return byGoal;
};

export async function listRelationshipGoals() {
  const user = await requireConfirmedUser();
  const { data, error } = await supabase
    .from('relationship_goals')
    .select(GOAL_COLUMNS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const goals = data || [];
  const stepsByGoal = await loadSteps(goals.map((goal) => goal.id));
  return goals.map((goal) => ({
    ...goal,
    action_steps_details: stepsByGoal.get(goal.id) || [],
    action_steps: (stepsByGoal.get(goal.id) || []).map((step) => step.step_text),
  }));
}

const replaceSteps = async (goalId, steps) => {
  const cleanSteps = sanitizeSteps(steps);
  const { error: deleteError } = await supabase.from('goal_action_steps').delete().eq('goal_id', goalId);
  if (deleteError) throw deleteError;
  if (!cleanSteps.length) return;

  const { error: insertError } = await supabase.from('goal_action_steps').insert(
    cleanSteps.map((stepText, index) => ({
      goal_id: goalId,
      step_text: stepText,
      step_order: index + 1,
      is_completed: false,
    }))
  );
  if (insertError) throw insertError;
};

export async function createRelationshipGoal(input) {
  const user = await requireConfirmedUser();
  const values = sanitizeGoal(input, { create: true });
  const steps = sanitizeSteps(input?.action_steps);

  const { data: goal, error } = await supabase
    .from('relationship_goals')
    .insert({ ...values, user_id: user.id, status: 'in_progress', progress: 0 })
    .select(GOAL_COLUMNS)
    .single();
  if (error) throw error;

  try {
    await replaceSteps(goal.id, steps);
  } catch (stepError) {
    await supabase.from('relationship_goals').delete().eq('id', goal.id).eq('user_id', user.id);
    throw stepError;
  }
  return goal;
}

export async function updateRelationshipGoal(goalId, input) {
  const user = await requireConfirmedUser();
  const values = sanitizeGoal(input);
  const hasSteps = Object.prototype.hasOwnProperty.call(input || {}, 'action_steps');

  if (Object.keys(values).length) {
    const { error } = await supabase
      .from('relationship_goals')
      .update(values)
      .eq('id', goalId)
      .eq('user_id', user.id);
    if (error) throw error;
  }
  if (hasSteps) await replaceSteps(goalId, input.action_steps);
  return true;
}

export async function updateRelationshipGoalProgress(goalId, progress) {
  const value = safeProgress(progress);
  return updateRelationshipGoal(goalId, {
    progress: value,
    status: value === 100 ? 'completed' : 'in_progress',
  });
}

export async function deleteRelationshipGoal(goalId) {
  const user = await requireConfirmedUser();
  const { error } = await supabase
    .from('relationship_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id);
  if (error) throw error;
  return true;
}
