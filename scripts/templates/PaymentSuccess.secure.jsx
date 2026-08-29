import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock3, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSubscription } from '@/lib/stripeService';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    checkingTitle: 'Confirming Your Membership', checking: 'We are confirming your subscription from Stripe’s verified server event. This page does not activate a plan by itself.', confirmedTitle: 'Membership Confirmed', confirmed: 'Your paid One2OneLove membership is active.', pendingTitle: 'Confirmation Still Processing', pending: 'Stripe returned you to One2OneLove, but the verified subscription update has not appeared on your account yet. Your access will change only after server confirmation.', signedOutTitle: 'Sign In to Confirm Membership', signedOut: 'Sign in with the account used for checkout so One2OneLove can display the subscription recorded for that account.', plan: 'Active plan', status: 'Status', subscription: 'View Membership', signIn: 'Sign In', home: 'Back to Home', security: 'Paid access is controlled by verified Stripe webhook events—not by the browser redirect.' },
  es: {
    checkingTitle: 'Confirmando Tu Membresía', checking: 'Estamos confirmando tu suscripción mediante el evento verificado del servidor de Stripe. Esta página no activa un plan por sí sola.', confirmedTitle: 'Membresía Confirmada', confirmed: 'Tu membresía de pago de One2OneLove está activa.', pendingTitle: 'Confirmación Aún en Proceso', pending: 'Stripe te devolvió a One2OneLove, pero la actualización verificada de la suscripción aún no aparece en tu cuenta. El acceso solo cambiará después de la confirmación del servidor.', signedOutTitle: 'Inicia Sesión para Confirmar la Membresía', signedOut: 'Inicia sesión con la cuenta utilizada para el pago para mostrar la suscripción registrada para esa cuenta.', plan: 'Plan activo', status: 'Estado', subscription: 'Ver Membresía', signIn: 'Iniciar Sesión', home: 'Volver al Inicio', security: 'El acceso de pago se controla mediante eventos webhook verificados de Stripe, no por la redirección del navegador.' },
  fr: {
    checkingTitle: 'Confirmation de Votre Adhésion', checking: 'Nous confirmons votre abonnement à partir de l’événement serveur Stripe vérifié. Cette page n’active aucun forfait par elle-même.', confirmedTitle: 'Adhésion Confirmée', confirmed: 'Votre adhésion One2OneLove payante est active.', pendingTitle: 'Confirmation Toujours en Cours', pending: 'Stripe vous a renvoyé vers One2OneLove, mais la mise à jour vérifiée de l’abonnement n’apparaît pas encore sur votre compte. Votre accès ne changera qu’après confirmation serveur.', signedOutTitle: 'Connectez-vous pour Confirmer l’Adhésion', signedOut: 'Connectez-vous avec le compte utilisé lors du paiement afin d’afficher l’abonnement enregistré pour ce compte.', plan: 'Forfait actif', status: 'Statut', subscription: 'Voir l’Adhésion', signIn: 'Se Connecter', home: 'Retour à l’Accueil', security: 'L’accès payant est contrôlé par des webhooks Stripe vérifiés, et non par la redirection du navigateur.' },
  it: {
    checkingTitle: 'Conferma della Tua Iscrizione', checking: 'Stiamo confermando l’abbonamento tramite l’evento server verificato di Stripe. Questa pagina non attiva alcun piano da sola.', confirmedTitle: 'Iscrizione Confermata', confirmed: 'La tua iscrizione One2OneLove a pagamento è attiva.', pendingTitle: 'Conferma Ancora in Elaborazione', pending: 'Stripe ti ha riportato a One2OneLove, ma l’aggiornamento verificato dell’abbonamento non è ancora presente nel tuo account. L’accesso cambierà solo dopo la conferma del server.', signedOutTitle: 'Accedi per Confermare l’Iscrizione', signedOut: 'Accedi con l’account usato per il checkout per visualizzare l’abbonamento registrato per quell’account.', plan: 'Piano attivo', status: 'Stato', subscription: 'Vedi Iscrizione', signIn: 'Accedi', home: 'Torna alla Home', security: 'L’accesso a pagamento è controllato da webhook Stripe verificati, non dal reindirizzamento del browser.' },
  de: {
    checkingTitle: 'Mitgliedschaft Wird Bestätigt', checking: 'Wir bestätigen dein Abonnement anhand des verifizierten Stripe-Serverereignisses. Diese Seite aktiviert keinen Tarif selbst.', confirmedTitle: 'Mitgliedschaft Bestätigt', confirmed: 'Deine kostenpflichtige One2OneLove-Mitgliedschaft ist aktiv.', pendingTitle: 'Bestätigung Wird Noch Verarbeitet', pending: 'Stripe hat dich zu One2OneLove zurückgeleitet, aber die verifizierte Abonnementaktualisierung ist noch nicht in deinem Konto angekommen. Dein Zugang ändert sich erst nach Serverbestätigung.', signedOutTitle: 'Zur Bestätigung der Mitgliedschaft Anmelden', signedOut: 'Melde dich mit dem Konto an, das du beim Checkout verwendet hast, damit One2OneLove das für dieses Konto gespeicherte Abonnement anzeigen kann.', plan: 'Aktiver Tarif', status: 'Status', subscription: 'Mitgliedschaft Anzeigen', signIn: 'Anmelden', home: 'Zurück zur Startseite', security: 'Kostenpflichtiger Zugang wird durch verifizierte Stripe-Webhooks gesteuert, nicht durch die Browser-Weiterleitung.' },
};

