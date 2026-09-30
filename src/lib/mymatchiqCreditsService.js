import { apiRequest } from './apiClient';

export async function getCreditConfig(){
  return apiRequest('/api/mymatchiq/credits/config');
}
export async function getCreditWallet(){
  return apiRequest('/api/mymatchiq/credits/wallet');
}
export async function getAutoReplenish(){
  const payload=await apiRequest('/api/mymatchiq/credits/auto-replenish');
  return payload?.settings||null;
}
export async function saveAutoReplenish(settings){
  const payload=await apiRequest('/api/mymatchiq/credits/auto-replenish',{method:'PUT',body:settings});
  return payload?.settings||null;
}
export async function startCreditCheckout(packageCode){
  return apiRequest('/api/mymatchiq/credits/checkout',{method:'POST',body:{packageCode}});
}
export async function getCreditHistory(){
  const payload=await apiRequest('/api/mymatchiq/credits/history');
  return payload?.history||[];
}
