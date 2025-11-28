import { useAuth } from '@/contexts/AuthContext';
import { hasFeatureAccess } from '@/lib/stripeService';

/**
 * Hook to check if user has access to a feature
 * @param {string} feature - Feature name to check
 * @returns {Object} {hasAccess: boolean, plan: string, status: string}
 */
export const useFeatureAccess = (feature) => {
  const { user } = useAuth();

  const hasAccess = hasFeatureAccess(feature, user);
  
  return {
    hasAccess,
    plan: user?.subscription_plan || 'Basic',
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
  
  return (
    user?.subscription_plan !== 'Basic' &&
    user?.subscription_status === 'active'
  );
};

/**
 * Hook to check if user can upgrade
 * @returns {boolean}
 */
export const useCanUpgrade = () => {
  const { user } = useAuth();
  
  const plan = user?.subscription_plan || 'Basic';
  
  // Can upgrade if on Basic or Premiere
  return plan === 'Basic' || plan === 'Premiere';
};

/**
 * Hook to get feature limits based on plan
 * @returns {Object} Feature limits
 */
export const useFeatureLimits = () => {
  const { user } = useAuth();
  
  const plan = user?.subscription_plan || 'Basic';
  
  const limits = {
    Basic: {
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
  
  return limits[plan] || limits.Basic;
};

export default useFeatureAccess;

