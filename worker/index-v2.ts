// @ts-nocheck
import baseWorker from './index';
import { handleSpecialProfileRequest } from './onboarding';
import { handleMemberOnboarding } from './member-onboarding';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/onboarding/member') {
      const response = await handleMemberOnboarding(request, env, url);
      if (response) return response;
    }

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
