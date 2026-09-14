import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { Crown, Sparkles, CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TierCard from '@/components/subscriptions/TierCard';
import { getUserSubscription, getPaymentHistory } from '@/lib/stripeService';
import { toast } from 'sonner';

const translations = {
  en: {
    choosePlan: 'Choose Your Plan',
    subtitle: 'Unlock premium features to strengthen your relationship',
    currentlyOn: 'Currently on',
    planWord: 'plan',
    currentSubscription: 'Your Current Subscription',
    plan: 'Plan',
    status: 'Status',
    renewsOn: 'Renews On',
    notAvailable: 'N/A',
    cancelNotice: 'Your subscription will be canceled at the end of the current billing period.',
    paymentHistory: 'Payment History',
    recentTransactions: 'Your recent transactions',
    date: 'Date',
    amount: 'Amount',
    questions: 'Have questions about our plans?',
    contactSupport: 'Contact Support',
    loadError: 'Failed to load subscription information',
    statuses: { active: 'Active', succeeded: 'Succeeded', failed: 'Failed', pending: 'Pending' },
    labels: {
      mostPopular: 'MOST POPULAR', free: 'Free', month: 'month', processing: 'Processing...', selected: 'Selected', choose: 'Choose',
      paymentFailed: 'Failed to process payment', basicSuccess: 'Successfully subscribed to Basic plan!', redirecting: 'Redirecting to Stripe checkout...', genericError: 'An error occurred. Please try again.'
    },
    plans: {
      Basic: { displayName: 'Basic', description: 'Perfect for couples just starting out', features: ['Access to 50+ Love Notes Library', 'Basic Relationship Quizzes', 'Monthly Date Ideas (5 ideas)', 'Anniversary Reminders', 'Memory Timeline', 'Mobile App Access', 'Email Support'] },
      Premiere: { displayName: 'Premiere', description: 'For couples ready to grow together', features: ['Everything in Basic, plus:', 'Access to 1000+ Love Notes Library', 'AI Relationship Coach (50 questions/month)', 'Unlimited Date Ideas', 'Relationship Goals Tracker', 'Advanced Quizzes & Insights', 'Surprise Message Scheduling', 'Ad-Free Experience', 'Priority Support', 'Early Access to New Features'] },
      Exclusive: { displayName: 'Exclusive', description: 'The complete relationship toolkit', features: ['Everything in Premiere, plus:', 'Unlimited Love Notes Library', 'Unlimited AI Relationship Coach', 'AI-Powered Content Creator', 'Personalized Relationship Reports', 'Exclusive Community Access', '1-on-1 Expert Consultation', 'Premium Support (24/7)', 'VIP Badge & Perks', 'Lifetime Access to Premium Content'] }
    }
  },
  es: {
    choosePlan: 'Elige Tu Plan', subtitle: 'Desbloquea funciones premium para fortalecer tu relación', currentlyOn: 'Actualmente en', planWord: 'plan', currentSubscription: 'Tu Suscripción Actual', plan: 'Plan', status: 'Estado', renewsOn: 'Se Renueva El', notAvailable: 'N/D', cancelNotice: 'Tu suscripción se cancelará al final del período de facturación actual.', paymentHistory: 'Historial de Pagos', recentTransactions: 'Tus transacciones recientes', date: 'Fecha', amount: 'Monto', questions: '¿Tienes preguntas sobre nuestros planes?', contactSupport: 'Contactar Soporte', loadError: 'No se pudo cargar la información de la suscripción', statuses: { active: 'Activo', succeeded: 'Completado', failed: 'Fallido', pending: 'Pendiente' },
    labels: { mostPopular: 'MÁS POPULAR', free: 'Gratis', month: 'mes', processing: 'Procesando...', selected: 'Seleccionado', choose: 'Elegir', paymentFailed: 'No se pudo procesar el pago', basicSuccess: '¡Te suscribiste correctamente al plan Basic!', redirecting: 'Redirigiendo al pago de Stripe...', genericError: 'Ocurrió un error. Inténtalo de nuevo.' },
    plans: {
      Basic: { displayName: 'Básico', description: 'Perfecto para parejas que están comenzando', features: ['Acceso a más de 50 notas de amor', 'Cuestionarios básicos de relación', 'Ideas mensuales para citas (5 ideas)', 'Recordatorios de aniversario', 'Línea de tiempo de recuerdos', 'Acceso a la aplicación móvil', 'Soporte por correo electrónico'] },
      Premiere: { displayName: 'Premiere', description: 'Para parejas listas para crecer juntas', features: ['Todo lo de Básico, más:', 'Acceso a más de 1000 notas de amor', 'Coach de relación con IA (50 preguntas/mes)', 'Ideas ilimitadas para citas', 'Seguimiento de metas de relación', 'Cuestionarios e ideas avanzadas', 'Programación de mensajes sorpresa', 'Experiencia sin anuncios', 'Soporte prioritario', 'Acceso anticipado a nuevas funciones'] },
      Exclusive: { displayName: 'Exclusivo', description: 'El kit completo para tu relación', features: ['Todo lo de Premiere, más:', 'Biblioteca ilimitada de notas de amor', 'Coach de relación con IA ilimitado', 'Creador de contenido con IA', 'Informes personalizados de relación', 'Acceso exclusivo a la comunidad', 'Consulta individual con un experto', 'Soporte premium 24/7', 'Insignia VIP y beneficios', 'Acceso de por vida al contenido premium'] }
    }
  },
  fr: {
    choosePlan: 'Choisissez Votre Formule', subtitle: 'Débloquez des fonctionnalités premium pour renforcer votre relation', currentlyOn: 'Formule actuelle', planWord: '', currentSubscription: 'Votre Abonnement Actuel', plan: 'Formule', status: 'Statut', renewsOn: 'Renouvellement Le', notAvailable: 'N/D', cancelNotice: 'Votre abonnement sera annulé à la fin de la période de facturation en cours.', paymentHistory: 'Historique des Paiements', recentTransactions: 'Vos transactions récentes', date: 'Date', amount: 'Montant', questions: 'Des questions sur nos formules ?', contactSupport: 'Contacter le Support', loadError: 'Impossible de charger les informations de l’abonnement', statuses: { active: 'Actif', succeeded: 'Réussi', failed: 'Échoué', pending: 'En attente' },
    labels: { mostPopular: 'LE PLUS POPULAIRE', free: 'Gratuit', month: 'mois', processing: 'Traitement...', selected: 'Sélectionné', choose: 'Choisir', paymentFailed: 'Échec du traitement du paiement', basicSuccess: 'Abonnement au plan Basic effectué avec succès !', redirecting: 'Redirection vers le paiement Stripe...', genericError: 'Une erreur s’est produite. Veuillez réessayer.' },
    plans: {
      Basic: { displayName: 'Basique', description: 'Idéal pour les couples qui commencent leur parcours', features: ['Accès à plus de 50 Notes d’Amour', 'Quiz relationnels de base', 'Idées de rendez-vous mensuelles (5 idées)', 'Rappels d’anniversaire', 'Chronologie des souvenirs', 'Accès à l’application mobile', 'Assistance par e-mail'] },
      Premiere: { displayName: 'Première', description: 'Pour les couples prêts à grandir ensemble', features: ['Tout ce qui est inclus dans Basique, plus :', 'Accès à plus de 1000 Notes d’Amour', 'Coach relationnel IA (50 questions/mois)', 'Idées de rendez-vous illimitées', 'Suivi des objectifs de relation', 'Quiz et analyses avancés', 'Programmation de messages surprise', 'Expérience sans publicité', 'Assistance prioritaire', 'Accès anticipé aux nouvelles fonctionnalités'] },
      Exclusive: { displayName: 'Exclusif', description: 'La boîte à outils complète pour votre relation', features: ['Tout ce qui est inclus dans Première, plus :', 'Bibliothèque illimitée de Notes d’Amour', 'Coach relationnel IA illimité', 'Créateur de contenu alimenté par l’IA', 'Rapports relationnels personnalisés', 'Accès exclusif à la communauté', 'Consultation individuelle avec un expert', 'Assistance premium 24 h/24, 7 j/7', 'Badge VIP et avantages', 'Accès à vie au contenu premium'] }
    }
  },
  it: {
    choosePlan: 'Scegli Il Tuo Piano', subtitle: 'Sblocca funzionalità premium per rafforzare la tua relazione', currentlyOn: 'Piano attuale', planWord: '', currentSubscription: 'Il Tuo Abbonamento Attuale', plan: 'Piano', status: 'Stato', renewsOn: 'Rinnovo Il', notAvailable: 'N/D', cancelNotice: 'Il tuo abbonamento verrà annullato alla fine del periodo di fatturazione corrente.', paymentHistory: 'Cronologia Pagamenti', recentTransactions: 'Le tue transazioni recenti', date: 'Data', amount: 'Importo', questions: 'Hai domande sui nostri piani?', contactSupport: 'Contatta il Supporto', loadError: 'Impossibile caricare le informazioni sull’abbonamento', statuses: { active: 'Attivo', succeeded: 'Riuscito', failed: 'Fallito', pending: 'In sospeso' },
    labels: { mostPopular: 'PIÙ POPOLARE', free: 'Gratis', month: 'mese', processing: 'Elaborazione...', selected: 'Selezionato', choose: 'Scegli', paymentFailed: 'Impossibile elaborare il pagamento', basicSuccess: 'Abbonamento al piano Basic completato!', redirecting: 'Reindirizzamento al checkout Stripe...', genericError: 'Si è verificato un errore. Riprova.' },
    plans: {
      Basic: { displayName: 'Base', description: 'Perfetto per le coppie che stanno iniziando', features: ['Accesso a oltre 50 Note d’Amore', 'Quiz relazionali di base', 'Idee mensili per appuntamenti (5 idee)', 'Promemoria anniversario', 'Timeline dei ricordi', 'Accesso all’app mobile', 'Supporto via e-mail'] },
      Premiere: { displayName: 'Premiere', description: 'Per le coppie pronte a crescere insieme', features: ['Tutto del piano Base, più:', 'Accesso a oltre 1000 Note d’Amore', 'Coach relazionale IA (50 domande/mese)', 'Idee illimitate per appuntamenti', 'Monitoraggio degli obiettivi di coppia', 'Quiz e approfondimenti avanzati', 'Programmazione di messaggi sorpresa', 'Esperienza senza pubblicità', 'Supporto prioritario', 'Accesso anticipato alle nuove funzionalità'] },
      Exclusive: { displayName: 'Esclusivo', description: 'Il kit completo per la relazione', features: ['Tutto del piano Premiere, più:', 'Libreria illimitata di Note d’Amore', 'Coach relazionale IA illimitato', 'Creatore di contenuti IA', 'Report relazionali personalizzati', 'Accesso esclusivo alla community', 'Consulenza individuale con un esperto', 'Supporto premium 24/7', 'Badge VIP e vantaggi', 'Accesso a vita ai contenuti premium'] }
    }
  },
  de: {
    choosePlan: 'Wähle Deinen Plan', subtitle: 'Schalte Premium-Funktionen frei, um eure Beziehung zu stärken', currentlyOn: 'Aktueller Plan', planWord: '', currentSubscription: 'Dein Aktuelles Abonnement', plan: 'Plan', status: 'Status', renewsOn: 'Verlängert Am', notAvailable: 'k. A.', cancelNotice: 'Dein Abonnement wird am Ende des aktuellen Abrechnungszeitraums gekündigt.', paymentHistory: 'Zahlungsverlauf', recentTransactions: 'Deine letzten Transaktionen', date: 'Datum', amount: 'Betrag', questions: 'Fragen zu unseren Plänen?', contactSupport: 'Support Kontaktieren', loadError: 'Abonnementinformationen konnten nicht geladen werden', statuses: { active: 'Aktiv', succeeded: 'Erfolgreich', failed: 'Fehlgeschlagen', pending: 'Ausstehend' },
    labels: { mostPopular: 'AM BELIEBTESTEN', free: 'Kostenlos', month: 'Monat', processing: 'Verarbeitung...', selected: 'Ausgewählt', choose: 'Wählen', paymentFailed: 'Zahlung konnte nicht verarbeitet werden', basicSuccess: 'Basic-Plan erfolgreich abonniert!', redirecting: 'Weiterleitung zur Stripe-Kasse...', genericError: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.' },
    plans: {
      Basic: { displayName: 'Basis', description: 'Ideal für Paare, die gerade anfangen', features: ['Zugriff auf über 50 Liebesnotizen', 'Grundlegende Beziehungsquizze', 'Monatliche Date-Ideen (5 Ideen)', 'Jahrestagserinnerungen', 'Erinnerungs-Zeitleiste', 'Zugriff auf die mobile App', 'E-Mail-Support'] },
      Premiere: { displayName: 'Premiere', description: 'Für Paare, die gemeinsam wachsen möchten', features: ['Alles aus Basis, plus:', 'Zugriff auf über 1000 Liebesnotizen', 'KI-Beziehungscoach (50 Fragen/Monat)', 'Unbegrenzte Date-Ideen', 'Tracker für Beziehungsziele', 'Erweiterte Quizze und Einblicke', 'Planung von Überraschungsnachrichten', 'Werbefreie Nutzung', 'Prioritäts-Support', 'Früher Zugriff auf neue Funktionen'] },
      Exclusive: { displayName: 'Exklusiv', description: 'Das komplette Beziehungs-Toolkit', features: ['Alles aus Premiere, plus:', 'Unbegrenzte Liebesnotizen-Bibliothek', 'Unbegrenzter KI-Beziehungscoach', 'KI-gestützter Content Creator', 'Personalisierte Beziehungsberichte', 'Exklusiver Community-Zugang', '1-zu-1-Expertenberatung', 'Premium-Support rund um die Uhr', 'VIP-Abzeichen und Vorteile', 'Lebenslanger Zugriff auf Premium-Inhalte'] }
    }
  },
  nl: {
    choosePlan: 'Kies Je Abonnement', subtitle: 'Ontgrendel premiumfuncties om jullie relatie te versterken', currentlyOn: 'Huidig abonnement', planWord: '', currentSubscription: 'Je Huidige Abonnement', plan: 'Abonnement', status: 'Status', renewsOn: 'Verlenging Op', notAvailable: 'N.v.t.', cancelNotice: 'Je abonnement wordt aan het einde van de huidige factureringsperiode beëindigd.', paymentHistory: 'Betalingsgeschiedenis', recentTransactions: 'Je recente transacties', date: 'Datum', amount: 'Bedrag', questions: 'Vragen over onze abonnementen?', contactSupport: 'Contact Opnemen', loadError: 'Abonnementsinformatie kon niet worden geladen', statuses: { active: 'Actief', succeeded: 'Geslaagd', failed: 'Mislukt', pending: 'In behandeling' },
    labels: { mostPopular: 'MEEST POPULAIR', free: 'Gratis', month: 'maand', processing: 'Bezig...', selected: 'Geselecteerd', choose: 'Kies', paymentFailed: 'Betaling kon niet worden verwerkt', basicSuccess: 'Basic-abonnement succesvol geactiveerd!', redirecting: 'Doorsturen naar Stripe-checkout...', genericError: 'Er is een fout opgetreden. Probeer het opnieuw.' },
    plans: {
      Basic: { displayName: 'Basis', description: 'Perfect voor koppels die net beginnen', features: ['Toegang tot 50+ liefdesbriefjes', 'Basis relatiequizzen', 'Maandelijkse date-ideeën (5 ideeën)', 'Jubileumherinneringen', 'Herinneringstijdlijn', 'Toegang tot mobiele app', 'E-mailondersteuning'] },
      Premiere: { displayName: 'Premiere', description: 'Voor koppels die klaar zijn om samen te groeien', features: ['Alles van Basis, plus:', 'Toegang tot 1000+ liefdesbriefjes', 'AI-relatiecoach (50 vragen/maand)', 'Onbeperkte date-ideeën', 'Tracker voor relatiedoelen', 'Geavanceerde quizzen en inzichten', 'Verrassingsberichten plannen', 'Advertentievrije ervaring', 'Prioriteitsondersteuning', 'Vroege toegang tot nieuwe functies'] },
      Exclusive: { displayName: 'Exclusief', description: 'De complete relatietoolkit', features: ['Alles van Premiere, plus:', 'Onbeperkte liefdesbriefjesbibliotheek', 'Onbeperkte AI-relatiecoach', 'AI-contentmaker', 'Gepersonaliseerde relatierapporten', 'Exclusieve communitytoegang', '1-op-1 consult met een expert', 'Premiumondersteuning 24/7', 'VIP-badge en voordelen', 'Levenslange toegang tot premiumcontent'] }
    }
  },
  pt: {
    choosePlan: 'Escolha Seu Plano', subtitle: 'Desbloqueie recursos premium para fortalecer seu relacionamento', currentlyOn: 'Plano atual', planWord: '', currentSubscription: 'Sua Assinatura Atual', plan: 'Plano', status: 'Status', renewsOn: 'Renova Em', notAvailable: 'N/D', cancelNotice: 'Sua assinatura será cancelada ao final do período de cobrança atual.', paymentHistory: 'Histórico de Pagamentos', recentTransactions: 'Suas transações recentes', date: 'Data', amount: 'Valor', questions: 'Tem dúvidas sobre nossos planos?', contactSupport: 'Contatar Suporte', loadError: 'Não foi possível carregar as informações da assinatura', statuses: { active: 'Ativo', succeeded: 'Concluído', failed: 'Falhou', pending: 'Pendente' },
    labels: { mostPopular: 'MAIS POPULAR', free: 'Grátis', month: 'mês', processing: 'Processando...', selected: 'Selecionado', choose: 'Escolher', paymentFailed: 'Não foi possível processar o pagamento', basicSuccess: 'Assinatura do plano Basic realizada com sucesso!', redirecting: 'Redirecionando para o checkout da Stripe...', genericError: 'Ocorreu um erro. Tente novamente.' },
    plans: {
      Basic: { displayName: 'Básico', description: 'Perfeito para casais que estão começando', features: ['Acesso a mais de 50 Notas de Amor', 'Questionários básicos de relacionamento', 'Ideias mensais para encontros (5 ideias)', 'Lembretes de aniversário', 'Linha do tempo de memórias', 'Acesso ao aplicativo móvel', 'Suporte por e-mail'] },
      Premiere: { displayName: 'Premiere', description: 'Para casais prontos para crescer juntos', features: ['Tudo do Básico, mais:', 'Acesso a mais de 1000 Notas de Amor', 'Coach de relacionamento com IA (50 perguntas/mês)', 'Ideias ilimitadas para encontros', 'Rastreador de metas de relacionamento', 'Questionários e insights avançados', 'Agendamento de mensagens surpresa', 'Experiência sem anúncios', 'Suporte prioritário', 'Acesso antecipado a novos recursos'] },
      Exclusive: { displayName: 'Exclusivo', description: 'O kit completo para o relacionamento', features: ['Tudo do Premiere, mais:', 'Biblioteca ilimitada de Notas de Amor', 'Coach de relacionamento com IA ilimitado', 'Criador de conteúdo com IA', 'Relatórios personalizados de relacionamento', 'Acesso exclusivo à comunidade', 'Consulta individual com especialista', 'Suporte premium 24/7', 'Selo VIP e benefícios', 'Acesso vitalício ao conteúdo premium'] }
    }
  }
};

const tierBase = {
  Basic: { name: 'Basic', price: 0, icon: '💝', gradient: 'from-blue-400 to-blue-600', popular: false, isFree: true },
  Premiere: { name: 'Premiere', price: 19.99, icon: '💖', gradient: 'from-purple-400 to-pink-500', popular: true, priceId: import.meta.env.VITE_STRIPE_PRICE_PREMIERE || 'price_premiere' },
  Exclusive: { name: 'Exclusive', price: 34.99, icon: '👑', gradient: 'from-yellow-400 to-orange-500', popular: false, priceId: import.meta.env.VITE_STRIPE_PRICE_EXCLUSIVE || 'price_exclusive' }
};

export default function Subscription() {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

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

  const currentPlanRaw = user?.subscription_plan || 'Basic';
  const currentPlan = currentPlanRaw === 'Basis' ? 'Basic' : currentPlanRaw;
  const currentPlanDisplay = t.plans[currentPlan]?.displayName || currentPlan;
  const tiers = useMemo(() => ['Basic', 'Premiere', 'Exclusive'].map((name) => ({ ...tierBase[name], ...t.plans[name], periodLabel: t.labels.month })), [t]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(currentLanguage || 'en', { year: 'numeric', month: 'short', day: '2-digit' }), [currentLanguage]);
  const statusLabel = (status) => t.statuses[status] || status;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">{t.choosePlan}</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">{t.subtitle}</p>
          <p className="text-sm text-gray-500">
            {t.currentlyOn}: <span className="font-bold text-purple-600">{currentPlanDisplay}</span>{t.planWord ? ` ${t.planWord}` : ''}
          </p>
        </div>

        {currentSubscription && currentSubscription.subscription_status === 'active' && currentPlan !== 'Basic' && (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, index) => <TierCard key={tier.name} tier={tier} index={index} isSelected={currentPlan === tier.name} showPayment={true} labels={t.labels} />)}
        </div>

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
