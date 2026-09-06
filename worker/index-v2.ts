// @ts-nocheck
import baseWorker from './index';
import { handleSpecialProfileRequest } from './onboarding';
import { handleMemberOnboarding } from './member-onboarding';
import { handleProfileMediaRequest } from './profile-media';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/profile/photo' || url.pathname.startsWith('/api/media/profile/')) {
      const response = await handleProfileMediaRequest(request, env, url);
      if (response) return response;
    }

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
