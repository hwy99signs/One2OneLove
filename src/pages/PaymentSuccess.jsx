import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Loader2, Heart, ArrowRight, Sparkles, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { getUserSubscription } from '@/lib/stripeService';

const COPY = {
  en: {
    processingTitle: 'Confirming Your Membership', processingBody: 'Please wait while One2OneLove confirms your subscription with Stripe.',
    trialTitle: '7-Day Full Access Trial Activated!', activeTitle: 'Your Subscription Is Active!',
    trialWelcome: 'Your 7-day trial includes full Exclusive-level access. You were not charged the subscription price today. Your first One2OneLove SMS Love Note send is FREE; every additional send is $0.29. After 7 days, your membership continues on Premiere at $9.99/month unless you choose Exclusive or cancel before the trial ends.', activeWelcome: 'Your One2OneLove membership is ready to use. Love Note SMS sends after your complimentary first send are $0.29 each.',
    plan: 'Plan', status: 'Status', fullAccess: 'Full Access Trial', next: "What's Next?", profile: 'View My Profile', home: 'Go Home',
    item1: 'Your available membership features are now unlocked.', item2: 'Stripe will email your checkout confirmation.', item3: 'You can review or change your plan from Subscription.',
    pendingTitle: 'Checkout Received — Finalizing Access', pendingBody: 'Stripe returned you to One2OneLove, but the membership update has not reached your account yet. This can take a few more seconds.', pendingAction: 'Check Subscription Status',
    support: 'Need help? Contact us at', thanks: 'Thank you for joining One2OneLove. 💕'
  },
  es: {
    processingTitle: 'Confirmando Tu Membresía', processingBody: 'Espera mientras One2OneLove confirma tu suscripción con Stripe.',
    trialTitle: '¡Prueba de Acceso Completo de 7 Días Activada!', activeTitle: '¡Tu Suscripción Está Activa!',
    trialWelcome: 'Tu prueba de 7 días incluye acceso completo de nivel Exclusive. Hoy no se cobró el precio de la suscripción. Tu primer envío SMS de Nota de Amor de One2OneLove es GRATIS; cada envío adicional cuesta $0.29. Después de 7 días, tu membresía continúa en Premiere por $9.99/mes, a menos que elijas Exclusive o canceles antes de que termine la prueba.', activeWelcome: 'Tu membresía de One2OneLove está lista para usar. Los envíos SMS de Notas de Amor después de tu primer envío gratuito cuestan $0.29 cada uno.',
    plan: 'Plan', status: 'Estado', fullAccess: 'Prueba de Acceso Completo', next: '¿Qué Sigue?', profile: 'Ver Mi Perfil', home: 'Ir al Inicio',
    item1: 'Tus funciones disponibles de membresía ya están desbloqueadas.', item2: 'Stripe enviará por correo la confirmación del checkout.', item3: 'Puedes revisar o cambiar tu plan desde Suscripción.',
    pendingTitle: 'Checkout Recibido — Finalizando Acceso', pendingBody: 'Stripe te devolvió a One2OneLove, pero la actualización aún no ha llegado a tu cuenta. Puede tardar unos segundos más.', pendingAction: 'Revisar Estado de Suscripción',
    support: '¿Necesitas ayuda? Contáctanos en', thanks: 'Gracias por unirte a One2OneLove. 💕'
  },
  fr: {
    processingTitle: 'Confirmation de Votre Abonnement', processingBody: 'Veuillez patienter pendant que One2OneLove confirme votre abonnement auprès de Stripe.',
    trialTitle: 'Essai de 7 Jours avec Accès Complet Activé !', activeTitle: 'Votre Abonnement Est Actif !',
    trialWelcome: 'Votre essai de 7 jours comprend un accès complet de niveau Exclusive. Le prix de l’abonnement n’a pas été débité aujourd’hui. Votre premier envoi de Note d’Amour par SMS One2OneLove est GRATUIT ; chaque envoi supplémentaire coûte 0,29 $. Après 7 jours, votre abonnement continue avec Premiere à 9,99 $/mois, sauf si vous choisissez Exclusive ou annulez avant la fin de l’essai.', activeWelcome: 'Votre abonnement One2OneLove est prêt à être utilisé. Les envois SMS de Notes d’Amour après votre premier envoi gratuit coûtent 0,29 $ chacun.',
    plan: 'Formule', status: 'Statut', fullAccess: 'Essai Accès Complet', next: 'Et Maintenant ?', profile: 'Voir Mon Profil', home: 'Accueil',
    item1: 'Les fonctionnalités incluses dans votre abonnement sont maintenant débloquées.', item2: 'Stripe vous enverra la confirmation du paiement par e-mail.', item3: 'Vous pouvez consulter ou modifier votre formule dans Abonnement.',
    pendingTitle: 'Checkout Reçu — Activation en Cours', pendingBody: 'Stripe vous a renvoyé vers One2OneLove, mais la mise à jour n’est pas encore arrivée sur votre compte. Cela peut prendre quelques secondes de plus.', pendingAction: 'Vérifier le Statut',
    support: 'Besoin d’aide ? Contactez-nous à', thanks: 'Merci de rejoindre One2OneLove. 💕'
  },
  it: {
    processingTitle: 'Conferma dell’Abbonamento', processingBody: 'Attendi mentre One2OneLove conferma il tuo abbonamento con Stripe.',
    trialTitle: 'Prova di 7 Giorni con Accesso Completo Attivata!', activeTitle: 'Il Tuo Abbonamento È Attivo!',
    trialWelcome: 'La prova di 7 giorni include accesso completo di livello Exclusive. Oggi non è stato addebitato il prezzo dell’abbonamento. Il primo invio SMS di una Nota d’Amore One2OneLove è GRATIS; ogni invio successivo costa $0.29. Dopo 7 giorni, l’abbonamento continua con Premiere a $9.99/mese salvo scelta di Exclusive o annullamento prima della fine della prova.', activeWelcome: 'Il tuo abbonamento One2OneLove è pronto da usare. Gli invii SMS di Note d’Amore dopo il primo invio gratuito costano $0.29 ciascuno.',
    plan: 'Piano', status: 'Stato', fullAccess: 'Prova Accesso Completo', next: 'Cosa Fare Ora?', profile: 'Vedi Il Mio Profilo', home: 'Vai alla Home',
    item1: 'Le funzioni incluse nel tuo abbonamento sono ora sbloccate.', item2: 'Stripe invierà via e-mail la conferma del checkout.', item3: 'Puoi rivedere o cambiare piano dalla pagina Abbonamento.',
    pendingTitle: 'Checkout Ricevuto — Attivazione in Corso', pendingBody: 'Stripe ti ha riportato su One2OneLove, ma l’aggiornamento non è ancora arrivato al tuo account. Potrebbero servire ancora alcuni secondi.', pendingAction: 'Controlla Stato Abbonamento',
    support: 'Serve aiuto? Contattaci a', thanks: 'Grazie per esserti unito a One2OneLove. 💕'
  },
  de: {
    processingTitle: 'Mitgliedschaft Wird Bestätigt', processingBody: 'Bitte warten Sie, während One2OneLove Ihre Mitgliedschaft mit Stripe bestätigt.',
    trialTitle: '7-Tage-Test mit Vollzugriff Aktiviert!', activeTitle: 'Ihre Mitgliedschaft Ist Aktiv!',
    trialWelcome: 'Ihr 7-Tage-Test umfasst vollständigen Exclusive-Zugriff. Der Abonnementpreis wurde heute nicht berechnet. Ihre erste One2OneLove-SMS-Liebesnachricht ist KOSTENLOS; jede weitere Sendung kostet 0,29 $. Nach 7 Tagen läuft Ihre Mitgliedschaft mit Premiere für 9,99 $/Monat weiter, sofern Sie nicht Exclusive wählen oder vor Testende kündigen.', activeWelcome: 'Ihre One2OneLove-Mitgliedschaft ist einsatzbereit. SMS-Liebesnachrichten nach Ihrer ersten kostenlosen Sendung kosten je 0,29 $.',
    plan: 'Plan', status: 'Status', fullAccess: 'Vollzugriff-Test', next: 'Wie Geht Es Weiter?', profile: 'Mein Profil Anzeigen', home: 'Zur Startseite',
    item1: 'Die in Ihrer Mitgliedschaft enthaltenen Funktionen sind jetzt freigeschaltet.', item2: 'Stripe sendet Ihnen die Checkout-Bestätigung per E-Mail.', item3: 'Sie können Ihren Plan unter Abonnement prüfen oder ändern.',
    pendingTitle: 'Checkout Empfangen — Zugriff Wird Aktiviert', pendingBody: 'Stripe hat Sie zu One2OneLove zurückgeleitet, aber die Aktualisierung ist noch nicht in Ihrem Konto angekommen. Dies kann noch einige Sekunden dauern.', pendingAction: 'Abonnementstatus Prüfen',
    support: 'Brauchen Sie Hilfe? Kontaktieren Sie uns unter', thanks: 'Danke, dass Sie One2OneLove beigetreten sind. 💕'
  },
};

