// @ts-nocheck
import baseWorker from './index';
import { handleLaunchAuthRequest } from './launch-auth';
import { handleProfessionalSignup } from './professional-signup';
import { handleSpecialProfileRequest } from './onboarding';
import { handleMemberOnboarding } from './member-onboarding';
import { handleProfileMediaRequest } from './profile-media';
import { handleGoalsRequest } from './goals';
import { handleCalendarRequest } from './calendar';
import { handleDateIdeasRequest } from './date-ideas';
import { handleMemoriesRequest } from './memories';
import { handleJournalsRequest } from './journals';
import { handleBuddiesRequest } from './buddies';
import { handleMilestonesRequest } from './milestones';
import { handlePresenceRequest } from './presence';
import { handleStoriesRequest } from './stories';
import { handleCommunitiesRequest } from './communities';
import { handleChatRequest } from './chat';
import { handleBillingRequest } from './billing';
import { handleEngagementRequest } from './engagement';
import { handleReviewsRequest } from './reviews';
import { handleConsentsRequest } from './consents';
import { handleContestsRequest } from './contests';
import { handleAiRequest } from './ai';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/ai')) {
      const response = await handleAiRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/launch-signup')) {
      const response = await handleLaunchAuthRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname === '/api/professional-signup') {
      const response = await handleProfessionalSignup(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/reviews')) {
      const response = await handleReviewsRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/consents')) {
      const response = await handleConsentsRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/contests')) {
      const response = await handleContestsRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/engagement')) {
      const response = await handleEngagementRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/billing')) {
      const response = await handleBillingRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/chat')) {
      const response = await handleChatRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/communities')) {
      const response = await handleCommunitiesRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/stories')) {
      const response = await handleStoriesRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/presence')) {
      const response = await handlePresenceRequest(request, env, url);
      if (response) return response;
    }

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

    if (url.pathname.startsWith('/api/date-ideas')) {
      const response = await handleDateIdeasRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/memories') || url.pathname.startsWith('/api/media/memories/')) {
      const response = await handleMemoriesRequest(request, env, url);
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
