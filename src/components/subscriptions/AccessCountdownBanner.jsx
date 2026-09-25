import React, { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSubscription } from '@/lib/stripeService';
import { useQuery } from '@tanstack/react-query';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const COPY = {
  en: { guest: 'Guest Preview — View Only', trial: 'Full Access Trial', ends: 'remaining', action: 'View Subscription' },
  es: { guest: 'Vista Previa — Solo Ver', trial: 'Prueba de Acceso Completo', ends: 'restantes', action: 'Ver Suscripción' },
  fr: { guest: 'Aperçu Invité — Consultation Uniquement', trial: 'Essai Accès Complet', ends: 'restant', action: 'Voir l’Abonnement' },
  it: { guest: 'Anteprima Ospite — Solo Visualizzazione', trial: 'Prova Accesso Completo', ends: 'rimanenti', action: 'Vedi Abbonamento' },
  de: { guest: 'Gastvorschau — Nur Ansehen', trial: 'Vollzugriff-Test', ends: 'verbleibend', action: 'Abonnement Anzeigen' },
};

function language() {
  try {
    const value = localStorage.getItem('preferredLanguage') || 'en';
    return COPY[value] ? value : 'en';
  } catch (_) {
    return 'en';
  }
}

function formatRemaining(ms, includeDays) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return includeDays ? `${days}d ${hh}:${mm}:${ss}` : `${String(Math.floor(totalSeconds / 3600)).padStart(2, '0')}:${mm}:${ss}`;
}

export default function AccessCountdownBanner() {
  const { user, isAuthenticated } = useAuth();
  const [now, setNow] = useState(Date.now());
  const lang = language();
  const t = COPY[lang];

  const { data: subscription, refetch } = useQuery({
    queryKey: ['accessCountdownSubscription', user?.id],
    queryFn: getUserSubscription,
    enabled: Boolean(isAuthenticated && user?.id),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, user?.id]);

  const state = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    if (String(user.role || '').toLowerCase() === 'admin') return null;

    const status = String(subscription?.subscription_status || user.subscription_status || '').toLowerCase();
    if (status === 'trial' || status === 'trialing') {
      const trialEnd = subscription?.trial_end_date ? new Date(subscription.trial_end_date).getTime() : NaN;
      if (!Number.isFinite(trialEnd)) return null;
      return { type: 'trial', label: t.trial, end: trialEnd, includeDays: true };
    }

    const hasStripeSubscription = Boolean(subscription?.stripe_subscription_id || user.stripe_subscription_id);
    if (hasStripeSubscription) return null;

    const createdRaw = subscription?.created_at || user.created_at;
    const created = createdRaw ? new Date(createdRaw).getTime() : NaN;
    if (!Number.isFinite(created)) return null;
    const end = created + DAY;
    return { type: 'guest', label: t.guest, end, includeDays: false };
  }, [isAuthenticated, user, subscription, t.guest, t.trial]);

  useEffect(() => {
    if (!state || now < state.end) return;
    if (state.type === 'guest') {
      window.location.assign('/Subscription?setup=required');
      return;
    }
    refetch().finally(() => {
      window.setTimeout(() => window.location.assign('/Subscription'), 500);
    });
  }, [state, now, refetch]);

  if (!state) return null;

  const remaining = state.end - now;
  if (remaining <= 0) return null;

  return (
    <div className="sticky top-0 z-[80] border-b border-pink-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm font-semibold text-gray-800">
        <span className="inline-flex items-center gap-1.5 text-pink-700">
          <Clock3 className="h-4 w-4" />
          {state.label}
        </span>
        <span className="font-mono text-base font-black tabular-nums text-purple-700">
          {formatRemaining(remaining, state.includeDays)}
        </span>
        <span className="text-gray-500">{t.ends}</span>
        <button
          type="button"
          onClick={() => window.location.assign('/Subscription')}
          className="font-bold text-purple-700 underline underline-offset-2 hover:text-purple-900"
        >
          {t.action}
        </button>
      </div>
    </div>
  );
}
