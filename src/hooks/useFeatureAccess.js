import { useAuth } from '@/contexts/AuthContext';
import { hasFeatureAccess } from '@/lib/stripeService';

const canonicalPlan = (plan) => {
  const value = String(plan || '').trim();
  return value === 'Basic' || value === 'Basis' ? 'Basis' : value || 'Basis';
};

/**
 * Hook to check if user has access to a feature
 * @param {string} feature - Feature name to check
 * @returns {Object} {hasAccess: boolean, plan: string, status: string}
 */
export const useFeatureAccess = (feature) => {
  const { user } = useAuth();
  const plan = canonicalPlan(user?.subscription_plan);

  return {
    hasAccess: hasFeatureAccess(feature, user),
    plan,
    status: user?.subscription_status || 'inactive',
    user
  };
};

/**
 * Hook to check if user has an active paid subscription
 * @returns {boolean}
 */
export const useHasPaidPlan = () => {
  const { user } = useAuth();
  const plan = canonicalPlan(user?.subscription_plan);
  return plan !== 'Basis' && ['active', 'trial'].includes(user?.subscription_status);
};

/**
 * Hook to check if user can upgrade
 * @returns {boolean}
 */
export const useCanUpgrade = () => {
  const { user } = useAuth();
  const plan = canonicalPlan(user?.subscription_plan);
  return plan === 'Basis' || plan === 'Premiere';
};

/**
 * Hook to get feature limits based on plan
 * @returns {Object} Feature limits
 */
export const useFeatureLimits = () => {
  const { user } = useAuth();
  const plan = canonicalPlan(user?.subscription_plan);

  const limits = {
    Basis: {
      loveNotes: 50,
      dateIdeas: 5,
      aiQuestions: 0,
      quizzes: 'basic'
    },
    Premiere: {
      loveNotes: 1000,
      dateIdeas: 'unlimited',
      aiQuestions: 50,
      quizzes: 'advanced'
    },
    Exclusive: {
      loveNotes: 'unlimited',
      dateIdeas: 'unlimited',
      aiQuestions: 'unlimited',
      quizzes: 'advanced'
    }
  };

  return limits[plan] || limits.Basis;
};

export default useFeatureAccess;
