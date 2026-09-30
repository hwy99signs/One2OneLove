import { apiRequest } from './apiClient';

export async function getAssessmentQuestions(language='en'){
  const payload=await apiRequest(`/api/mymatchiq/assessment/questions?lang=${encodeURIComponent(language)}`);
  return payload?.questions||[];
}
export async function getPassport(){
  const payload=await apiRequest('/api/mymatchiq/passport');
  return payload?.passport||null;
}
export async function createPassport(language='en'){
  const payload=await apiRequest(`/api/mymatchiq/passport?lang=${encodeURIComponent(language)}`,{method:'POST',body:{}});
  return payload?.passport||null;
}
export async function getPassportAnswers(passportId){
  const payload=await apiRequest(`/api/mymatchiq/passport/${encodeURIComponent(passportId)}/answers`);
  return payload?.answers||[];
}
export async function savePassportAnswer(passportId,questionId,value){
  return apiRequest(`/api/mymatchiq/passport/${encodeURIComponent(passportId)}/answers`,{method:'PUT',body:{questionId,value}});
}
export async function completePassport(passportId){
  return apiRequest(`/api/mymatchiq/passport/${encodeURIComponent(passportId)}/complete`,{method:'POST',body:{}});
}
