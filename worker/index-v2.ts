// @ts-nocheck
import baseWorker from './index';
import { handleAdminRequest } from './admin';
import { handleAnalyticsRequest } from './analytics';
import { handleAdminMfaRequest, enforceAdminMfa } from './admin-mfa';
import { handleFeatureUsageRequest } from './feature-usage';
import { handleSendCreditWebhook, handleSendCreditsRequest } from './send-credits';
import { handleLoveNoteEntitlementRequest } from './love-note-entitlements';
import { handleBillingPlanChangeRequest } from './billing-plan-change';
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
import { handleCommunityChatRequest } from './community-chat';
import { handleBillingRequest } from './billing';
import { handleEngagementRequest } from './engagement';
import { handleReviewsRequest } from './reviews';
import { handleConsentsRequest } from './consents';
import { handleContestsRequest } from './contests';
import { handleAiRequest } from './ai';
import { enforceApiEntitlement } from './api-entitlements';
import { enforceLaunchIdentity } from './identity-gate';
import { handleLaunchReadinessRequest } from './launch-readiness';
import { handleSuggestionsRequest } from './suggestions';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/billing/webhook') {
      const sendCreditResponse = await handleSendCreditWebhook(request.clone(), env, url);
      if (sendCreditResponse) return sendCreditResponse;
    }

    if (url.pathname === '/api/launch-readiness') {
      const response = await handleLaunchReadinessRequest(request, env, url);
      if (response) return response;
    }

    const identityGate = await enforceLaunchIdentity(request, env, url);
    if (identityGate) return identityGate;

    const entitlementGate = await enforceApiEntitlement(request, env, url);
    if (entitlementGate) return entitlementGate;

    if (url.pathname.startsWith('/api/send-credits')) {
      const response = await handleSendCreditsRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/love-notes/')) {
      const response = await handleLoveNoteEntitlementRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname === '/api/billing/change-plan') {
      const response = await handleBillingPlanChangeRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/admin/mfa')) {
      const response = await handleAdminMfaRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname === '/api/admin/analytics') {
      const gate = await enforceAdminMfa(request, env);
      if (gate) return gate;
      const response = await handleAnalyticsRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/admin')) {
      const gate = await enforceAdminMfa(request, env);
      if (gate) return gate;
      const response = await handleAdminRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname === '/api/feature-usage') {
      const response = await handleFeatureUsageRequest(request, env, url);
      if (response) return response;
    }

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

    if (url.pathname.startsWith('/api/suggestions')) {
      const response = await handleSuggestionsRequest(request, env, url);
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

    if (url.pathname.startsWith('/api/community-chat')) {
      const response = await handleCommunityChatRequest(request, env, url);
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
