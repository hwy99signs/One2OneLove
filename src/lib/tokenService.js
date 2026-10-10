import { apiRequest } from './apiClient';

export async function getTokenWallet(){
  return apiRequest('/api/tokens/wallet');
}
export async function getTokenPackages(){
  return apiRequest('/api/tokens/packages');
}
export async function startTokenCheckout(packageCode,returnTo=null,customAmountCents=null){
  return apiRequest('/api/tokens/checkout',{method:'POST',body:{packageCode,...(returnTo?{returnTo}:{}),...(customAmountCents!=null?{customAmountCents}:{})}});
}
export async function confirmTokenCheckout(sessionId){
  return apiRequest('/api/tokens/checkout/confirm',{method:'POST',body:{sessionId}});
}
export async function startPaymentMethodSetup(){
  return apiRequest('/api/tokens/payment-method/setup',{method:'POST',body:{}});
}
export async function confirmPaymentMethodSetup(sessionId){
  return apiRequest('/api/tokens/payment-method/confirm',{method:'POST',body:{sessionId}});
}
export async function updateAutoReplenish({enabled,packageCode,triggerBalance,monthlyCapCents,consentGiven}){
  return apiRequest('/api/tokens/auto-replenish',{method:'PUT',body:{enabled,packageCode,triggerBalance,monthlyCapCents,consentGiven}});
}
export async function startCostCalibration({featureCode,packageCode=null,notes=''}) {
  return apiRequest('/api/tokens/calibration/start',{method:'POST',body:{featureCode,packageCode,notes}});
}
export async function endCostCalibration(sessionId) {
  return apiRequest('/api/tokens/calibration/end',{method:'POST',body:{sessionId}});
}
export async function getCalibrationHistory(){
  return apiRequest('/api/tokens/calibration/history');
}
export function isTokensRequiredError(error){
  return error?.status===402 && ['tokens_required','credit_required'].includes(error?.payload?.error?.code);
}
export function isPhoneVerificationError(error){
  return error?.status===428 || error?.payload?.error?.code==='phone_verification_required';
}
export function tokenRequiredDetails(error){
  const e=error?.payload?.error||{};
  return {balance:Number(e.balance||0),required:Number(e.required||0),featureCode:e.featureCode||null,featureLabel:e.featureLabel||null};
}

export async function listTokenUnlocks(featureCode){
  const query=new URLSearchParams({featureCode:String(featureCode||'')});
  return apiRequest('/api/tokens/unlocks?'+query.toString());
}
export async function unlockTokenContent({featureCode,contentKey,source='content_unlock',idempotencyKey=null}){
  return apiRequest('/api/tokens/unlocks',{
    method:'POST',
    body:{featureCode,contentKey,source,...(idempotencyKey?{idempotencyKey}:{})},
  });
}
