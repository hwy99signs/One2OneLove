import { apiRequest } from './one2oneApi';

export async function sendLoveNoteSms(payload) {
  const data = await apiRequest('/api/love-notes/send-sms', {
    method: 'POST',
    body: payload,
  });
  return data?.message || null;
}
