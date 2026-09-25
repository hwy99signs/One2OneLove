import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_ROUTES = new Set([
  '/', '/home', '/aboutus', '/signin', '/login', '/signup', '/forgotpassword',
  '/invite', '/helpcenter', '/contactus', '/privacypolicy', '/termsofservice',
  '/reviews', '/leavereview', '/suggestions', '/subscription',
  '/professionalsignup', '/therapistsignup', '/influencersignup',
]);

const PLAN_LEVEL = {
  Premiere: 1,
  Premier: 1,
  Exclusive: 2,
};

const REQUIRED_PLAN = {
  '/memorylane': 'Premiere',
  '/lovenotes': 'Premiere',
  '/lovelanguagequiz': 'Premiere',
  '/dateideas': 'Premiere',
  '/profile': 'Premiere',
  '/relationshipquizzes': 'Premiere',
  '/anniversarytracker': 'Premiere',
  '/dashboard': 'Premiere',
  '/community': 'Premiere',
  '/chat': 'Premiere',
  '/podcastssupport': 'Premiere',
  '/relationshipmilestones': 'Premiere',
  '/relationshipgoals': 'Premiere',
  '/communicationpractice': 'Premiere',
  '/coupleactivities': 'Premiere',
  '/cooperativegames': 'Premiere',
  '/whatshouldtheydo': 'Premiere',
  '/games': 'Premiere',
  '/scratchgame': 'Premiere',
  '/sharedjournals': 'Premiere',
  '/couplescalendar': 'Premiere',
  '/lgbtqsupport': 'Premiere',
  '/couplesupport': 'Exclusive',
  '/articlessupport': 'Exclusive',
  '/couplesprofile': 'Exclusive',
  '/couplesdashboard': 'Exclusive',
};

const LOADING_COPY = {
  en: 'Loading your One2OneLove access…',
  es: 'Cargando tu acceso a One2OneLove…',
  fr: 'Chargement de votre accès One2OneLove…',
  it: 'Caricamento del tuo accesso One2OneLove…',
  de: 'Ihr One2OneLove-Zugang wird geladen…',
};

const PREVIEW_MS = 24 * 60 * 60 * 1000;

function previewActive(user) {
  if (user?.stripe_subscription_id) return false;
  const created = user?.created_at ? new Date(user.created_at) : null;
  return Boolean(created && !Number.isNaN(created.getTime()) && created.getTime() + PREVIEW_MS > Date.now());
}

function currentPlanFor(user) {
  const status = String(user?.subscription_status || '').toLowerCase();
  if (status === 'trial' || status === 'trialing') return 'Exclusive';
  const stored = String(user?.subscription_plan || 'Premiere');
  if (stored.toLowerCase() === 'exclusive') return 'Exclusive';
  return 'Premiere';
}

function preferredLanguage() {
  try {
    const value = localStorage.getItem('preferredLanguage') || 'en';
    return LOADING_COPY[value] ? value : 'en';
  } catch (_) {
    return 'en';
  }
}

export default function LaunchAccessGate({ pathname, children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const route = String(pathname || '/').toLowerCase().replace(/\/$/, '') || '/';

  const isPublicRoute = PUBLIC_ROUTES.has(route);

  if (isLoading && !isPublicRoute) {
    const language = preferredLanguage();
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-600">{LOADING_COPY[language]}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return isPublicRoute ? children : <Navigate to="/SignIn" replace />;
  }

  const guestPreviewForPublicRoute = previewActive(user);
  const previewSetupRoute = ['/subscription', '/signin', '/login', '/signup', '/forgotpassword'].includes(route);
  if (isPublicRoute) {
    if (guestPreviewForPublicRoute && !previewSetupRoute) return children;
    return children;
  }

  if (route === '/verifyphone') return children;

  const phoneRequired = user.phone_verification_required === true;
  const phoneVerified = user.phoneNumberVerified === true || user.phone_number_verified === true;
  if (phoneRequired && !phoneVerified) return <Navigate to="/VerifyPhone" replace />;

  const role = String(user.role || '').toLowerCase();
  if (role === 'admin') return children;

  if (route === '/subscription' || route === '/payment-success') return children;
  if (route === '/sendcredits') return <Navigate to="/Subscription" replace />;

  const status = String(user.subscription_status || '').toLowerCase();
  const hasStripeSubscription = Boolean(user.stripe_subscription_id);
  const guestPreview = previewActive(user);

  if (!guestPreview && (!['active', 'trial', 'trialing'].includes(status) || !hasStripeSubscription)) {
    return <Navigate to="/Subscription?setup=required" replace />;
  }

  // Guest Preview is strictly view-only. Trial members may use the platform.
  if (guestPreview) return children;
  if (status === 'trial' || status === 'trialing') return children;

  const required = REQUIRED_PLAN[route];
  if (!required) return children;

  const current = currentPlanFor(user);
  if ((PLAN_LEVEL[current] || 0) < (PLAN_LEVEL[required] || 0)) {
    return <Navigate to={`/Subscription?required=${encodeURIComponent(required)}`} replace />;
  }

  return children;
}
