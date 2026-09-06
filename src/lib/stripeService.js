import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from './one2oneApi';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey && stripePublishableKey.trim() !== ''
  ? loadStripe(stripePublishableKey)
  : null;

const canonicalPlan = (plan) => {
  const value = String(plan || '').trim().toLowerCase();
  if (value === 'basic' || value === 'basis') return 'Basis';
  if (value === 'premiere') return 'Premiere';
  if (value === 'exclusive') return 'Exclusive';
  return plan;
};

// This only reports whether the optional browser Stripe.js fallback is configured.
// Paid checkout itself is created securely by the Cloudflare Worker.
export const isStripeConfigured = () => {
  return Boolean(stripePublishableKey && stripePublishableKey.trim() !== '');
};

export const getBillingConfiguration = async () => {
  try {
    const data = await apiRequest('/api/billing/config');
    return {
      paidCheckoutReady: Boolean(data?.paid_checkout_ready),
      webhookReady: Boolean(data?.webhook_ready),
    };
  } catch {
    return { paidCheckoutReady: false, webhookReady: false };
  }
};

/**
 * Create a Stripe Checkout session through the authenticated Cloudflare Worker.
 * priceId/amount are accepted for backwards compatibility but are not trusted;
 * the server chooses the configured Stripe Price ID for the selected plan.
 */
export const createCheckoutSession = async (_priceId, planName, _amount) => {
  try {
    const plan = canonicalPlan(planName);
    const data = await apiRequest('/api/billing/checkout', {
      method: 'POST',
      body: { planName: plan },
    });
    return {
      success: true,
      sessionId: data?.sessionId,
      url: data?.url,
    };
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create checkout session',
      code: error?.code || null,
    };
  }
};

/**
 * Browser Stripe.js fallback. Normal One2OneLove checkout uses the Checkout URL
 * returned by the Worker, so a publishable key is not required for that path.
 */
export const redirectToCheckout = async (sessionId) => {
  if (!stripePromise) {
    throw new Error('Stripe browser redirect is not configured.');
  }
  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe failed to initialize');
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;
};

export const handleSubscriptionCheckout = async (plan) => {
  try {
    const planName = canonicalPlan(plan?.name);

    if (plan?.price === 0 || planName === 'Basis') {
      await apiRequest('/api/billing/basis', { method: 'POST', body: {} });
      return { success: true };
    }

    const result = await createCheckoutSession(plan?.priceId, planName, plan?.price);
    if (!result.success) throw new Error(result.error);

    if (result.url) {
      window.location.assign(result.url);
    } else if (result.sessionId) {
      await redirectToCheckout(result.sessionId);
    } else {
      throw new Error('No checkout URL or session ID was returned.');
    }

    return { success: true };
  } catch (error) {
    console.error('handleSubscriptionCheckout error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to start checkout process',
    };
  }
};

export const getUserSubscription = async () => {
  try {
    const data = await apiRequest('/api/billing/subscription');
    const subscription = data?.subscription || null;
    if (!subscription) return null;
    return {
      ...subscription,
      subscription_plan: canonicalPlan(subscription.subscription_plan),
      subscription_price: Number(subscription.subscription_price || 0),
    };
  } catch (error) {
    if (error?.status !== 401) console.error('getUserSubscription error:', error);
    return null;
  }
};

export const getPaymentHistory = async () => {
  try {
    const data = await apiRequest('/api/billing/payments');
    return (data?.payments || []).map((payment) => ({
      ...payment,
      amount: Number(payment.amount || 0),
      subscription_plan: canonicalPlan(payment.subscription_plan),
    }));
  } catch (error) {
    if (error?.status !== 401) console.error('getPaymentHistory error:', error);
    return [];
  }
};

export const cancelSubscription = async () => {
  try {
    await apiRequest('/api/billing/cancel', { method: 'POST', body: {} });
    return { success: true };
  } catch (error) {
    console.error('cancelSubscription error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to cancel subscription',
    };
  }
};

export const reactivateSubscription = async () => {
  try {
    await apiRequest('/api/billing/reactivate', { method: 'POST', body: {} });
    return { success: true };
  } catch (error) {
    console.error('reactivateSubscription error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to reactivate subscription',
    };
  }
};

export const hasFeatureAccess = (feature, user) => {
  if (!user || !user.subscription_plan) return false;
  const plan = canonicalPlan(user.subscription_plan);
  const status = user.subscription_status;

  if (status !== 'active' && status !== 'trial') {
    return plan === 'Basis' && featureAccess.Basis.includes(feature);
  }
  return featureAccess[plan]?.includes(feature) || false;
};

const basisFeatures = [
  'love_notes_limited',
  'basic_quizzes',
  'date_ideas_limited',
  'anniversary_reminders',
  'memory_timeline',
  'mobile_app',
  'email_support',
];

export const featureAccess = {
  Basis: basisFeatures,
  // Compatibility alias for older UI/data while everything is normalized to Basis.
  Basic: basisFeatures,
  Premiere: [
    ...basisFeatures,
    'love_notes_extended',
    'ai_coach_limited',
    'unlimited_date_ideas',
    'goals_tracker',
    'advanced_quizzes',
    'surprise_messages',
    'ad_free',
    'priority_support',
    'early_access',
  ],
  Exclusive: [
    ...basisFeatures,
    'love_notes_extended',
    'ai_coach_limited',
    'unlimited_date_ideas',
    'goals_tracker',
    'advanced_quizzes',
    'surprise_messages',
    'ad_free',
    'priority_support',
    'early_access',
    'unlimited_love_notes',
    'unlimited_ai_coach',
    'ai_content_creator',
    'personalized_reports',
    'exclusive_community',
    'expert_consultation',
    'premium_support',
    'vip_badge',
  ],
};
