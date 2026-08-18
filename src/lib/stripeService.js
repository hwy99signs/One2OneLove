import { supabase } from './supabase';

const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';
const MEMBERSHIP_PLAN_KEY = 'membership';

const requireConfirmedUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('You must be signed in to manage membership.');
  if (!user.email_confirmed_at && !user.confirmed_at) {
    throw new Error('Please confirm your email before managing membership.');
  }
  return user;
};

export const isStripeConfigured = () => PAYMENTS_ENABLED;
export const isPaymentsEnabled = () => PAYMENTS_ENABLED;

/**
 * Start the single relaunch membership checkout.
 * The browser never chooses a Stripe Price ID, amount, account ID, or billing email.
 * Those values are derived and validated by the server-side Edge Function.
 */
export const createCheckoutSession = async () => {
  try {
    if (!PAYMENTS_ENABLED) {
      throw new Error('Membership payments are not enabled yet.');
    }

    await requireConfirmedUser();

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { planKey: MEMBERSHIP_PLAN_KEY },
    });

    if (error) throw error;
    if (!data?.url || typeof data.url !== 'string') {
      throw new Error('No secure checkout URL was returned.');
    }

    return { success: true, sessionId: data.sessionId || null, url: data.url };
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create a checkout session.',
    };
  }
};

/**
 * Compatibility entry point for legacy callers. Any caller-supplied legacy plan is
 * deliberately ignored; there is only one server-configured relaunch membership SKU.
 */
export const handleSubscriptionCheckout = async () => {
  const result = await createCheckoutSession();
  if (!result.success) return result;

  if (typeof window !== 'undefined') {
    window.location.assign(result.url);
  }
  return { success: true };
};

/** Read only the authenticated user's privacy-safe membership projection. */
export const getUserSubscription = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data, error } = await supabase
      .from('my_membership')
      .select('user_id, plan_key, pricing_version, status, intro_ends_at, current_period_end, cancel_at_period_end, activated_at, canceled_at, updated_at')
      .maybeSingle();

    if (error) {
      // The migration is staged but may not exist in a development preview yet.
      console.warn('Membership projection unavailable:', error);
      return null;
    }

    if (!data) return null;

    // Preserve a small legacy-compatible shape without exposing Stripe identifiers.
    return {
      ...data,
      subscription_plan: data.plan_key === MEMBERSHIP_PLAN_KEY ? 'Membership' : null,
      subscription_status: data.status,
      subscription_current_period_end: data.current_period_end,
    };
  } catch (error) {
    console.error('getUserSubscription error:', error);
    return null;
  }
};

/**
 * Payment history remains own-user-only. This legacy table is read-only from this
 * service; no payment or subscription state is ever written from browser code.
 */
export const getPaymentHistory = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return [];

    const { data, error } = await supabase
      .from('payment_history')
      .select('id, amount, currency, status, subscription_plan, payment_method, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Payment history unavailable:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getPaymentHistory error:', error);
    return [];
  }
};

/** Create a short-lived Stripe-hosted billing portal session on demand. */
export const createBillingPortalSession = async () => {
  try {
    if (!PAYMENTS_ENABLED) throw new Error('Membership billing is not enabled yet.');
    await requireConfirmedUser();

    const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
      body: {},
    });

    if (error) throw error;
    if (!data?.url || typeof data.url !== 'string') {
      throw new Error('No secure billing portal URL was returned.');
    }

    return { success: true, url: data.url };
  } catch (error) {
    console.error('createBillingPortalSession error:', error);
    return { success: false, error: error?.message || 'Unable to open billing management.' };
  }
};

export const openBillingPortal = async () => {
  const result = await createBillingPortalSession();
  if (result.success && typeof window !== 'undefined') {
    window.location.assign(result.url);
  }
  return result;
};

// Legacy aliases fail safely into Stripe's authenticated hosted billing portal instead
// of sending browser-supplied user IDs to nonexistent/custom mutation functions.
export const cancelSubscription = openBillingPortal;
export const reactivateSubscription = openBillingPortal;

/**
 * Legacy plan-matrix access is intentionally disabled while the relaunch free-account
 * versus paid-membership boundary is being approved. Feature gating must not silently
 * revive the old Basic/Premiere/Exclusive product model.
 */
export const featureAccess = Object.freeze({});
export const hasFeatureAccess = () => false;
