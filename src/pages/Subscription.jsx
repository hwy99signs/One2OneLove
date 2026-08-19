import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle, CreditCard, Crown, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TierCard from '@/components/subscriptions/TierCard';
import { createBillingPortalSession, getPaymentHistory, getUserSubscription, redirectToCheckout } from '@/lib/stripeService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { toast } from 'sonner';

const locales = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };

const translations = {
  en: {
    title: 'Choose Your Plan', subtitle: 'Choose the level of One2OneLove tools that fits your relationship journey.', current: 'Current plan', signInTitle: 'Sign in to manage a subscription', signInCopy: 'You can review the plans below, but you must be signed in before starting checkout or managing billing.', signIn: 'Sign In', currentSubscription: 'Your Current Subscription', plan: 'Plan', status: 'Status', renews: 'Renews / changes on', notAvailable: 'Not available', cancellation: 'Your paid subscription is scheduled to change at the end of the current billing period.', manage: 'Manage Billing in Stripe', opening: 'Opening billing…', history: 'Payment History', historyCopy: 'Recent transactions recorded from verified Stripe events.', date: 'Date', amount: 'Amount', contact: 'Have questions about membership or billing?', contactButton: 'Contact Support', billingError: 'Billing management is not available right now.', loadError: 'Some billing details could not be loaded.', month: 'month', statuses: { active: 'Active', trialing: 'Trial', past_due: 'Past due', canceled: 'Canceled', inactive: 'Inactive' },
    plans: {
      Basic: { description: 'A strong free starting point for everyday connection.', features: ['Love Notes and relationship prompts', 'Daily Relationship Question', 'Marriage Matters', 'Relationship Library', 'Couples Challenges', 'Date Night planner', 'Global Relationship Room'] },
      Premiere: { description: 'More guided tools for couples who want deeper ongoing practice.', features: ['Everything in Basic', 'AI Relationship Coach access', 'Relationship Goals tools', 'Advanced relationship quizzes', 'Expanded date and activity tools', 'Priority access to new relationship features'] },
      Exclusive: { description: 'The broadest One2OneLove toolkit for couples who want the full experience.', features: ['Everything in Premiere', 'AI Content Creator access', 'Couples Dashboard and Calendar tools', 'Shared Journals and relationship activities', 'Expanded AI relationship tools', 'Early access to advanced One2OneLove experiences'] },
    },
  },
  es: {
    title: 'Elige Tu Plan', subtitle: 'Elige el nivel de herramientas de One2OneLove que mejor se adapte a tu recorrido de pareja.', current: 'Plan actual', signInTitle: 'Inicia sesión para gestionar una suscripción', signInCopy: 'Puedes revisar los planes a continuación, pero debes iniciar sesión antes de comenzar el pago o gestionar la facturación.', signIn: 'Iniciar Sesión', currentSubscription: 'Tu Suscripción Actual', plan: 'Plan', status: 'Estado', renews: 'Renueva / cambia el', notAvailable: 'No disponible', cancellation: 'Tu suscripción de pago está programada para cambiar al final del período de facturación actual.', manage: 'Gestionar Facturación en Stripe', opening: 'Abriendo facturación…', history: 'Historial de Pagos', historyCopy: 'Transacciones recientes registradas a partir de eventos verificados de Stripe.', date: 'Fecha', amount: 'Importe', contact: '¿Tienes preguntas sobre membresía o facturación?', contactButton: 'Contactar Soporte', billingError: 'La gestión de facturación no está disponible en este momento.', loadError: 'No se pudieron cargar algunos detalles de facturación.', month: 'mes', statuses: { active: 'Activa', trialing: 'Prueba', past_due: 'Pago pendiente', canceled: 'Cancelada', inactive: 'Inactiva' },
    plans: {
      Basic: { description: 'Un sólido punto de partida gratuito para la conexión cotidiana.', features: ['Notas de Amor y preguntas para conversar', 'Pregunta Diaria para la Relación', 'El Matrimonio Importa', 'Biblioteca de Relaciones', 'Retos para Parejas', 'Planificador de Noche de Cita', 'Sala Global de Relaciones'] },
      Premiere: { description: 'Más herramientas guiadas para parejas que desean una práctica continua más profunda.', features: ['Todo lo incluido en Basic', 'Acceso al Coach de Relaciones con IA', 'Herramientas de Metas de Relación', 'Cuestionarios avanzados de relaciones', 'Más ideas de citas y actividades', 'Acceso prioritario a nuevas funciones'] },
      Exclusive: { description: 'El conjunto más amplio de herramientas One2OneLove para parejas que quieren la experiencia completa.', features: ['Todo lo incluido en Premiere', 'Acceso al Creador de Contenido con IA', 'Herramientas de Panel y Calendario para Parejas', 'Diarios Compartidos y actividades', 'Herramientas de relación con IA ampliadas', 'Acceso anticipado a experiencias avanzadas'] },
    },
  },
  fr: {
    title: 'Choisissez Votre Forfait', subtitle: 'Choisissez le niveau d’outils One2OneLove qui correspond à votre parcours relationnel.', current: 'Forfait actuel', signInTitle: 'Connectez-vous pour gérer un abonnement', signInCopy: 'Vous pouvez consulter les forfaits ci-dessous, mais vous devez être connecté avant de démarrer le paiement ou de gérer la facturation.', signIn: 'Se Connecter', currentSubscription: 'Votre Abonnement Actuel', plan: 'Forfait', status: 'Statut', renews: 'Renouvellement / changement le', notAvailable: 'Non disponible', cancellation: 'Votre abonnement payant est programmé pour changer à la fin de la période de facturation actuelle.', manage: 'Gérer la Facturation dans Stripe', opening: 'Ouverture de la facturation…', history: 'Historique des Paiements', historyCopy: 'Transactions récentes enregistrées à partir d’événements Stripe vérifiés.', date: 'Date', amount: 'Montant', contact: 'Des questions sur l’adhésion ou la facturation ?', contactButton: 'Contacter le Support', billingError: 'La gestion de la facturation n’est pas disponible actuellement.', loadError: 'Certains détails de facturation n’ont pas pu être chargés.', month: 'mois', statuses: { active: 'Actif', trialing: 'Essai', past_due: 'En retard', canceled: 'Annulé', inactive: 'Inactif' },
    plans: {
      Basic: { description: 'Un solide point de départ gratuit pour la connexion au quotidien.', features: ['Notes d’Amour et questions relationnelles', 'Question Relationnelle du Jour', 'Le Mariage Compte', 'Bibliothèque Relationnelle', 'Défis de Couple', 'Planificateur de Soirée en Couple', 'Salle Mondiale des Relations'] },
      Premiere: { description: 'Davantage d’outils guidés pour les couples qui veulent approfondir leur pratique.', features: ['Tout le forfait Basic', 'Accès au Coach Relationnel IA', 'Outils d’Objectifs de Relation', 'Quiz relationnels avancés', 'Plus d’idées de rendez-vous et d’activités', 'Accès prioritaire aux nouvelles fonctionnalités'] },
      Exclusive: { description: 'La boîte à outils One2OneLove la plus complète pour les couples qui veulent l’expérience entière.', features: ['Tout le forfait Premiere', 'Accès au Créateur de Contenu IA', 'Tableau de Bord et Calendrier de Couple', 'Journaux Partagés et activités relationnelles', 'Outils relationnels IA étendus', 'Accès anticipé aux expériences avancées'] },
    },
  },
  it: {
    title: 'Scegli Il Tuo Piano', subtitle: 'Scegli il livello di strumenti One2OneLove più adatto al vostro percorso di coppia.', current: 'Piano attuale', signInTitle: 'Accedi per gestire un abbonamento', signInCopy: 'Puoi consultare i piani qui sotto, ma devi accedere prima di iniziare il checkout o gestire la fatturazione.', signIn: 'Accedi', currentSubscription: 'Il Tuo Abbonamento Attuale', plan: 'Piano', status: 'Stato', renews: 'Rinnovo / modifica il', notAvailable: 'Non disponibile', cancellation: 'Il tuo abbonamento a pagamento è programmato per cambiare alla fine del periodo di fatturazione corrente.', manage: 'Gestisci Fatturazione in Stripe', opening: 'Apertura fatturazione…', history: 'Cronologia Pagamenti', historyCopy: 'Transazioni recenti registrate da eventi Stripe verificati.', date: 'Data', amount: 'Importo', contact: 'Hai domande su abbonamento o fatturazione?', contactButton: 'Contatta Supporto', billingError: 'La gestione della fatturazione non è disponibile in questo momento.', loadError: 'Alcuni dettagli di fatturazione non sono stati caricati.', month: 'mese', statuses: { active: 'Attivo', trialing: 'Prova', past_due: 'Scaduto', canceled: 'Annullato', inactive: 'Inattivo' },
    plans: {
      Basic: { description: 'Un solido punto di partenza gratuito per la connessione quotidiana.', features: ['Note d’Amore e spunti di relazione', 'Domanda Quotidiana sulla Relazione', 'Il Matrimonio Conta', 'Biblioteca delle Relazioni', 'Sfide di Coppia', 'Pianificatore Serata di Coppia', 'Sala Globale delle Relazioni'] },
      Premiere: { description: 'Più strumenti guidati per coppie che vogliono una pratica continua più profonda.', features: ['Tutto il piano Basic', 'Accesso al Coach Relazionale IA', 'Strumenti per Obiettivi di Relazione', 'Quiz relazionali avanzati', 'Più idee per appuntamenti e attività', 'Accesso prioritario alle nuove funzioni'] },
      Exclusive: { description: 'Il toolkit One2OneLove più ampio per coppie che desiderano l’esperienza completa.', features: ['Tutto il piano Premiere', 'Accesso al Creatore di Contenuti IA', 'Dashboard e Calendario di Coppia', 'Diari Condivisi e attività relazionali', 'Strumenti IA relazionali ampliati', 'Accesso anticipato alle esperienze avanzate'] },
    },
  },
  de: {
    title: 'Wähle Deinen Tarif', subtitle: 'Wähle die One2OneLove-Werkzeuge, die zu eurer Beziehungsreise passen.', current: 'Aktueller Tarif', signInTitle: 'Zum Verwalten eines Abonnements anmelden', signInCopy: 'Du kannst die Tarife unten ansehen, musst aber angemeldet sein, bevor du Checkout oder Abrechnung verwaltest.', signIn: 'Anmelden', currentSubscription: 'Dein Aktuelles Abonnement', plan: 'Tarif', status: 'Status', renews: 'Verlängert / ändert sich am', notAvailable: 'Nicht verfügbar', cancellation: 'Dein kostenpflichtiges Abonnement ist für eine Änderung am Ende des aktuellen Abrechnungszeitraums vorgemerkt.', manage: 'Abrechnung in Stripe Verwalten', opening: 'Abrechnung wird geöffnet…', history: 'Zahlungsverlauf', historyCopy: 'Letzte Transaktionen aus verifizierten Stripe-Ereignissen.', date: 'Datum', amount: 'Betrag', contact: 'Fragen zu Mitgliedschaft oder Abrechnung?', contactButton: 'Support Kontaktieren', billingError: 'Die Abrechnungsverwaltung ist derzeit nicht verfügbar.', loadError: 'Einige Abrechnungsdetails konnten nicht geladen werden.', month: 'Monat', statuses: { active: 'Aktiv', trialing: 'Testphase', past_due: 'Überfällig', canceled: 'Gekündigt', inactive: 'Inaktiv' },
    plans: {
      Basic: { description: 'Ein starker kostenloser Startpunkt für tägliche Verbindung.', features: ['Liebesbotschaften und Beziehungsfragen', 'Tägliche Beziehungsfrage', 'Ehe Zählt', 'Beziehungsbibliothek', 'Paar-Challenges', 'Date-Night-Planer', 'Globaler Beziehungsraum'] },
      Premiere: { description: 'Mehr geführte Werkzeuge für Paare, die ihre Beziehung kontinuierlich vertiefen möchten.', features: ['Alles aus Basic', 'Zugang zum KI-Beziehungscoach', 'Werkzeuge für Beziehungsziele', 'Erweiterte Beziehungsquiz', 'Mehr Date- und Aktivitätsideen', 'Bevorzugter Zugang zu neuen Funktionen'] },
      Exclusive: { description: 'Das umfassendste One2OneLove-Toolkit für Paare, die das volle Erlebnis möchten.', features: ['Alles aus Premiere', 'Zugang zum KI-Content-Creator', 'Paar-Dashboard und Kalender', 'Gemeinsame Journale und Beziehungsaktivitäten', 'Erweiterte KI-Beziehungswerkzeuge', 'Frühzugang zu erweiterten One2OneLove-Erlebnissen'] },
    },
  },
};

