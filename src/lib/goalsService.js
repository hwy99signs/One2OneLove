import { loadCollection, saveCollection, insertRecord, updateRecord, deleteRecord, getRecord } from './guestStore';

// Guest mode is the ONLY mode (owner ruling, 2026-11-25): there are no
// members in the 100% free platform, so goals and their action steps
// live in the browser-local guest store and this service never calls
// the member API. The server goals API still exists in the worker but
// is switched off (410) with the rest of the member system, ready for
// future re-activation.
const LOCAL_GOALS = 'goals';
const LOCAL_STEPS = 'goal_steps';

function sortGoals(goals, orderBy) {
  const rows = [...(goals || [])];
  const raw = String(orderBy || '-created_at');
  const field = raw.replace(/^-/, '');
  const desc = raw.startsWith('-');
  rows.sort((a, b) => {
    const av = String(a?.[field] || a?.created_at || '');
    const bv = String(b?.[field] || b?.created_at || '');
    return desc ? bv.localeCompare(av) : av.localeCompare(bv);
  });
  return rows;
}

function localStepsFor(goalId) {
  return loadCollection(LOCAL_STEPS).filter(step => String(step.goal_id) === String(goalId));
}

export async function getGoals(orderBy = '-created_at') {
  return sortGoals(loadCollection(LOCAL_GOALS), orderBy);
}

export async function getGoalById(goalId) {
  return getRecord(LOCAL_GOALS, goalId);
}

export async function createGoal(goalData) {
  return insertRecord(LOCAL_GOALS, { progress: 0, status: 'in_progress', ...(goalData || {}) });
}

export async function updateGoal(goalId, goalData) {
  const { action_steps_details, ...clean } = goalData || {};
  void action_steps_details;
  return updateRecord(LOCAL_GOALS, goalId, clean);
}

export async function deleteGoal(goalId) {
  deleteRecord(LOCAL_GOALS, goalId);
  saveCollection(LOCAL_STEPS, loadCollection(LOCAL_STEPS).filter(step => String(step.goal_id) !== String(goalId)));
}

export async function updateGoalProgress(goalId, progress) {
  return updateRecord(LOCAL_GOALS, goalId, { progress });
}

export async function completeGoal(goalId) {
  return updateRecord(LOCAL_GOALS, goalId, { progress: 100, status: 'completed' });
}

export async function getActionSteps(goalId) {
  return localStepsFor(goalId);
}

export async function toggleStepCompletion(stepId, isCompleted) {
  return updateRecord(LOCAL_STEPS, stepId, { is_completed: Boolean(isCompleted) });
}

export async function addActionStep(goalId, stepText) {
  return insertRecord(LOCAL_STEPS, { goal_id: goalId, step_text: stepText, is_completed: false });
}

export async function deleteActionStep(stepId) {
  deleteRecord(LOCAL_STEPS, stepId);
}

export async function getGoalStats() {
  const rows = loadCollection(LOCAL_GOALS);
  const completed = rows.filter(goal => goal?.status === 'completed' || Number(goal?.progress) >= 100).length;
  const cancelled = rows.filter(goal => goal?.status === 'cancelled').length;
  const avgProgress = rows.length ? Math.round(rows.reduce((sum, goal) => sum + Number(goal?.progress || 0), 0) / rows.length) : 0;
  return { total: rows.length, completed, in_progress: rows.length - completed - cancelled, cancelled, avgProgress };
}

export default {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  completeGoal,
  getActionSteps,
  toggleStepCompletion,
  addActionStep,
  deleteActionStep,
  getGoalStats,
};
