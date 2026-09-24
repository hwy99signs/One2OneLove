import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_ROUTES = new Set([
  '/', '/home', '/aboutus', '/signin', '/login', '/signup', '/forgotpassword',
  '/invite', '/helpcenter', '/contactus', '/privacypolicy', '/termsofservice',
  '/reviews', '/leavereview', '/suggestions',
]);

const PLAN_LEVEL = {
  Basic: 1,
  Premiere: 2,
  Premier: 2,
  Exclusive: 3,
};

const REQUIRED_PLAN = {
  '/memorylane': 'Basic',
  '/lovenotes': 'Basic',
  '/sendcredits': 'Basic',
  '/lovelanguagequiz': 'Basic',
  '/dateideas': 'Basic',
  '/profile': 'Basic',
  '/relationshipquizzes': 'Basic',
  '/anniversarytracker': 'Basic',
  '/dashboard': 'Basic',
  '/community': 'Basic',
  '/chat': 'Basic',

  '/podcastssupport': 'Premier',
  '/relationshipmilestones': 'Premier',
  '/relationshipgoals': 'Premier',
  '/communicationpractice': 'Premier',
  '/coupleactivities': 'Premier',
  '/cooperativegames': 'Premier',
  '/whatshouldtheydo': 'Premier',
  '/games': 'Premier',
  '/scratchgame': 'Premier',
  '/sharedjournals': 'Premier',
  '/couplescalendar': 'Premier',
  '/lgbtqsupport': 'Premier',

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

function currentPlanFor(user) {
  const status = String(user?.subscription_status || '').toLowerCase();
  if (status === 'trial' || status === 'trialing') return 'Exclusive';
  const stored = String(user?.subscription_plan || 'Basic');
  if (stored.toLowerCase() === 'basic') return 'Basic';
  if (stored.toLowerCase() === 'premier' || stored.toLowerCase() === 'premiere') return 'Premier';
  if (stored.toLowerCase() === 'exclusive') return 'Exclusive';
  return 'Basic';
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

  if (PUBLIC_ROUTES.has(route)) return children;

  if (isLoading) {
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
    return <Navigate to="/SignIn" replace />;
  }

  if (route === '/verifyphone') return children;

  const phoneRequired = user.phone_verification_required === true;
  const phoneVerified = user.phoneNumberVerified === true || user.phone_number_verified === true;
  if (phoneRequired && !phoneVerified) {
    return <Navigate to="/VerifyPhone" replace />;
  }

  const role = String(user.role || '').toLowerCase();
  if (role === 'admin') return children;

  if (route === '/subscription' || route === '/payment-success') return children;

  const status = String(user.subscription_status || '').toLowerCase();
  const hasStripeSubscription = Boolean(user.stripe_subscription_id);
  if (!['active', 'trial', 'trialing'].includes(status) || !hasStripeSubscription) {
    return <Navigate to="/Subscription?setup=required" replace />;
  }

  const required = REQUIRED_PLAN[route];
  if (!required) return children;

  const current = currentPlanFor(user);
  if ((PLAN_LEVEL[current] || 0) < (PLAN_LEVEL[required] || 0)) {
    return <Navigate to={`/Subscription?required=${encodeURIComponent(required)}`} replace />;
  }

  return children;
}
