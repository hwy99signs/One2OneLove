import { apiRequest } from './apiClient';

export async function getGoals(orderBy = '-created_at') {
  const payload = await apiRequest(`/api/goals?order=${encodeURIComponent(orderBy)}`);
  return payload?.goals || [];
}

export async function getGoalById(goalId) {
  const payload = await apiRequest(`/api/goals/${goalId}`);
  return payload?.goal || null;
}

export async function createGoal(goalData) {
  const payload = await apiRequest('/api/goals', { method: 'POST', body: goalData });
  return payload?.goal || null;
}

export async function updateGoal(goalId, goalData) {
  const { action_steps_details, ...clean } = goalData || {};
  const payload = await apiRequest(`/api/goals/${goalId}`, { method: 'PATCH', body: clean });
  return payload?.goal || null;
}

export async function deleteGoal(goalId) {
  await apiRequest(`/api/goals/${goalId}`, { method: 'DELETE' });
}

export async function updateGoalProgress(goalId, progress) {
  const payload = await apiRequest(`/api/goals/${goalId}/progress`, {
    method: 'PATCH',
    body: { progress },
  });
  return payload?.goal || null;
}

export async function completeGoal(goalId) {
  const payload = await apiRequest(`/api/goals/${goalId}/complete`, { method: 'POST', body: {} });
  return payload?.goal || null;
}

export async function getActionSteps(goalId) {
  const payload = await apiRequest(`/api/goals/${goalId}/steps`);
  return payload?.steps || [];
}

export async function toggleStepCompletion(stepId, isCompleted) {
  const payload = await apiRequest(`/api/goals/steps/${stepId}`, {
    method: 'PATCH',
    body: { is_completed: Boolean(isCompleted) },
  });
  return payload?.step || null;
}

export async function addActionStep(goalId, stepText) {
  const payload = await apiRequest(`/api/goals/${goalId}/steps`, {
    method: 'POST',
    body: { step_text: stepText },
  });
  return payload?.step || null;
}

export async function deleteActionStep(stepId) {
  await apiRequest(`/api/goals/steps/${stepId}`, { method: 'DELETE' });
}

export async function getGoalStats() {
  const payload = await apiRequest('/api/goals/stats');
  return payload?.stats || { total: 0, completed: 0, in_progress: 0, cancelled: 0, avgProgress: 0 };
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
