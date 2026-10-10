// @ts-nocheck
import baseWorker from './index';
import { withDatabaseHealth } from './health-response.js';
import { sendProductionSiteHealth,handlePrivateAdminHealth } from './epscie-health';
import { handleAdminRequest } from './admin';
import { handleTokenAdminRequest } from './token-admin';
import { handleAnalyticsRequest } from './analytics';
import { handleAdminMfaRequest, enforceAdminMfa } from './admin-mfa';
import { handleFeatureUsageRequest, handlePresencePing } from './feature-usage';
import { handleLoveNoteEntitlementRequest } from './love-note-entitlements';
import { handleLoveNoteLibraryRequest } from './love-note-library';
import { handleDateIdeaLibraryRequest } from './date-idea-library';
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
import { handleVotingRequest } from './voting';
import { handleBillingRequest } from './billing';
import { handleEngagementRequest } from './engagement';
import { handleReviewsRequest } from './reviews';
import { handleConsentsRequest } from './consents';
import { handleContestsRequest } from './contests';
import { handleAiRequest } from './ai';
import { handleMyMatchIQAiRequest } from './mymatchiq-ai';
import { handleMyMatchIQCreditsRequest } from './mymatchiq-credits';
import { handleMyMatchIQMembersRequest } from './mymatchiq-members';
import { handleMyMatchIQLegacyRequest } from './mymatchiq-legacy';
import { handleMyMatchIQCoreRequest } from './mymatchiq-core';
import { enforceApiEntitlement } from './api-entitlements';
import { enforceLaunchIdentity } from './identity-gate';
import { handleLaunchReadinessRequest } from './launch-readiness';
import { handleSuggestionsRequest } from './suggestions';
import { handlePhoneVerificationRequest } from './phone-verification';
import { handleGameAccessRequest, handleGameFileRequest } from './game-access';
import { handleLikeMindedRequest } from './like-minded';
import { handleStudioMediaRequest } from './studio-media';
import { handleO2OLTokenRequest } from './o2ol-tokens';
import { handleTwilioMessagingWebhook } from './twilio-webhooks';
import { handleTikTokRequest } from './tiktok';


