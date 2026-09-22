import { apiRequest } from './apiClient';

export async function sendPhoneVerificationOtp(phoneNumber) {
  return apiRequest('/api/phone-verification/send', {
    method: 'POST',
    body: { phoneNumber },
  });
}

export async function verifyPhoneNumberOtp(phoneNumber, code) {
  return apiRequest('/api/phone-verification/verify', {
    method: 'POST',
    body: {
      phoneNumber,
      code,
    },
  });
}