const isPaidActive = (subscription) =>
  ['Premiere', 'Exclusive'].includes(subscription?.subscription_plan) &&
  ['active', 'trialing'].includes(subscription?.subscription_status);

export default function PaymentSuccess() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState(user ? 'checking' : 'signedOut');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setState('signedOut');
      return undefined;
    }

    let active = true;
    let timer;
    let attempt = 0;
    const maxAttempts = searchParams.get('session_id') ? 6 : 2;

    const check = async () => {
      attempt += 1;
      const current = await getUserSubscription();
      if (!active) return;
      setSubscription(current);

      if (isPaidActive(current)) {
        setState('confirmed');
        return;
      }

      if (attempt >= maxAttempts) {
        setState('pending');
        return;
      }

      timer = window.setTimeout(check, 1500);
    };

    setState('checking');
    check();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [searchParams, user?.id]);

  const content = state === 'confirmed'
    ? { title: t.confirmedTitle, copy: t.confirmed, icon: CheckCircle, iconClass: 'text-green-600', iconBg: 'bg-green-100' }
    : state === 'pending'
      ? { title: t.pendingTitle, copy: t.pending, icon: Clock3, iconClass: 'text-amber-600', iconBg: 'bg-amber-100' }
      : state === 'signedOut'
        ? { title: t.signedOutTitle, copy: t.signedOut, icon: ShieldCheck, iconClass: 'text-blue-600', iconBg: 'bg-blue-100' }
        : { title: t.checkingTitle, copy: t.checking, icon: Loader2, iconClass: 'animate-spin text-purple-600', iconBg: 'bg-purple-100' };

  const Icon = content.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-4 py-12">
      <Card className="w-full max-w-2xl border-2 border-white/70 bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${content.iconBg}`}>
            <Icon className={`h-11 w-11 ${content.iconClass}`} aria-hidden="true" />
          </div>
          <CardTitle className="mt-5 text-3xl text-gray-900">{content.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mx-auto max-w-xl text-base leading-7 text-gray-600">{content.copy}</p>

          {state === 'confirmed' && subscription && (
            <div className="mx-auto mt-6 grid max-w-md gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left sm:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.plan}</p><p className="mt-1 font-bold text-gray-900">{subscription.subscription_plan}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.status}</p><p className="mt-1 font-bold text-green-700">{subscription.subscription_status}</p></div>
            </div>
          )}

          <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left text-sm leading-6 text-blue-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{t.security}</p>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {state === 'signedOut' ? <Button asChild><Link to="/SignIn">{t.signIn}</Link></Button> : <Button asChild><Link to="/Subscription">{t.subscription}</Link></Button>}
            <Button asChild variant="outline"><Link to="/">{t.home}</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