const SOCIAL_PAGE_META = {
  '/': {
    image:'/assets/o2ol-hero.png',
    en:['One2OneLove','Love. Grow. Evolve. Together. Practical tools, community and support for healthier relationships.'],
    es:['One2OneLove','Ama. Crece. Evoluciona. Juntos. Herramientas, comunidad y apoyo para relaciones más saludables.'],
    fr:['One2OneLove','Aimez. Grandissez. Évoluez. Ensemble. Outils, communauté et soutien pour des relations plus saines.'],
    it:['One2OneLove','Ama. Cresci. Evolvi. Insieme. Strumenti, comunità e supporto per relazioni più sane.'],
    de:['One2OneLove','Lieben. Wachsen. Entwickeln. Gemeinsam. Tools, Community und Unterstützung für gesündere Beziehungen.'],
  },
  '/home': null,
  '/lovenotes': {
    image:'/assets/o2ol-hero.png',
    en:['Love Notes | One2OneLove','Create and share meaningful Love Notes for appreciation, affection and encouragement.'],
    es:['Notas de Amor | One2OneLove','Crea y comparte Notas de Amor para expresar aprecio, afecto y ánimo.'],
    fr:["Notes d’Amour | One2OneLove","Créez et partagez des Notes d’Amour pour exprimer appréciation, affection et encouragement."],
    it:["Note d’Amore | One2OneLove","Crea e condividi Note d’Amore per esprimere apprezzamento, affetto e incoraggiamento."],
    de:['Liebesbotschaften | One2OneLove','Erstellen und teilen Sie Liebesbotschaften für Wertschätzung, Zuneigung und Ermutigung.'],
  },
  '/dateideas': {
    image:'/assets/o2ol-hero.png',
    en:['Date Ideas | One2OneLove','Discover meaningful date ideas and new ways to spend quality time together.'],
    es:['Ideas para Citas | One2OneLove','Descubre ideas para citas y nuevas formas de disfrutar tiempo de calidad juntos.'],
    fr:['Idées de Rendez-vous | One2OneLove','Découvrez des idées de rendez-vous et de nouvelles façons de passer du temps ensemble.'],
    it:['Idee per Appuntamenti | One2OneLove','Scopri idee per appuntamenti e nuovi modi per trascorrere tempo di qualità insieme.'],
    de:['Date-Ideen | One2OneLove','Entdecken Sie Date-Ideen und neue Möglichkeiten für gemeinsame Qualitätszeit.'],
  },
  '/lgbtqsupport': {
    image:'/assets/o2ol-hero.png',
    en:['LGBTQ+ Support | One2OneLove','Inclusive relationship support, resources and community for LGBTQ+ people and couples.'],
    es:['Apoyo LGBTQ+ | One2OneLove','Apoyo, recursos y comunidad inclusivos para personas y parejas LGBTQ+.'],
    fr:['Soutien LGBTQ+ | One2OneLove','Soutien relationnel, ressources et communauté inclusifs pour les personnes et couples LGBTQ+.'],
    it:['Supporto LGBTQ+ | One2OneLove','Supporto relazionale, risorse e comunità inclusive per persone e coppie LGBTQ+.'],
    de:['LGBTQ+ Unterstützung | One2OneLove','Inklusive Beziehungsunterstützung, Ressourcen und Community für LGBTQ+ Menschen und Paare.'],
  },
  '/couplesupport': {
    image:'/assets/o2ol-hero.png',
    en:['Relationship Support | One2OneLove','Practical relationship tools and support for stronger, healthier connections.'],
    es:['Apoyo para Relaciones | One2OneLove','Herramientas y apoyo práctico para relaciones más fuertes y saludables.'],
    fr:['Soutien Relationnel | One2OneLove','Outils et soutien pratiques pour des relations plus fortes et plus saines.'],
    it:['Supporto Relazionale | One2OneLove','Strumenti e supporto pratici per relazioni più forti e sane.'],
    de:['Beziehungsunterstützung | One2OneLove','Praktische Tools und Unterstützung für stärkere, gesündere Beziehungen.'],
  },
  '/podcastssupport': {
    image:'/assets/o2ol-hero.png',
    en:['Podcasts | One2OneLove','Explore relationship conversations, ideas and inspiration through One2OneLove podcasts.'],
    es:['Pódcasts | One2OneLove','Explora conversaciones, ideas e inspiración sobre relaciones en los pódcasts de One2OneLove.'],
    fr:['Podcasts | One2OneLove','Découvrez des conversations, idées et inspirations relationnelles avec les podcasts One2OneLove.'],
    it:['Podcast | One2OneLove','Scopri conversazioni, idee e ispirazione sulle relazioni con i podcast One2OneLove.'],
    de:['Podcasts | One2OneLove','Entdecken Sie Beziehungsgespräche, Ideen und Inspiration in den One2OneLove Podcasts.'],
  },
  '/o2olstudio': {
    image:'/assets/o2ol-hero.png',
    en:['O2OL Studio Show | One2OneLove','Watch O2OL Studio conversations about real relationship questions, featuring Bianca and the One2OneLove relationship experience.'],
    es:['O2OL Studio Show | One2OneLove','Mira conversaciones de O2OL Studio sobre preguntas reales de relaciones, con Bianca y la experiencia One2OneLove.'],
    fr:['O2OL Studio Show | One2OneLove','Regardez les conversations O2OL Studio autour de vraies questions relationnelles, avec Bianca et l’expérience One2OneLove.'],
    it:['O2OL Studio Show | One2OneLove','Guarda le conversazioni O2OL Studio su vere domande relazionali, con Bianca e l’esperienza One2OneLove.'],
    de:['O2OL Studio Show | One2OneLove','Sehen Sie O2OL-Studio-Gespräche über echte Beziehungsfragen mit Bianca und dem One2OneLove-Erlebnis.'],
  },
  '/professionals': {
    image:'/assets/o2ol-hero.png',
    en:['Therapists & Professionals | One2OneLove','The One2OneLove professional network is now on-boarding qualified relationship professionals.'],
    es:['Terapeutas y Profesionales | One2OneLove','La red profesional de One2OneLove está incorporando profesionales cualificados.'],
    fr:['Thérapeutes et Professionnels | One2OneLove','Le réseau professionnel One2OneLove recrute actuellement des professionnels qualifiés.'],
    it:['Terapeuti e Professionisti | One2OneLove','La rete professionale One2OneLove sta inserendo professionisti qualificati.'],
    de:['Therapeuten & Fachkräfte | One2OneLove','Das professionelle One2OneLove-Netzwerk nimmt derzeit qualifizierte Fachkräfte auf.'],
  },
};
SOCIAL_PAGE_META['/home'] = SOCIAL_PAGE_META['/'];

