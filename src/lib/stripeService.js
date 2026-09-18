import { apiRequest } from './apiClient';

export const isStripeConfigured = async () => {
  try {
    const payload = await apiRequest('/api/billing/config');
    return Boolean(payload?.paid_checkout_ready);
  } catch {
    return false;
  }
};

export const createCheckoutSession = async (_priceId, planName, amount) => {
  try {
    const payload = await apiRequest('/api/billing/checkout', {
      method: 'POST',
      body: { planName, amount },
    });
    return { success: true, sessionId: payload?.sessionId, url: payload?.url };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Failed to create checkout session',
      code: error?.payload?.error?.code || null,
      status: error?.status || null,
    };
  }
};

export const changePlanDuringTrial = async (planName) => {
  try {
    const payload = await apiRequest('/api/billing/change-plan', {
      method: 'POST',
      body: { planName },
    });
    return { success: true, plan: payload?.plan, updatedInPlace: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Failed to update trial plan',
      code: error?.payload?.error?.code || null,
      status: error?.status || null,
    };
  }
};

export const startPremierTrial = async () => {
  try {
    const payload = await apiRequest('/api/billing/trial', { method: 'POST', body: {} });
    if (!payload?.url) throw new Error('No checkout URL received.');
    window.location.href = payload.url;
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to start Premier trial' };
  }
};

export const redirectToCheckout = async (sessionIdOrUrl) => {
  if (/^https?:\/\//i.test(String(sessionIdOrUrl || ''))) {
    window.location.href = sessionIdOrUrl;
    return;
  }
  throw new Error('Checkout URL was not returned by the billing service.');
};

export const getUserSubscription = async () => {
  try {
    const payload = await apiRequest('/api/billing/subscription');
    return payload?.subscription || null;
  } catch {
    return null;
  }
};

export const handleSubscriptionCheckout = async (plan) => {
  try {
    const planName = plan?.name === 'Basic' ? 'Basis' : plan?.name;
    const result = await createCheckoutSession(plan?.priceId, planName, plan?.price);
    if (!result.success) {
      if (result.code === 'subscription_exists') {
        const current = await getUserSubscription();
        const status = String(current?.subscription_status || '').toLowerCase();
        if (status === 'trial' || status === 'trialing') {
          return changePlanDuringTrial(planName);
        }
        return {
          success: false,
          code: 'active_plan_change_policy_pending',
          error: 'Active subscription plan changes are not enabled from this screen yet.',
        };
      }
      return result;
    }
    if (!result.url) throw new Error('No checkout URL received.');
    window.location.href = result.url;
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to start checkout process' };
  }
};

export const getPaymentHistory = async () => {
  try {
    const payload = await apiRequest('/api/billing/payments');
    return payload?.payments || [];
  } catch {
    return [];
  }
};

export const cancelSubscription = async () => {
  try {
    await apiRequest('/api/billing/cancel', { method: 'POST', body: {} });
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to cancel subscription' };
  }
};

export const reactivateSubscription = async () => {
  try {
    await apiRequest('/api/billing/reactivate', { method: 'POST', body: {} });
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to reactivate subscription' };
  }
};

export const hasFeatureAccess = (feature, user) => {
  if (String(user?.role || '').toLowerCase() === 'admin') return true;
  if (!user?.subscription_plan || !user?.stripe_subscription_id) return false;
  const status = String(user?.subscription_status || '').toLowerCase();
  if (!['active', 'trial', 'trialing'].includes(status)) return false;
  const storedPlan = user.subscription_plan === 'Basic' ? 'Basis' : user.subscription_plan;
  const effectivePlan = ['trial', 'trialing'].includes(status) ? 'Exclusive' : storedPlan;
  return featureAccess[effectivePlan]?.includes(feature) || false;
};

const basis = [
  'love_notes_limited', 'basic_quizzes', 'date_ideas_limited',
  'anniversary_reminders', 'memory_timeline', 'mobile_app', 'email_support',
];
const premiere = [
  ...basis, 'love_notes_extended', 'ai_coach_limited', 'unlimited_date_ideas',
  'goals_tracker', 'advanced_quizzes', 'surprise_messages', 'ad_free',
  'priority_support', 'early_access',
];
const exclusive = [
  ...premiere, 'unlimited_love_notes', 'unlimited_ai_coach', 'ai_content_creator',
  'personalized_reports', 'exclusive_community', 'expert_consultation',
  'premium_support', 'vip_badge',
];

const featureAccess = {
  Basis: basis,
  Basic: basis,
  Premiere: premiere,
  Premier: premiere,
  Exclusive: exclusive,
};

export { featureAccess };
