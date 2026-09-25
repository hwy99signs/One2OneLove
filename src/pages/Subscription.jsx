import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { Crown, Sparkles, CheckCircle, ArrowRight, CreditCard, Clock3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TierCard from '@/components/subscriptions/TierCard';
import { getUserSubscription, getPaymentHistory, startPremierTrial } from '@/lib/stripeService';
import { toast } from 'sonner';
import { subscriptionPlanCopy } from '@/data/subscriptionPlanCopy';

const translations = {
  en: {
    choosePlan: 'Compare One2OneLove Plans', subtitle: 'Two simple plans for building, growing, and supporting your relationship',
    currentlyOn: 'Current access', planWord: '', currentSubscription: 'Your Current Subscription', plan: 'Plan', status: 'Status', renewsOn: 'Renews On', notAvailable: 'N/A',
    cancelNotice: 'Your subscription will end at the close of the current billing period. Love Note charges already incurred remain due.',
    paymentHistory: 'Payment History', recentTransactions: 'Your recent transactions', date: 'Date', amount: 'Amount',
    questions: 'Have questions about our plans or billing?', contactSupport: 'Contact Support', loadError: 'Failed to load subscription information',
    trialStartError: 'Unable to start the 7-day Full Access trial.',
    statuses: { active: 'Active', trial: 'Trial', trialing: 'Trial', succeeded: 'Succeeded', failed: 'Failed', pending: 'Pending', cancelled: 'Cancelled', inactive: 'Inactive' },
    labels: { mostPopular: 'MOST POPULAR', month: 'month', pricingPending: 'Pricing unavailable', pricingPendingButton: 'Unavailable', processing: 'Processing...', selected: 'Selected', choose: 'Choose', paymentFailed: 'Failed to process payment', redirecting: 'Redirecting to Stripe checkout...', planUpdated: 'Plan updated. Your 7-day Full Access trial continues.', genericError: 'An error occurred. Please try again.' }
  },
  es: {
    choosePlan: 'Compara los Planes de One2OneLove', subtitle: 'Dos planes simples para construir, fortalecer y apoyar tu relación',
    currentlyOn: 'Acceso actual', planWord: '', currentSubscription: 'Tu Suscripción Actual', plan: 'Plan', status: 'Estado', renewsOn: 'Se Renueva El', notAvailable: 'N/D',
    cancelNotice: 'Tu suscripción terminará al final del período de facturación actual. Los cargos por Notas de Amor ya realizados siguen siendo pagaderos.',
    paymentHistory: 'Historial de Pagos', recentTransactions: 'Tus transacciones recientes', date: 'Fecha', amount: 'Monto',
    questions: '¿Tienes preguntas sobre nuestros planes o facturación?', contactSupport: 'Contactar Soporte', loadError: 'No se pudo cargar la información de la suscripción',
    trialStartError: 'No se pudo iniciar la prueba de Acceso Completo de 7 días.',
    statuses: { active: 'Activo', trial: 'Prueba', trialing: 'Prueba', succeeded: 'Completado', failed: 'Fallido', pending: 'Pendiente', cancelled: 'Cancelado', inactive: 'Inactivo' },
    labels: { mostPopular: 'MÁS POPULAR', month: 'mes', pricingPending: 'Precio no disponible', pricingPendingButton: 'No disponible', processing: 'Procesando...', selected: 'Seleccionado', choose: 'Elegir', paymentFailed: 'No se pudo procesar el pago', redirecting: 'Redirigiendo al pago de Stripe...', planUpdated: 'Plan actualizado. Tu prueba de Acceso Completo de 7 días continúa.', genericError: 'Ocurrió un error. Inténtalo de nuevo.' }
  },
  fr: {
    choosePlan: 'Comparez les Formules One2OneLove', subtitle: 'Deux formules simples pour construire, faire grandir et soutenir votre relation',
    currentlyOn: 'Accès actuel', planWord: '', currentSubscription: 'Votre Abonnement Actuel', plan: 'Formule', status: 'Statut', renewsOn: 'Renouvellement Le', notAvailable: 'N/D',
    cancelNotice: 'Votre abonnement prendra fin à la fin de la période de facturation en cours. Les frais de Notes d’Amour déjà engagés restent dus.',
    paymentHistory: 'Historique des Paiements', recentTransactions: 'Vos transactions récentes', date: 'Date', amount: 'Montant',
    questions: 'Des questions sur nos formules ou la facturation ?', contactSupport: 'Contacter le Support', loadError: 'Impossible de charger les informations d’abonnement',
    trialStartError: 'Impossible de démarrer l’essai Accès Complet de 7 jours.',
    statuses: { active: 'Actif', trial: 'Essai', trialing: 'Essai', succeeded: 'Réussi', failed: 'Échoué', pending: 'En attente', cancelled: 'Résilié', inactive: 'Inactif' },
    labels: { mostPopular: 'LE PLUS POPULAIRE', month: 'mois', pricingPending: 'Tarif indisponible', pricingPendingButton: 'Indisponible', processing: 'Traitement...', selected: 'Sélectionné', choose: 'Choisir', paymentFailed: 'Échec du traitement du paiement', redirecting: 'Redirection vers Stripe...', planUpdated: 'Formule mise à jour. Votre essai Accès Complet de 7 jours continue.', genericError: 'Une erreur s’est produite. Veuillez réessayer.' }
  },
  it: {
    choosePlan: 'Confronta i Piani One2OneLove', subtitle: 'Due piani semplici per costruire, far crescere e sostenere la relazione',
    currentlyOn: 'Accesso attuale', planWord: '', currentSubscription: 'Il Tuo Abbonamento Attuale', plan: 'Piano', status: 'Stato', renewsOn: 'Rinnovo Il', notAvailable: 'N/D',
    cancelNotice: 'L’abbonamento terminerà alla fine del periodo di fatturazione corrente. Gli addebiti per Note d’Amore già effettuati restano dovuti.',
    paymentHistory: 'Cronologia Pagamenti', recentTransactions: 'Le tue transazioni recenti', date: 'Data', amount: 'Importo',
    questions: 'Hai domande sui piani o sulla fatturazione?', contactSupport: 'Contatta il Supporto', loadError: 'Impossibile caricare le informazioni sull’abbonamento',
    trialStartError: 'Impossibile avviare la prova di Accesso Completo di 7 giorni.',
    statuses: { active: 'Attivo', trial: 'Prova', trialing: 'Prova', succeeded: 'Riuscito', failed: 'Fallito', pending: 'In sospeso', cancelled: 'Annullato', inactive: 'Inattivo' },
    labels: { mostPopular: 'PIÙ POPOLARE', month: 'mese', pricingPending: 'Prezzo non disponibile', pricingPendingButton: 'Non disponibile', processing: 'Elaborazione...', selected: 'Selezionato', choose: 'Scegli', paymentFailed: 'Impossibile elaborare il pagamento', redirecting: 'Reindirizzamento a Stripe...', planUpdated: 'Piano aggiornato. La prova di Accesso Completo di 7 giorni continua.', genericError: 'Si è verificato un errore. Riprova.' }
  },
  de: {
    choosePlan: 'One2OneLove-Pläne Vergleichen', subtitle: 'Zwei einfache Pläne zum Aufbau, Wachstum und zur Unterstützung Ihrer Beziehung',
    currentlyOn: 'Aktueller Zugang', planWord: '', currentSubscription: 'Ihr Aktuelles Abonnement', plan: 'Plan', status: 'Status', renewsOn: 'Verlängert Am', notAvailable: 'k. A.',
    cancelNotice: 'Ihr Abonnement endet zum Ende des laufenden Abrechnungszeitraums. Bereits entstandene Gebühren für Liebesnachrichten bleiben fällig.',
    paymentHistory: 'Zahlungsverlauf', recentTransactions: 'Ihre letzten Transaktionen', date: 'Datum', amount: 'Betrag',
    questions: 'Fragen zu unseren Plänen oder zur Abrechnung?', contactSupport: 'Support Kontaktieren', loadError: 'Abonnementinformationen konnten nicht geladen werden',
    trialStartError: 'Der 7-Tage-Vollzugriff-Test konnte nicht gestartet werden.',
    statuses: { active: 'Aktiv', trial: 'Test', trialing: 'Test', succeeded: 'Erfolgreich', failed: 'Fehlgeschlagen', pending: 'Ausstehend', cancelled: 'Gekündigt', inactive: 'Inaktiv' },
    labels: { mostPopular: 'AM BELIEBTESTEN', month: 'Monat', pricingPending: 'Preis nicht verfügbar', pricingPendingButton: 'Nicht verfügbar', processing: 'Verarbeitung...', selected: 'Ausgewählt', choose: 'Wählen', paymentFailed: 'Zahlung konnte nicht verarbeitet werden', redirecting: 'Weiterleitung zu Stripe...', planUpdated: 'Plan aktualisiert. Ihr 7-Tage-Vollzugriff-Test läuft weiter.', genericError: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.' }
  },
};

const TRIAL_COPY = {
  en: { title: '7 Days of Full One2OneLove Access', body: 'Add a credit or debit card to start. You will not be charged the subscription price today. For 7 days you receive full Exclusive-level feature access. Your first One2OneLove SMS Love Note send is FREE; every additional send is US$0.29 and is billed to your payment method on file. After 7 days, your membership continues on Premiere at US$9.99/month unless you choose Exclusive or cancel before the trial ends.', start: 'Start 7-Day Full Access Trial', starting: 'Opening secure checkout...', active: 'Your 7-day Full Access trial is active. Your first One2OneLove SMS Love Note send is FREE; every additional send is US$0.29.' },
  es: { title: '7 Días de Acceso Completo a One2OneLove', body: 'Agrega una tarjeta de crédito o débito para comenzar. Hoy no se cobra el precio de la suscripción. Durante 7 días tendrás acceso completo de nivel Exclusive. Tu primer envío SMS de Nota de Amor de One2OneLove es GRATIS; cada envío adicional cuesta US$0.29 y se factura al método de pago guardado. Después de 7 días, tu membresía continúa en Premiere por US$9.99/mes, a menos que elijas Exclusive o canceles antes de que termine la prueba.', start: 'Comenzar 7 Días de Acceso Completo', starting: 'Abriendo pago seguro...', active: 'Tu prueba de Acceso Completo de 7 días está activa. Tu primer envío SMS de Nota de Amor es GRATIS; cada envío adicional cuesta US$0.29.' },
  fr: { title: '7 Jours d’Accès Complet à One2OneLove', body: 'Ajoutez une carte de crédit ou de débit pour commencer. Le prix de l’abonnement n’est pas débité aujourd’hui. Pendant 7 jours, vous bénéficiez d’un accès complet de niveau Exclusive. Votre premier envoi de Note d’Amour par SMS One2OneLove est GRATUIT ; chaque envoi supplémentaire coûte US$0.29 et est facturé au moyen de paiement enregistré. Après 7 jours, votre abonnement continue avec Premiere à US$9.99/mois, sauf si vous choisissez Exclusive ou annulez avant la fin de l’essai.', start: 'Commencer 7 Jours d’Accès Complet', starting: 'Ouverture du paiement sécurisé...', active: 'Votre essai de 7 jours avec Accès Complet est actif. Votre premier envoi SMS de Note d’Amour est GRATUIT ; chaque envoi supplémentaire coûte US$0.29.' },
  it: { title: '7 Giorni di Accesso Completo a One2OneLove', body: 'Aggiungi una carta di credito o debito per iniziare. Oggi non viene addebitato il prezzo dell’abbonamento. Per 7 giorni avrai accesso completo di livello Exclusive. Il primo invio SMS di una Nota d’Amore One2OneLove è GRATIS; ogni invio successivo costa US$0.29 e viene addebitato al metodo di pagamento registrato. Dopo 7 giorni, l’abbonamento continua con Premiere a US$9.99/mese salvo scelta di Exclusive o annullamento prima della fine della prova.', start: 'Inizia 7 Giorni di Accesso Completo', starting: 'Apertura del pagamento sicuro...', active: 'La prova di 7 giorni con Accesso Completo è attiva. Il primo invio SMS di una Nota d’Amore è GRATIS; ogni invio successivo costa US$0.29.' },
  de: { title: '7 Tage Vollzugriff auf One2OneLove', body: 'Fügen Sie zum Start eine Kredit- oder Debitkarte hinzu. Der Abonnementpreis wird heute nicht berechnet. Sie erhalten 7 Tage vollständigen Zugriff auf Exclusive-Niveau. Ihre erste One2OneLove-SMS-Liebesnachricht ist KOSTENLOS; jede weitere Sendung kostet US$0.29 und wird über die hinterlegte Zahlungsmethode abgerechnet. Nach 7 Tagen läuft Ihre Mitgliedschaft mit Premiere für US$9.99/Monat weiter, sofern Sie nicht Exclusive wählen oder vor Ende des Tests kündigen.', start: '7 Tage Vollzugriff Starten', starting: 'Sicherer Checkout wird geöffnet...', active: 'Ihr 7-Tage-Vollzugriff-Test ist aktiv. Ihre erste SMS-Liebesnachricht ist KOSTENLOS; jede weitere Sendung kostet US$0.29.' },
};


const PREVIEW_COPY = {
  en: {
    name: '24-Hour Guest Preview', badge: 'NO CARD REQUIRED', active: 'ACTIVE — VIEW ONLY', ended: 'PREVIEW ENDED', complete: 'COMPLETED', startHere: 'START HERE', signupTab: 'SIGN UP', createAccount: 'Create Account — Start 24-Hour Preview', signupForPlan: 'Create Account for',
    timer: 'Time Remaining', period: '24 hours', starts: 'Your 24-hour view-only preview begins when your account is created.',
    features: ['View One2OneLove screens and content', 'VIEW ONLY — features cannot be used', 'No credit or debit card required', 'Create an account to start the 24-hour timer'],
  },
  es: {
    name: 'Vista Previa de Invitado de 24 Horas', badge: 'NO SE REQUIERE TARJETA', active: 'ACTIVA — SOLO VER', ended: 'VISTA PREVIA FINALIZADA', complete: 'COMPLETADA', startHere: 'EMPIEZA AQUÍ', signupTab: 'REGÍSTRATE', createAccount: 'Crear Cuenta — Iniciar Vista Previa de 24 Horas', signupForPlan: 'Crear Cuenta para',
    timer: 'Tiempo Restante', period: '24 horas', starts: 'Tu vista previa de 24 horas solo para ver comienza cuando se crea tu cuenta.',
    features: ['Ver pantallas y contenido de One2OneLove', 'SOLO VER — no se pueden usar las funciones', 'No se requiere tarjeta de crédito o débito', 'Crea una cuenta para iniciar el temporizador de 24 horas'],
  },
  fr: {
    name: 'Aperçu Invité de 24 Heures', badge: 'AUCUNE CARTE REQUISE', active: 'ACTIF — CONSULTATION UNIQUEMENT', ended: 'APERÇU TERMINÉ', complete: 'TERMINÉ', startHere: 'COMMENCEZ ICI', signupTab: 'INSCRIPTION', createAccount: 'Créer un Compte — Démarrer l’Aperçu de 24 Heures', signupForPlan: 'Créer un Compte pour',
    timer: 'Temps Restant', period: '24 heures', starts: 'Votre aperçu de 24 heures en consultation uniquement commence à la création du compte.',
    features: ['Voir les écrans et contenus One2OneLove', 'CONSULTATION UNIQUEMENT — les fonctions ne peuvent pas être utilisées', 'Aucune carte bancaire requise', 'Créez un compte pour démarrer le minuteur de 24 heures'],
  },
  it: {
    name: 'Anteprima Ospite di 24 Ore', badge: 'NESSUNA CARTA RICHIESTA', active: 'ATTIVA — SOLO VISUALIZZAZIONE', ended: 'ANTEPRIMA TERMINATA', complete: 'COMPLETATA', startHere: 'INIZIA QUI', signupTab: 'REGISTRATI', createAccount: 'Crea Account — Avvia Anteprima di 24 Ore', signupForPlan: 'Crea Account per',
    timer: 'Tempo Rimanente', period: '24 ore', starts: 'L’anteprima di 24 ore solo visualizzazione inizia quando viene creato il tuo account.',
    features: ['Visualizza schermate e contenuti One2OneLove', 'SOLO VISUALIZZAZIONE — le funzioni non possono essere usate', 'Nessuna carta di credito o debito richiesta', 'Crea un account per avviare il timer di 24 ore'],
  },
  de: {
    name: '24-Stunden-Gastvorschau', badge: 'KEINE KARTE ERFORDERLICH', active: 'AKTIV — NUR ANSEHEN', ended: 'VORSCHAU BEENDET', complete: 'ABGESCHLOSSEN', startHere: 'HIER STARTEN', signupTab: 'REGISTRIEREN', createAccount: 'Konto Erstellen — 24-Stunden-Vorschau Starten', signupForPlan: 'Konto Erstellen für',
    timer: 'Verbleibende Zeit', period: '24 Stunden', starts: 'Ihre 24-Stunden-Vorschau nur zum Ansehen beginnt mit der Kontoerstellung.',
    features: ['One2OneLove-Bildschirme und Inhalte ansehen', 'NUR ANSEHEN — Funktionen können nicht verwendet werden', 'Keine Kredit- oder Debitkarte erforderlich', 'Erstellen Sie ein Konto, um den 24-Stunden-Timer zu starten'],
  },
};

function formatPreviewTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours + ':' + minutes + ':' + seconds;
}

function GuestPreviewTimer({ expiresAt, onExpire }) {
  const endMs = expiresAt ? new Date(expiresAt).getTime() : NaN;
  const [remainingMs, setRemainingMs] = useState(() => Number.isNaN(endMs) ? 0 : Math.max(0, endMs - Date.now()));

  useEffect(() => {
    if (Number.isNaN(endMs)) {
      setRemainingMs(0);
      return undefined;
    }
    let expiredNotified = false;
    const update = () => {
      const next = Math.max(0, endMs - Date.now());
      setRemainingMs(next);
      if (next === 0 && !expiredNotified) {
        expiredNotified = true;
        onExpire?.();
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endMs, onExpire]);

  return <>{formatPreviewTime(remainingMs)}</>;
}

const tierBase = {
  Premiere: { name: 'Premiere', price: 9.99, icon: '💖', gradient: 'from-purple-400 to-pink-500', popular: true, isFree: false, priceId: import.meta.env.VITE_STRIPE_PRICE_PREMIERE || 'price_1UFUSDCoKDheG1AS2AgFooh0', checkoutDisabled: false },
  Exclusive: { name: 'Exclusive', price: 19.99, icon: '👑', gradient: 'from-yellow-400 to-orange-500', popular: false, isFree: false, priceId: import.meta.env.VITE_STRIPE_PRICE_EXCLUSIVE || 'price_1UFUSKCoKDheG1ASG5zk97Ph', checkoutDisabled: false }
};

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const baseTranslation = translations[currentLanguage] || translations.en;
  const planTranslation = subscriptionPlanCopy[currentLanguage] || subscriptionPlanCopy.en;
  const t = { ...baseTranslation, ...planTranslation, plans: planTranslation.plans };
  const trialCopy = TRIAL_COPY[currentLanguage] || TRIAL_COPY.en;
  const previewCopy = PREVIEW_COPY[currentLanguage] || PREVIEW_COPY.en;
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [trialLoading, setTrialLoading] = useState(false);
  const [previewExpired, setPreviewExpired] = useState(false);

  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        const [subscription, payments] = await Promise.all([getUserSubscription(), getPaymentHistory()]);
        setCurrentSubscription(subscription);
        setPaymentHistory(payments);
      } catch (error) {
        console.error('Error loading subscription data:', error);
        toast.error(t.loadError);
      }
    };
    if (user) loadSubscriptionData();
  }, [user, t.loadError]);

  const currentPlanRaw = currentSubscription?.effective_plan || user?.subscription_plan || 'Premiere';
  const currentPlan = currentPlanRaw;
  const currentPlanDisplay = t.plans[currentPlan]?.displayName || currentPlan;
  const tiers = useMemo(() => ['Premiere', 'Exclusive'].map((name) => ({ ...tierBase[name], ...planTranslation.plans[name], periodLabel: baseTranslation.labels.month })), [planTranslation, baseTranslation]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(currentLanguage || 'en', { year: 'numeric', month: 'short', day: '2-digit' }), [currentLanguage]);
  const statusLabel = (status) => t.statuses[status] || status;
  const isAnonymous = !user;
  const needsBillingSetup = Boolean(user && currentSubscription && !currentSubscription.stripe_subscription_id);
  const fallbackGuestPreviewExpiresAt = useMemo(() => {
    const createdAt = user?.created_at ? new Date(user.created_at) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return null;
    return new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }, [user?.created_at]);
  const guestPreviewExpiresAt = currentSubscription?.guest_preview_expires_at || fallbackGuestPreviewExpiresAt;
  const guestPreviewEndMs = guestPreviewExpiresAt ? new Date(guestPreviewExpiresAt).getTime() : NaN;
  const guestPreviewActive = Boolean(needsBillingSetup && !previewExpired && !Number.isNaN(guestPreviewEndMs) && guestPreviewEndMs > Date.now());
  const trialActive = ['trial', 'trialing'].includes(String(currentSubscription?.subscription_status || '').toLowerCase());

  const handleStartTrial = async () => {
    setTrialLoading(true);
    const result = await startPremierTrial();
    if (!result.success) {
      toast.error(result.error || t.trialStartError);
      setTrialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">{t.choosePlan}</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">{t.subtitle}</p>
          {user && (
            <p className="text-sm text-gray-500">
              {t.currentlyOn}: <span className="font-bold text-purple-600">{guestPreviewActive ? previewCopy.name : currentPlanDisplay}</span>{!guestPreviewActive && t.planWord ? ` ${t.planWord}` : ''}
            </p>
          )}
        </div>

        {(needsBillingSetup || trialActive) && (
          <Card className="mb-8 border-2 border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">{trialCopy.title}</h2>
                  <p className="text-gray-700 max-w-3xl">{trialActive ? trialCopy.active : guestPreviewActive ? t.terms.guest : trialCopy.body}</p>
                </div>
                {needsBillingSetup && <Button onClick={handleStartTrial} disabled={trialLoading} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-7 py-6 whitespace-nowrap">{trialLoading ? trialCopy.starting : trialCopy.start}</Button>}
              </div>
            </CardContent>
          </Card>
        )}

        {currentSubscription && ['active', 'trial'].includes(currentSubscription.subscription_status) && (
          <Card className="mb-8 border-2 border-purple-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600" />{t.currentSubscription}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-600 mb-1">{t.plan}</p><p className="text-lg font-bold text-gray-900">{t.plans[currentSubscription.subscription_plan]?.displayName || currentSubscription.subscription_plan}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">{t.status}</p><p className="text-lg font-bold text-green-600">{statusLabel(currentSubscription.subscription_status)}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">{t.renewsOn}</p><p className="text-lg font-bold text-gray-900">{currentSubscription.subscription_current_period_end ? dateFormatter.format(new Date(currentSubscription.subscription_current_period_end)) : t.notAvailable}</p></div>
              </div>
              {currentSubscription.cancel_at_period_end && <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-sm text-yellow-800">⚠️ {t.cancelNotice}</p></div>}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className={`relative overflow-hidden border-2 ${guestPreviewActive ? 'border-pink-500 ring-2 ring-pink-200 bg-gradient-to-br from-pink-50 to-white' : 'border-gray-200 bg-white'}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                    <ShieldCheck className="h-4 w-4" /> {previewCopy.badge}
                  </div>
                  <CardTitle className="text-2xl">{previewCopy.name}</CardTitle>
                </div>
                <Clock3 className="h-7 w-7 text-pink-500" />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-black text-gray-900">US$0</span>
                <span className="pb-1 text-sm font-semibold text-gray-500">/ {previewCopy.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`mb-5 rounded-2xl border p-4 text-center ${guestPreviewActive ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="text-xs font-black tracking-wider text-gray-500">
                  {isAnonymous ? previewCopy.startHere : guestPreviewActive ? previewCopy.active : needsBillingSetup ? previewCopy.ended : previewCopy.complete}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-700">{previewCopy.timer}</div>
                <div className={`mt-1 font-mono text-3xl font-black tracking-wider ${guestPreviewActive ? 'text-pink-600' : 'text-gray-500'}`}>
                  {isAnonymous ? '24:00:00' : guestPreviewActive ? <GuestPreviewTimer expiresAt={guestPreviewExpiresAt} onExpire={() => setPreviewExpired(true)} /> : '00:00:00'}
                </div>
              </div>
              <div className="space-y-3">
                {previewCopy.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-gray-500">{previewCopy.starts}</p>
              {isAnonymous && (
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <div className="mb-2 inline-flex rounded-t-lg bg-purple-100 px-3 py-1 text-xs font-black tracking-wide text-purple-800">{previewCopy.signupTab}</div>
                  <Button onClick={() => navigate('/SignUp?source=guest-preview')} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold">
                    {previewCopy.createAccount}
                  </Button>
                </div>
              )}
              {!isAnonymous && needsBillingSetup && !guestPreviewActive && (
                <Button onClick={handleStartTrial} disabled={trialLoading} className="mt-5 w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold">
                  {trialLoading ? trialCopy.starting : trialCopy.start}
                </Button>
              )}
            </CardContent>
          </Card>
          {tiers.map((tier, index) => (
            <TierCard
              key={tier.name}
              tier={tier}
              index={index}
              isSelected={!isAnonymous && !guestPreviewActive && currentPlan === tier.name}
              showPayment={!isAnonymous}
              onSelect={isAnonymous ? () => navigate('/SignUp?source=subscription-plan') : undefined}
              labels={isAnonymous ? { ...t.labels, choose: previewCopy.signupForPlan } : t.labels}
            />
          ))}
        </div>

        <Card className="mb-12 border border-purple-200 bg-white">
          <CardHeader>
            <CardTitle>Membership & Love Note Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-gray-700">
            <p>{t.terms.guest}</p>
            <p>{t.terms.trial}</p>
            <p>{t.terms.loveNotes}</p>
            <p>{t.terms.cancel}</p>
          </CardContent>
        </Card>

        {paymentHistory && paymentHistory.length > 0 && (
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-600" />{t.paymentHistory}</CardTitle>
              <CardDescription>{t.recentTransactions}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t.date}</th><th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t.plan}</th><th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t.amount}</th><th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t.status}</th></tr></thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="py-3 px-4 text-sm text-gray-900">{dateFormatter.format(new Date(payment.created_at))}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{t.plans[payment.subscription_plan]?.displayName || payment.subscription_plan}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}</td>
                        <td className="py-3 px-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : payment.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{payment.status === 'succeeded' && <CheckCircle className="w-3 h-3" />}{statusLabel(payment.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">{t.questions}</p>
          <Button variant="outline" size="lg">{t.contactSupport}<ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </div>
    </div>
  );
}
