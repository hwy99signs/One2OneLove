import { useAuth } from '@/contexts/AuthContext';
import { hasFeatureAccess } from '@/lib/stripeService';

const canonicalPlan = (plan) => {
  const value = String(plan || '').trim();
  return value === 'Basic' ? 'Basic' : value || 'Basic';
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
  const status = String(user?.subscription_status || '').toLowerCase();
  if (String(user?.role || '').toLowerCase() === 'admin') return true;
  return Boolean(user?.stripe_subscription_id && ['active', 'trial', 'trialing'].includes(status));
};

/**
 * Hook to check if user can upgrade
 * @returns {boolean}
 */
export const useCanUpgrade = () => {
  const { user } = useAuth();
  const plan = canonicalPlan(user?.subscription_plan);
  return plan === 'Basic' || plan === 'Premiere';
};

/**
 * Hook to get feature limits based on plan
 * @returns {Object} Feature limits
 */
export const useFeatureLimits = () => {
  const { user } = useAuth();
  const plan = canonicalPlan(user?.subscription_plan);

  const limits = {
    Basic: {
      loveNotes: 4,
      dateIdeas: 1,
      aiQuestions: 0,
      quizzes: 'basic'
    },
    Premiere: {
      loveNotes: 30,
      dateIdeas: 8,
      aiQuestions: 50,
      quizzes: 'advanced'
    },
    Exclusive: {
      loveNotes: 60,
      dateIdeas: 'unlimited',
      aiQuestions: 'unlimited',
      quizzes: 'advanced'
    }
  };

  return limits[plan] || limits.Basic;
};

export default useFeatureAccess;
