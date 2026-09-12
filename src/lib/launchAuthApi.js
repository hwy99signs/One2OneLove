import { apiRequest } from './one2oneApi';

export const launchAuthApi = {
  async register(payload) {
    return apiRequest('/api/launch-signup', {
      method: 'POST',
      body: payload,
    });
  },

  async resendVerification(email) {
    return apiRequest('/api/launch-signup/resend', {
      method: 'POST',
      body: { email },
    });
  },
};

export default launchAuthApi;
