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
    return { success: false, error: error?.message || 'Failed to create checkout session' };
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

export const handleSubscriptionCheckout = async (plan) => {
  try {
    const planName = plan?.name === 'Basic' ? 'Basis' : plan?.name;
    const result = await createCheckoutSession(plan?.priceId, planName, plan?.price);
    if (!result.success) return result;
    if (!result.url) throw new Error('No checkout URL received.');
    window.location.href = result.url;
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to start checkout process' };
  }
};

export const getUserSubscription = async () => {
  try {
    const payload = await apiRequest('/api/billing/subscription');
    return payload?.subscription || null;
  } catch {
    return null;
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
  if (!user?.subscription_plan) return false;
  const storedPlan = user.subscription_plan === 'Basic' ? 'Basis' : user.subscription_plan;
  if (user.subscription_status && !['active', 'trial'].includes(user.subscription_status)) return false;
  const effectivePlan = user.subscription_status === 'trial' ? 'Premiere' : storedPlan;
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
  Exclusive: exclusive,
};

export { featureAccess };
