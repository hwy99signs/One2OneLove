import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_ROUTES = new Set([
  '/', '/home', '/aboutus', '/signin', '/login', '/signup', '/forgotpassword',
  '/invite', '/helpcenter', '/contactus', '/privacypolicy', '/termsofservice',
  '/reviews', '/leavereview', '/suggestions',
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

const PREVIEW_COPY = {
  en: { label: '24-Hour Guest Preview', remaining: 'Time remaining', action: 'Start 7-Day Trial' },
  es: { label: 'Vista Previa de Invitado de 24 Horas', remaining: 'Tiempo restante', action: 'Iniciar Prueba de 7 Días' },
  fr: { label: 'Aperçu Invité de 24 Heures', remaining: 'Temps restant', action: 'Commencer l’Essai de 7 Jours' },
  it: { label: 'Anteprima Ospite di 24 Ore', remaining: 'Tempo rimanente', action: 'Inizia la Prova di 7 Giorni' },
  de: { label: '24-Stunden-Gastvorschau', remaining: 'Verbleibende Zeit', action: '7-Tage-Test Starten' },
};

const PREVIEW_MS = 24 * 60 * 60 * 1000;

function previewRemainingMs(user, now = Date.now()) {
  if (user?.stripe_subscription_id) return 0;
  const created = user?.created_at ? new Date(user.created_at) : null;
  if (!created || Number.isNaN(created.getTime())) return 0;
  return Math.max(0, created.getTime() + PREVIEW_MS - now);
}

function previewActive(user) {
  return previewRemainingMs(user) > 0;
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

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

function PreviewCountdown({ user }) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(() => previewRemainingMs(user));
  const language = preferredLanguage();
  const copy = PREVIEW_COPY[language] || PREVIEW_COPY.en;

  useEffect(() => {
    const update = () => {
      const next = previewRemainingMs(user);
      setRemaining(next);
      if (next <= 0) navigate('/Subscription?setup=required', { replace: true });
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [user?.created_at, user?.stripe_subscription_id, navigate]);

  if (remaining <= 0) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-pink-300 bg-gradient-to-r from-pink-600 to-purple-700 px-3 py-2 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm font-semibold">
        <span>{copy.label}</span>
        <span className="rounded-md bg-white/15 px-2 py-1 font-mono text-base tracking-wide">
          {copy.remaining}: {formatRemaining(remaining)}
        </span>
        <button
          type="button"
          onClick={() => navigate('/Subscription')}
          className="rounded-md bg-white px-3 py-1 font-bold text-purple-700 transition hover:bg-pink-50"
        >
          {copy.action}
        </button>
      </div>
    </div>
  );
}

function withPreviewTimer(children, user) {
  if (!previewActive(user)) return children;
  return (
    <>
      <PreviewCountdown user={user} />
      {children}
    </>
  );
}

export default function LaunchAccessGate({ pathname, children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const route = String(pathname || '/').toLowerCase().replace(/\/$/, '') || '/';

  if (PUBLIC_ROUTES.has(route)) {
    return isAuthenticated && user ? withPreviewTimer(children, user) : children;
  }

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

  if (!isAuthenticated || !user) return <Navigate to="/SignIn" replace />;
  if (route === '/verifyphone') return children;

  const phoneRequired = user.phone_verification_required === true;
  const phoneVerified = user.phoneNumberVerified === true || user.phone_number_verified === true;
  if (phoneRequired && !phoneVerified) return <Navigate to="/VerifyPhone" replace />;

  const role = String(user.role || '').toLowerCase();
  if (role === 'admin') return children;

  if (route === '/subscription' || route === '/payment-success') return withPreviewTimer(children, user);
  if (route === '/sendcredits') return <Navigate to="/Subscription" replace />;

  const status = String(user.subscription_status || '').toLowerCase();
  const hasStripeSubscription = Boolean(user.stripe_subscription_id);
  const guestPreview = previewActive(user);

  if (!guestPreview && (!['active', 'trial', 'trialing'].includes(status) || !hasStripeSubscription)) {
    return <Navigate to="/Subscription?setup=required" replace />;
  }

  // The 24-hour Guest Preview and the 7-day trial can explore all plan surfaces.
  // SMS Love Note sending is separately blocked server-side until the first paid invoice succeeds.
  if (guestPreview) return withPreviewTimer(children, user);
  if (status === 'trial' || status === 'trialing') return children;

  const required = REQUIRED_PLAN[route];
  if (!required) return children;

  const current = currentPlanFor(user);
  if ((PLAN_LEVEL[current] || 0) < (PLAN_LEVEL[required] || 0)) {
    return <Navigate to={`/Subscription?required=${encodeURIComponent(required)}`} replace />;
  }

  return children;
}
