import { apiRequest } from './apiClient';
import { loadCollection, saveCollection, insertRecord, updateRecord, deleteRecord, getRecord, isUnauthorized } from './guestStore';

// Guest mode (2026-11-25): with no account, goals and their action steps
// live in the browser-local guest store. Members keep the server API.
// Calls try the API first and fall back locally only on a 401 (no session).
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
  try {
    const payload = await apiRequest(`/api/goals?order=${encodeURIComponent(orderBy)}`);
    return payload?.goals || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return sortGoals(loadCollection(LOCAL_GOALS), orderBy);
  }
}

export async function getGoalById(goalId) {
  try {
    const payload = await apiRequest(`/api/goals/${goalId}`);
    return payload?.goal || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return getRecord(LOCAL_GOALS, goalId);
  }
}

export async function createGoal(goalData) {
  try {
    const payload = await apiRequest('/api/goals', { method: 'POST', body: goalData });
    return payload?.goal || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return insertRecord(LOCAL_GOALS, { progress: 0, status: 'in_progress', ...(goalData || {}) });
  }
}

export async function updateGoal(goalId, goalData) {
  const { action_steps_details, ...clean } = goalData || {};
  try {
    const payload = await apiRequest(`/api/goals/${goalId}`, { method: 'PATCH', body: clean });
    return payload?.goal || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL_GOALS, goalId, clean);
  }
}

export async function deleteGoal(goalId) {
  try {
    await apiRequest(`/api/goals/${goalId}`, { method: 'DELETE' });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    deleteRecord(LOCAL_GOALS, goalId);
    saveCollection(LOCAL_STEPS, loadCollection(LOCAL_STEPS).filter(step => String(step.goal_id) !== String(goalId)));
  }
}

export async function updateGoalProgress(goalId, progress) {
  try {
    const payload = await apiRequest(`/api/goals/${goalId}/progress`, { method: 'PATCH', body: { progress } });
    return payload?.goal || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL_GOALS, goalId, { progress });
  }
}

export async function completeGoal(goalId) {
  try {
    const payload = await apiRequest(`/api/goals/${goalId}/complete`, { method: 'POST', body: {} });
    return payload?.goal || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL_GOALS, goalId, { progress: 100, status: 'completed' });
  }
}

export async function getActionSteps(goalId) {
  try {
    const payload = await apiRequest(`/api/goals/${goalId}/steps`);
    return payload?.steps || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return localStepsFor(goalId);
  }
}

export async function toggleStepCompletion(stepId, isCompleted) {
  try {
    const payload = await apiRequest(`/api/goals/steps/${stepId}`, { method: 'PATCH', body: { is_completed: Boolean(isCompleted) } });
    return payload?.step || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL_STEPS, stepId, { is_completed: Boolean(isCompleted) });
  }
}

export async function addActionStep(goalId, stepText) {
  try {
    const payload = await apiRequest(`/api/goals/${goalId}/steps`, { method: 'POST', body: { step_text: stepText } });
    return payload?.step || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return insertRecord(LOCAL_STEPS, { goal_id: goalId, step_text: stepText, is_completed: false });
  }
}

export async function deleteActionStep(stepId) {
  try {
    await apiRequest(`/api/goals/steps/${stepId}`, { method: 'DELETE' });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    deleteRecord(LOCAL_STEPS, stepId);
  }
}

export async function getGoalStats() {
  try {
    const payload = await apiRequest('/api/goals/stats');
    return payload?.stats || { total: 0, completed: 0, in_progress: 0, cancelled: 0, avgProgress: 0 };
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    const rows = loadCollection(LOCAL_GOALS);
    const completed = rows.filter(goal => goal?.status === 'completed' || Number(goal?.progress) >= 100).length;
    const cancelled = rows.filter(goal => goal?.status === 'cancelled').length;
    const avgProgress = rows.length ? Math.round(rows.reduce((sum, goal) => sum + Number(goal?.progress || 0), 0) / rows.length) : 0;
    return { total: rows.length, completed, in_progress: rows.length - completed - cancelled, cancelled, avgProgress };
  }
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
