import { goalsApi } from './one2oneApi';

/**
 * Relationship Goals Service
 * The public interface is preserved while persistence now flows through the
 * authenticated Cloudflare Worker API instead of direct browser database calls.
 */

export async function getGoals(orderBy = '-created_at') {
  try {
    return await goalsApi.list(orderBy);
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
}

export async function getGoalById(goalId) {
  try {
    return await goalsApi.get(goalId);
  } catch (error) {
    console.error('Error fetching goal:', error);
    throw error;
  }
}

export async function createGoal(goalData) {
  try {
    return await goalsApi.create(goalData);
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
}

export async function updateGoal(goalId, goalData) {
  try {
    const { action_steps_details: _details, ...payload } = goalData || {};
    return await goalsApi.update(goalId, payload);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
}

export async function deleteGoal(goalId) {
  try {
    await goalsApi.remove(goalId);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

export async function updateGoalProgress(goalId, progress) {
  try {
    return await goalsApi.setProgress(goalId, progress);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
}

export async function completeGoal(goalId) {
  try {
    return await goalsApi.complete(goalId);
  } catch (error) {
    console.error('Error completing goal:', error);
    throw error;
  }
}

export async function getActionSteps(goalId) {
  try {
    return await goalsApi.listSteps(goalId);
  } catch (error) {
    console.error('Error fetching action steps:', error);
    throw error;
  }
}

export async function toggleStepCompletion(stepId, isCompleted) {
  try {
    return await goalsApi.toggleStep(stepId, isCompleted);
  } catch (error) {
    console.error('Error toggling step completion:', error);
    throw error;
  }
}

export async function addActionStep(goalId, stepText) {
  try {
    return await goalsApi.addStep(goalId, stepText);
  } catch (error) {
    console.error('Error adding action step:', error);
    throw error;
  }
}

export async function deleteActionStep(stepId) {
  try {
    await goalsApi.removeStep(stepId);
  } catch (error) {
    console.error('Error deleting action step:', error);
    throw error;
  }
}

export async function getGoalStats() {
  try {
    return await goalsApi.stats();
  } catch (error) {
    console.error('Error fetching goal stats:', error);
    throw error;
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
