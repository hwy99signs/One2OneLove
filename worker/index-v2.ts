// @ts-nocheck
import baseWorker from './index';
import { handleSpecialProfileRequest } from './onboarding';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/onboarding/') || url.pathname.startsWith('/api/profiles/')) {
      const response = await handleSpecialProfileRequest(request, env, url);
      if (response) return response;
    }
    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    return baseWorker.scheduled(controller, env, ctx);
  },
};
