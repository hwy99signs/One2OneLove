import { supabase } from './supabase';

const PAID_PLANS = new Set(['Premiere', 'Exclusive']);

const safeBillingError = (error, fallback = 'Billing is not available right now. Please try again later.') => {
  const message = String(error?.message || error?.context?.error || '').toLowerCase();
  if (message.includes('already_subscribed')) return 'You are already subscribed to this plan.';
  if (message.includes('billing_not_configured')) return 'Paid billing is not available yet.';
  if (message.includes('billing_profile_not_found')) return 'No billing profile is available for this account yet.';
  if (message.includes('authentication')) return 'Please sign in before managing a subscription.';
  return fallback;
};

const getAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
};

export const isStripeConfigured = () => Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async (plan) => {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Please sign in before choosing a paid plan.' };

  const planName = String(plan?.name || '');
  if (!PAID_PLANS.has(planName)) return { success: false, error: 'This paid plan is not available.' };

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { planName },
    });

    if (error || !data?.url) return { success: false, error: safeBillingError(error || data) };
    return { success: true, url: data.url };
  } catch {
    return { success: false, error: 'Billing is not available right now. Please try again later.' };
  }
};

export const createBillingPortalSession = async () => {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Please sign in before managing billing.' };

  try {
    const { data, error } = await supabase.functions.invoke('create-billing-portal', { body: {} });
    if (error || !data?.url) {
      return { success: false, error: safeBillingError(error || data, 'Billing management is not available right now.') };
    }
    return { success: true, url: data.url };
  } catch {
    return { success: false, error: 'Billing management is not available right now.' };
  }
};

export const redirectToCheckout = async (url) => {
  if (!url || typeof window === 'undefined') return { success: false, error: 'Checkout could not be opened.' };
  window.location.assign(url);
  return { success: true };
};

export const handleSubscriptionCheckout = async (plan) => {
  if (!plan?.name) return { success: false, error: 'Invalid subscription plan.' };

  const current = await getUserSubscription();
  const isFree = Boolean(plan.isFree) || Number(plan.price || 0) === 0 || plan.name === 'Basic';

  if (isFree) {
    if (!current || current.subscription_plan === 'Basic') {
      return { success: true, alreadyCurrent: true, planName: 'Basic' };
    }

    const portal = await createBillingPortalSession();
    if (!portal.success) return portal;
    await redirectToCheckout(portal.url);
    return { success: true, redirectedToBillingPortal: true };
  }

  const checkout = await createCheckoutSession(plan);
  if (!checkout.success) return checkout;
  await redirectToCheckout(checkout.url);
  return { success: true, redirectedToCheckout: true };
};

export const getUserSubscription = async () => {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status, subscription_price, subscription_started_at, stripe_customer_id, stripe_subscription_id, subscription_current_period_start, subscription_current_period_end, cancel_at_period_end, canceled_at')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
};

export const getPaymentHistory = async () => {
  const user = await getAuthenticatedUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('payment_history')
    .select('id, amount, currency, status, subscription_plan, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
};

export const cancelSubscription = async () => createBillingPortalSession();
export const reactivateSubscription = async () => createBillingPortalSession();

export const featureAccess = {
  Basic: [
    'love_notes_limited',
    'basic_quizzes',
    'date_ideas_limited',
    'anniversary_reminders',
    'memory_timeline',
    'mobile_app',
    'email_support',
  ],
  Premiere: [
    'love_notes_limited',
    'basic_quizzes',
    'date_ideas_limited',
    'anniversary_reminders',
    'memory_timeline',
    'mobile_app',
    'email_support',
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
    'love_notes_limited',
    'basic_quizzes',
    'date_ideas_limited',
    'anniversary_reminders',
    'memory_timeline',
    'mobile_app',
    'email_support',
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

export const hasFeatureAccess = (feature, user) => {
  if (!user?.subscription_plan) return false;
  const plan = featureAccess[user.subscription_plan] ? user.subscription_plan : 'Basic';
  const status = user.subscription_status || 'active';
  if (plan !== 'Basic' && status !== 'active' && status !== 'trialing') {
    return featureAccess.Basic.includes(feature);
  }
  return featureAccess[plan].includes(feature);
};
