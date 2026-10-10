import { apiRequest } from './apiClient';

export async function getCoachingConsent(){
  return apiRequest('/api/consents/coaching');
}

export async function acceptCoachingConsent({version,source='coaching_gate'}){
  return apiRequest('/api/consents/coaching',{
    method:'PUT',
    body:{accepted:true,version,source},
  });
}
