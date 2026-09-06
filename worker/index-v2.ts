// @ts-nocheck
import baseWorker from './index';
import { handleSpecialProfileRequest } from './onboarding';
import { handleMemberOnboarding } from './member-onboarding';
import { handleProfileMediaRequest } from './profile-media';
import { handleGoalsRequest } from './goals';
import { handleCalendarRequest } from './calendar';
import { handleJournalsRequest } from './journals';
import { handleBuddiesRequest } from './buddies';
import { handleMilestonesRequest } from './milestones';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/milestones') || url.pathname.startsWith('/api/media/milestones/')) {
      const response = await handleMilestonesRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/buddies')) {
      const response = await handleBuddiesRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/journals')) {
      const response = await handleJournalsRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/calendar-events')) {
      const response = await handleCalendarRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/goals')) {
      const response = await handleGoalsRequest(request, env, url);
      if (response) return response;
    }

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
