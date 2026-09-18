import { apiRequest } from './apiClient';

export async function sendPhoneVerificationOtp(phoneNumber) {
  return apiRequest('/api/auth/phone-number/send-otp', {
    method: 'POST',
    body: { phoneNumber },
  });
}

export async function verifyPhoneNumberOtp(phoneNumber, code) {
  return apiRequest('/api/auth/phone-number/verify', {
    method: 'POST',
    body: {
      phoneNumber,
      code,
      updatePhoneNumber: true,
      disableSession: false,
    },
  });
}