const planMeta = {
  Basic: { price: 0, icon: '💝', gradient: 'from-blue-400 to-blue-600', popular: false, isFree: true },
  Premiere: { price: 19.99, icon: '💖', gradient: 'from-purple-400 to-pink-500', popular: true, isFree: false },
  Exclusive: { price: 34.99, icon: '👑', gradient: 'from-yellow-400 to-orange-500', popular: false, isFree: false },
};

export default function Subscription() {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [isOpeningBilling, setIsOpeningBilling] = useState(false);

  const tiers = useMemo(() => Object.entries(planMeta).map(([name, meta]) => ({
    name,
    displayName: name,
    price: meta.price,
    period: t.month,
    description: t.plans[name].description,
    icon: meta.icon,
    gradient: meta.gradient,
    features: t.plans[name].features,
    popular: meta.popular,
    isFree: meta.isFree,
  })), [t]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const [subscription, payments] = await Promise.all([getUserSubscription(), getPaymentHistory()]);
      if (!active) return;
      setCurrentSubscription(subscription);
      setPaymentHistory(payments);
      setIsLoading(false);
      if (!subscription) toast.error(t.loadError);
    };
    load();
    return () => { active = false; };
  }, [user, t.loadError]);

  const currentPlan = currentSubscription?.subscription_plan || user?.subscription_plan || 'Basic';
  const locale = locales[currentLanguage] || locales.en;

  const formatDate = (value) => {
    if (!value) return t.notAvailable;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t.notAvailable;
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  const openBilling = async () => {
    setIsOpeningBilling(true);
    const result = await createBillingPortalSession();
    if (!result.success) {
      toast.error(result.error || t.billingError);
      setIsOpeningBilling(false);
      return;
    }
    await redirectToCheckout(result.url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-2"><Crown className="h-8 w-8 text-purple-600" aria-hidden="true" /><h1 className="text-4xl font-bold text-gray-900">{t.title}</h1></div>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">{t.subtitle}</p>
          {user && <p className="mt-3 text-sm text-gray-500">{t.current}: <span className="font-bold text-purple-700">{currentPlan}</span></p>}
        </header>

        {!user && (
          <Card className="mx-auto mb-8 max-w-3xl border-blue-200 bg-blue-50">
            <CardHeader><CardTitle>{t.signInTitle}</CardTitle><CardDescription>{t.signInCopy}</CardDescription></CardHeader>
            <CardContent><Button asChild><Link to="/SignIn">{t.signIn}</Link></Button></CardContent>
          </Card>
        )}

        {user && isLoading && <div className="mb-8 flex items-center justify-center gap-2 text-gray-600" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.opening}</div>}

        {user && currentSubscription && currentPlan !== 'Basic' && (
          <Card className="mb-8 border-2 border-purple-200 bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-600" aria-hidden="true" />{t.currentSubscription}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div><p className="mb-1 text-sm text-gray-600">{t.plan}</p><p className="text-lg font-bold text-gray-900">{currentSubscription.subscription_plan}</p></div>
                <div><p className="mb-1 text-sm text-gray-600">{t.status}</p><p className="text-lg font-bold text-green-700">{t.statuses[currentSubscription.subscription_status] || currentSubscription.subscription_status}</p></div>
                <div><p className="mb-1 text-sm text-gray-600">{t.renews}</p><p className="flex items-center gap-2 text-lg font-bold text-gray-900"><Calendar className="h-4 w-4" aria-hidden="true" />{formatDate(currentSubscription.subscription_current_period_end)}</p></div>
              </div>
              {currentSubscription.cancel_at_period_end && <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3"><p className="text-sm text-yellow-900">{t.cancellation}</p></div>}
              <Button type="button" variant="outline" className="mt-5" disabled={isOpeningBilling} onClick={openBilling}>{isOpeningBilling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{t.opening}</> : <><CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />{t.manage}</>}</Button>
            </CardContent>
          </Card>
        )}

        <div className="mb-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, index) => <TierCard key={tier.name} tier={tier} index={index} isSelected={Boolean(user) && currentPlan === tier.name} showPayment={Boolean(user)} />)}
        </div>

        {user && paymentHistory.length > 0 && (
          <Card className="border-2 border-gray-200">
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-gray-600" aria-hidden="true" />{t.history}</CardTitle><CardDescription>{t.historyCopy}</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b"><th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t.date}</th><th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t.plan}</th><th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t.amount}</th><th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t.status}</th></tr></thead>
                  <tbody>{paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0"><td className="px-4 py-3 text-sm text-gray-900">{formatDate(payment.created_at)}</td><td className="px-4 py-3 text-sm text-gray-900">{payment.subscription_plan}</td><td className="px-4 py-3 text-sm text-gray-900">{new Intl.NumberFormat(locale, { style: 'currency', currency: String(payment.currency || 'USD').toUpperCase() }).format(Number(payment.amount || 0))}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : payment.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{payment.status === 'succeeded' && <CheckCircle className="h-3 w-3" aria-hidden="true" />}{t.statuses[payment.status] || payment.status}</span></td></tr>
                  ))}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 text-center"><p className="mb-4 text-gray-600">{t.contact}</p><Button asChild variant="outline" size="lg"><Link to="/ContactUs">{t.contactButton}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button></div>
      </div>
    </div>
  );
}