function displayPlan(plan) {
  const raw = String(plan || '');
  if (raw === 'Premiere') return 'Premiere';
  return raw || 'Premiere';
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let cancelled = false;

    const confirmMembership = async () => {
      if (!sessionId) {
        navigate(createPageUrl('Subscription'), { replace: true });
        return;
      }

      let latest = null;
      for (let attempt = 0; attempt < 8 && !cancelled; attempt += 1) {
        if (attempt > 0) await new Promise(resolve => window.setTimeout(resolve, 1500));
        latest = await getUserSubscription();
        const status = String(latest?.subscription_status || '').toLowerCase();
        if (['active', 'trial', 'trialing'].includes(status)) {
          setSubscriptionInfo(latest);
          setConfirmed(true);
          await refreshUserProfile().catch(() => null);
          break;
        }
      }

      if (!cancelled) {
        if (!latest) latest = await getUserSubscription();
        setSubscriptionInfo(latest);
        setIsLoading(false);
      }
    };

    confirmMembership();
    return () => { cancelled = true; };
  }, [sessionId, navigate, refreshUserProfile]);

  const isTrial = ['trial', 'trialing'].includes(String(subscriptionInfo?.subscription_status || '').toLowerCase());
  const planName = useMemo(() => displayPlan(subscriptionInfo?.subscription_plan), [subscriptionInfo]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <Card className="w-full max-w-md"><CardContent className="pt-6"><div className="py-8 text-center"><Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-purple-600"/><h2 className="mb-2 text-2xl font-bold text-gray-900">{t.processingTitle}</h2><p className="text-gray-600">{t.processingBody}</p></div></CardContent></Card>
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <Card className="w-full max-w-xl border-2 border-amber-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <Clock3 className="mx-auto mb-5 h-14 w-14 text-amber-500"/>
            <h1 className="mb-3 text-3xl font-bold text-gray-900">{t.pendingTitle}</h1>
            <p className="mb-7 text-gray-600">{t.pendingBody}</p>
            <Button onClick={() => navigate(createPageUrl('Subscription'))} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">{t.pendingAction}<ArrowRight className="ml-2 h-4 w-4"/></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="w-full max-w-2xl">
        <Card className="overflow-hidden border-2 border-purple-200 shadow-2xl">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl"><CheckCircle className="h-16 w-16 text-green-500"/></div>
            <h1 className="mb-2 text-4xl font-bold text-white">{isTrial ? t.trialTitle : t.activeTitle}</h1>
            <p className="text-lg text-white/90">{isTrial ? t.trialWelcome : t.activeWelcome}</p>
          </div>

          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                <div className="mb-4 flex items-center gap-3"><Sparkles className="h-6 w-6 text-purple-600"/><h3 className="text-xl font-bold text-gray-900">One2OneLove</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">{t.plan}</p><p className="text-lg font-bold text-gray-900">{isTrial ? t.fullAccess : planName}</p></div>
                  <div><p className="text-sm text-gray-600">{t.status}</p><p className="text-lg font-bold capitalize text-green-600">{isTrial ? 'Trial' : 'Active'}</p></div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900"><Heart className="h-5 w-5 text-pink-500"/>{t.next}</h3>
                {[t.item1, t.item2, t.item3].map(item => <div key={item} className="mb-2 flex items-start gap-3"><CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"/><span className="text-gray-700">{item}</span></div>)}
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button onClick={() => navigate(createPageUrl('Profile'))} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-6 text-lg text-white hover:from-purple-600 hover:to-pink-600">{t.profile}<ArrowRight className="ml-2 h-5 w-5"/></Button>
                <Button onClick={() => navigate(createPageUrl('Home'))} variant="outline" className="flex-1 py-6 text-lg">{t.home}</Button>
              </div>

              <p className="pt-4 text-center text-sm text-gray-500">{t.support} <a href="mailto:support@one2onelove.com" className="font-semibold text-purple-600 hover:text-purple-700">support@one2onelove.com</a></p>
              <p className="text-center text-sm text-gray-600">{t.thanks}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
