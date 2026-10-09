import {apiRequest} from './apiClient';

// Legacy billing compatibility module. Recurring Premiere/Exclusive checkout is
// intentionally disabled in the Credit model. Credit purchases live in
// tokenService.js and /api/tokens/*.
export const isStripeConfigured=async()=>false;

function retired(){
  return {
    success:false,
    status:410,
    code:'legacy_subscription_model_retired',
    error:'Recurring One2OneLove subscriptions are retired. Accounts are free; use One2OneLove Credit for metered premium services.',
  };
}

export const createCheckoutSession=async()=>retired();
export const changePlanDuringFoundingPeriod=async()=>retired();
export const handleSubscriptionCheckout=async()=>retired();

export const redirectToCheckout=async(sessionIdOrUrl)=>{
  if(/^https?:\/\//i.test(String(sessionIdOrUrl||''))){
    window.location.href=sessionIdOrUrl;
    return;
  }
  throw new Error('Checkout URL was not returned by the payment service.');
};

export const getFoundingOffer=async()=>{
  try{
    const payload=await apiRequest('/api/billing/founding-offer');
    return payload?.offer||{available:false,economicsPendingCalibration:true};
  }catch{
    return {available:false,unavailable:true,economicsPendingCalibration:true};
  }
};

export const getUserSubscription=async()=>{
  try{
    const payload=await apiRequest('/api/billing/subscription');
    return payload?.subscription||null;
  }catch{return null;}
};

export const getPaymentHistory=async()=>{
  try{
    const payload=await apiRequest('/api/billing/payments');
    return payload?.payments||[];
  }catch{return [];}
};

// Historical recurring-subscription changes are frozen during Token migration.
export const cancelSubscription=async()=>({
  success:false,status:423,code:'legacy_subscription_reconciliation_locked',
  error:'Legacy subscription changes are frozen while Token migration value is reconciled.'
});
export const reactivateSubscription=cancelSubscription;

export const hasFeatureAccess=(_feature,user)=>{
  if(!user?.id)return false;
  if(String(user?.role||'').toLowerCase()==='admin')return true;
  return user?.phone_number_verified===false?false:true;
};

const FREE_MEMBER_FEATURES=[
  'love_notes_limited','love_notes_extended','basic_quizzes','advanced_quizzes',
  'date_ideas_limited','unlimited_date_ideas','anniversary_reminders','memory_timeline',
  'mobile_app','email_support','ai_coach_limited','goals_tracker','surprise_messages',
  'ad_free','priority_support','early_access','unlimited_love_notes','unlimited_ai_coach',
  'ai_content_creator','personalized_reports','exclusive_community','expert_consultation',
  'premium_support','vip_badge'
];

// Compatibility aliases only; these labels no longer represent current access tiers.
export const featureAccess={
  Free:FREE_MEMBER_FEATURES,
  Premiere:FREE_MEMBER_FEATURES,
  Premier:FREE_MEMBER_FEATURES,
  Exclusive:FREE_MEMBER_FEATURES,
};
