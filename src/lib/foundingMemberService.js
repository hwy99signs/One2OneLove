import { apiRequest } from './apiClient';

export async function getFoundingMemberStatus(){
  try { return await apiRequest('/api/founding-members/status'); }
  catch { return { member:null, claimed:0, remaining:0, unavailable:true }; }
}
export async function startFoundingMemberCheckout(){
  const payload=await apiRequest('/api/founding-members/checkout',{method:'POST',body:{}});
  if(!payload?.url) throw new Error('No checkout URL received.');
  window.location.href=payload.url;
  return payload;
}
export async function chooseFoundingPremiere(){
  return apiRequest('/api/founding-members/choose-premiere',{method:'POST',body:{}});
}
