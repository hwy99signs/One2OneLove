import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_ROUTES = new Set([
  '/', '/home', '/aboutus', '/signin', '/login', '/signup', '/forgotpassword',
  '/invite', '/helpcenter', '/contactus', '/privacypolicy', '/termsofservice',
  '/reviews', '/leavereview', '/suggestions', '/subscription',
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

const PREVIEW_READ_ONLY_COPY = {
  en: { title: '24-Hour Guest Preview — View Only', body: 'You can look through One2OneLove, but features cannot be used during the Guest Preview.', action: 'Start 7-Day Full Access Trial' },
  es: { title: 'Vista Previa de 24 Horas — Solo Lectura', body: 'Puedes ver One2OneLove, pero no puedes usar las funciones durante la Vista Previa.', action: 'Iniciar Prueba de Acceso Completo de 7 Días' },
  fr: { title: 'Aperçu Invité de 24 Heures — Consultation Uniquement', body: 'Vous pouvez parcourir One2OneLove, mais les fonctionnalités ne peuvent pas être utilisées pendant l’Aperçu Invité.', action: 'Commencer l’Essai Accès Complet de 7 Jours' },
  it: { title: 'Anteprima Ospite di 24 Ore — Solo Visualizzazione', body: 'Puoi visualizzare One2OneLove, ma non puoi usare le funzioni durante l’Anteprima Ospite.', action: 'Inizia la Prova di Accesso Completo di 7 Giorni' },
  de: { title: '24-Stunden-Gastvorschau — Nur Ansehen', body: 'Sie können One2OneLove ansehen, Funktionen können während der Gastvorschau jedoch nicht verwendet werden.', action: '7-Tage-Vollzugriff Starten' },
};

function PreviewReadOnly({ children }) {
  const language = preferredLanguage();
  const copy = PREVIEW_READ_ONLY_COPY[language] || PREVIEW_READ_ONLY_COPY.en;
  return (
    <div className="relative">
      <div className="sticky top-0 z-[70] border-b border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-amber-950">{copy.title}</p>
            <p className="text-sm text-amber-900">{copy.body}</p>
          </div>
          <a href="/Subscription" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800">
            {copy.action}
          </a>
        </div>
      </div>
      <div className="pointer-events-none select-text" aria-label={copy.title}>
        {children}
      </div>
    </div>
  );
}

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

  if (!isAuthenticated || !user) return <Navigate to="/SignIn" replace />;
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
  if (guestPreview) return <PreviewReadOnly>{children}</PreviewReadOnly>;
  if (status === 'trial' || status === 'trialing') return children;

  const required = REQUIRED_PLAN[route];
  if (!required) return children;

  const current = currentPlanFor(user);
  if ((PLAN_LEVEL[current] || 0) < (PLAN_LEVEL[required] || 0)) {
    return <Navigate to={`/Subscription?required=${encodeURIComponent(required)}`} replace />;
  }

  return children;
}
