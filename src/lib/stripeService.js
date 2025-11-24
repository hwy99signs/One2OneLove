import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Create a Stripe checkout session for subscription
 * @param {string} priceId - Stripe price ID
 * @param {string} planName - Plan name (Basis, Premiere, Exclusive)
 * @param {number} amount - Amount in dollars
 * @returns {Promise<{success: boolean, sessionId?: string, error?: string}>}
 */
export const createCheckoutSession = async (priceId, planName, amount) => {
  try {
    console.log('Creating checkout session:', { priceId, planName, amount });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('You must be logged in to subscribe');
    }

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        planName,
        amount,
        userId: user.id,
        userEmail: user.email
      }
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }

    console.log('Checkout session created:', data);
    return {
      success: true,
      sessionId: data.sessionId,
      url: data.url
    };
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session'
    };
  }
};

/**
 * Redirect to Stripe Checkout
 * @param {string} sessionId - Stripe checkout session ID
 */
export const redirectToCheckout = async (sessionId) => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  } catch (error) {
    console.error('redirectToCheckout error:', error);
    throw error;
  }
};

/**
 * Handle subscription checkout
 * @param {Object} plan - Plan object {name, price, priceId}
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const handleSubscriptionCheckout = async (plan) => {
  try {
    // For free plan, just update the user's subscription
    if (plan.price === 0 || plan.name === 'Basis') {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in');
      }

      // Update user to free plan
      const { error } = await supabase
        .from('users')
        .update({
          subscription_plan: 'Basis',
          subscription_price: 0,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      return { success: true };
    }

    // For paid plans, create checkout session
    const result = await createCheckoutSession(
      plan.priceId || `price_${plan.name.toLowerCase()}`,
      plan.name,
      plan.price
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    // Redirect to Stripe Checkout
    // Use URL directly if available (more reliable), otherwise use sessionId
    if (result.url) {
      console.log('Redirecting to Stripe checkout:', result.url);
      window.location.href = result.url;
    } else if (result.sessionId) {
      console.log('Redirecting to Stripe checkout with session ID:', result.sessionId);
      await redirectToCheckout(result.sessionId);
    } else {
      throw new Error('No checkout URL or session ID received from Stripe');
    }

    return { success: true };
  } catch (error) {
    console.error('handleSubscriptionCheckout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to start checkout process'
    };
  }
};

/**
 * Get user's subscription details
 * @returns {Promise<Object>}
 */
export const getUserSubscription = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        subscription_plan,
        subscription_status,
        subscription_price,
        subscription_current_period_start,
        subscription_current_period_end,
        cancel_at_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        payment_method
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getUserSubscription error:', error);
    return null;
  }
};

/**
 * Get user's payment history
 * @returns {Promise<Array>}
 */
export const getPaymentHistory = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getPaymentHistory error:', error);
    return [];
  }
};

/**
 * Cancel subscription at period end
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const cancelSubscription = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('You must be logged in');
    }

    // Call Edge Function to cancel subscription
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { userId: user.id }
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('cancelSubscription error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel subscription'
    };
  }
};

/**
 * Reactivate a canceled subscription
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const reactivateSubscription = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('You must be logged in');
    }

    // Call Edge Function to reactivate subscription
    const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
      body: { userId: user.id }
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('reactivateSubscription error:', error);
    return {
      success: false,
      error: error.message || 'Failed to reactivate subscription'
    };
  }
};

/**
 * Check if user has access to a feature based on their plan
 * @param {string} feature - Feature name
 * @param {Object} user - User object with subscription_plan
 * @returns {boolean}
 */
export const hasFeatureAccess = (feature, user) => {
  if (!user || !user.subscription_plan) {
    return false;
  }

  const plan = user.subscription_plan;
  const status = user.subscription_status;

  // If subscription is not active, only basic features
  if (status !== 'active') {
    return plan === 'Basis' && featureAccess.Basis.includes(feature);
  }

  // Check feature access by plan
  return featureAccess[plan]?.includes(feature) || false;
};

// Feature access matrix
const featureAccess = {
  Basis: [
    'love_notes_limited', // 50+ notes
    'basic_quizzes',
    'date_ideas_limited', // 5 per month
    'anniversary_reminders',
    'memory_timeline',
    'mobile_app',
    'email_support'
  ],
  Premiere: [
    'love_notes_limited',
    'basic_quizzes',
    'date_ideas_limited',
    'anniversary_reminders',
    'memory_timeline',
    'mobile_app',
    'email_support',
    'love_notes_extended', // 1000+ notes
    'ai_coach_limited', // 50 questions/month
    'unlimited_date_ideas',
    'goals_tracker',
    'advanced_quizzes',
    'surprise_messages',
    'ad_free',
    'priority_support',
    'early_access'
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
    'vip_badge'
  ]
};

export { featureAccess };

