import { apiRequest } from './apiClient';

export async function getAdultSensitiveConsent() {
  const payload = await apiRequest('/api/consents/adult-sensitive');
  return payload?.consent || null;
}

export async function saveAdultSensitiveConsent(consent) {
  const payload = await apiRequest('/api/consents/adult-sensitive', {
    method: 'PUT',
    body: consent,
  });
  return payload?.consent || null;
}
