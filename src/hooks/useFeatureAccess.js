import { useAuth } from '@/contexts/AuthContext';
import { hasFeatureAccess } from '@/lib/stripeService';

const canonicalPlan = (plan) => {
  const value = String(plan || '').trim().toLowerCase();
  if (value === 'exclusive') return 'Exclusive';
  return 'Premiere';
};

export const useFeatureAccess = (feature) => {
  const { user } = useAuth();
  return {
    hasAccess: hasFeatureAccess(feature, user),
    plan: canonicalPlan(user?.subscription_plan),
    status: user?.subscription_status || 'inactive',
    user,
  };
};

export const useHasPaidPlan = () => {
  const { user } = useAuth();
  const status = String(user?.subscription_status || '').toLowerCase();
  if (String(user?.role || '').toLowerCase() === 'admin') return true;
  return Boolean(user?.stripe_subscription_id && ['active', 'trial', 'trialing'].includes(status));
};

export const useCanUpgrade = () => {
  const { user } = useAuth();
  return canonicalPlan(user?.subscription_plan) === 'Premiere';
};

export const useFeatureLimits = () => {
  const { user } = useAuth();
  const status = String(user?.subscription_status || '').toLowerCase();
  const plan = ['trial', 'trialing'].includes(status) ? 'Exclusive' : canonicalPlan(user?.subscription_plan);
  const limits = {
    Premiere: {
      loveNoteSmsPrice: 0.29,
      firstPaidSmsLoveNoteFree: true,
      dateIdeas: 8,
      aiQuestions: 50,
      quizzes: 'advanced',
    },
    Exclusive: {
      loveNoteSmsPrice: 0.29,
      firstPaidSmsLoveNoteFree: true,
      dateIdeas: 'unlimited',
      aiQuestions: 'unlimited',
      quizzes: 'advanced',
    },
  };
  return limits[plan] || limits.Premiere;
};

export default useFeatureAccess;