function escapeHtmlMeta(value='') {
  return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function socialPageResponse(request, env, url) {
  if (!['GET','HEAD'].includes(request.method)) return null;
  const route=String(url.pathname||'/').toLowerCase().replace(/\/$/,'')||'/';
  const meta=SOCIAL_PAGE_META[route];
  if (!meta) return null;

  const assetResponse=await env.ASSETS.fetch(request);
  if (!assetResponse.ok || request.method==='HEAD') return assetResponse;
  const contentType=assetResponse.headers.get('content-type')||'';
  if (!contentType.includes('text/html')) return assetResponse;

  const requestedLang=String(url.searchParams.get('lang')||'en').toLowerCase();
  const lang=['en','es','fr','it','de'].includes(requestedLang)?requestedLang:'en';
  const pair=meta[lang]||meta.en;
  const title=pair[0];
  const description=pair[1];
  const canonical='https://www.one2onelove.com'+url.pathname+(lang!=='en'?('?lang='+encodeURIComponent(lang)):'');
  const image='https://www.one2onelove.com'+meta.image;

  let html=await assetResponse.text();
  html=html.replace(/<html lang="[^"]*">/i,'<html lang="'+lang+'">')
    .replace(/<title>[^<]*<\/title>/i,'<title>'+escapeHtmlMeta(title)+'</title>');

  const tags=
    '<meta name="description" content="'+escapeHtmlMeta(description)+'" />'+
    '<link rel="canonical" href="'+escapeHtmlMeta(canonical)+'" />'+
    '<meta property="og:type" content="website" />'+
    '<meta property="og:site_name" content="One2OneLove" />'+
    '<meta property="og:title" content="'+escapeHtmlMeta(title)+'" />'+
    '<meta property="og:description" content="'+escapeHtmlMeta(description)+'" />'+
    '<meta property="og:url" content="'+escapeHtmlMeta(canonical)+'" />'+
    '<meta property="og:image" content="'+escapeHtmlMeta(image)+'" />'+
    '<meta property="og:image:width" content="1200" />'+
    '<meta property="og:image:height" content="630" />'+
    '<meta property="og:image:alt" content="One2OneLove" />'+
    '<meta name="twitter:card" content="summary_large_image" />'+
    '<meta name="twitter:title" content="'+escapeHtmlMeta(title)+'" />'+
    '<meta name="twitter:description" content="'+escapeHtmlMeta(description)+'" />'+
    '<meta name="twitter:image" content="'+escapeHtmlMeta(image)+'" />';
  html=html.replace('</head>',tags+'</head>');
  const headers=new Headers(assetResponse.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('cache-control','public, max-age=300');
  headers.delete('content-length');
  return new Response(html,{status:assetResponse.status,statusText:assetResponse.statusText,headers});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/epscie/admin-health') return handlePrivateAdminHealth(request,env);

    if (url.pathname === '/api/health') {
      return withDatabaseHealth(request, env, (req, bindings) => baseWorker.fetch(req, bindings));
    }

    if (url.pathname.startsWith('/studio-media/') || url.pathname.startsWith('/api/studio/')) {
      const response = await handleStudioMediaRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/games-src/')) {
      const response = await handleGameFileRequest(request, env, url);
      if (response) return response;
    }

    // Serve SPA shell explicitly for legal and problem-report routes.
    if (['/privacypolicy','/termsofservice','/suggestions'].includes(url.pathname.toLowerCase())) {
      if (request.method !== 'GET' && request.method !== 'HEAD')
        return new Response('Method Not Allowed', { status: 405 });
      const root = new URL('/', url);
      const page = await env.ASSETS.fetch(new Request(root.toString(), { method: 'GET' }));
      if (!page.ok || !(page.headers.get('content-type')||'').includes('text/html'))
        return new Response('Application shell unavailable', { status: 503 });
      const headers = new Headers(page.headers);
      headers.set('cache-control', 'no-store');
      headers.delete('content-length');
      return new Response(request.method === 'HEAD' ? null : page.body, { status: 200, headers });
    }

    const socialPage = await socialPageResponse(request, env, url);
    if (socialPage) return socialPage;

    if (url.pathname === '/api/launch-readiness') {
      const response = await handleLaunchReadinessRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/phone-verification')) {
      const response = await handlePhoneVerificationRequest(request, env, url);
      if (response) return response;
    }

    // Twilio inbound messaging (STOP/START opt-outs) — signature-verified, no session.
    if (url.pathname === '/api/webhooks/twilio/messaging') {
      return handleTwilioMessagingWebhook(request, env);
    }

    // TikTok posting has its own verified-session + OAuth-state gates inside
    // the module (the OAuth callback is a cross-site top-level redirect).
    if (url.pathname.startsWith('/api/tiktok')) {
      const response = await handleTikTokRequest(request, env, url);
      if (response) return response;
    }

    // Token purchase/webhook/calibration has its own verified-member and Stripe-signature gates.
    if (url.pathname.startsWith('/api/tokens')) {
      const response = await handleO2OLTokenRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/token-admin')) {
      const gate = await enforceAdminMfa(request, env);
      if (gate) return gate;
      const response = await handleTokenAdminRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/date-idea-library')) return handleDateIdeaLibraryRequest(request,env,url);

    if (url.pathname.startsWith('/api/love-note-library')) {
      return handleLoveNoteLibraryRequest(request,env,url);
    }

    const identityGate = await enforceLaunchIdentity(request, env, url);
    if (identityGate) return identityGate;

    const entitlementGate = await enforceApiEntitlement(request, env, url);
    if (entitlementGate) return entitlementGate;

    if (url.pathname.startsWith('/api/like-minded')) {
      const response = await handleLikeMindedRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/games/')) {
      const response = await handleGameAccessRequest(request, env, url);
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

    if (url.pathname === '/api/feature-usage' || url.pathname === '/api/interaction-events') {
      const response = await handleFeatureUsageRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname === '/api/site-presence/ping') {
      const response = await handlePresencePing(request, env);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/mymatchiq/credits')) {
      const response = await handleMyMatchIQCreditsRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/mymatchiq/members')) {
      const response = await handleMyMatchIQMembersRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/mymatchiq/legacy')) {
      const response = await handleMyMatchIQLegacyRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname === '/api/mymatchiq/access' || url.pathname.startsWith('/api/mymatchiq/bianca') || url.pathname.startsWith('/api/mymatchiq/assessment')) {
      const response = await handleMyMatchIQAiRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/mymatchiq/')) {
      const response = await handleMyMatchIQCoreRequest(request, env, url);
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

    if (url.pathname.startsWith('/api/voting')) {
      const response = await handleVotingRequest(request, env, url);
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
    if(new Date(controller.scheduledTime || Date.now()).getUTCMinutes()%5===0){
      ctx.waitUntil(sendProductionSiteHealth(env).catch(()=>console.error('O2OL production health report delivery failed')));
    }
    return baseWorker.scheduled(controller, env, ctx);
  },
};
