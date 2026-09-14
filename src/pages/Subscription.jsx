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
    choosePlan: 'Compare One2OneLove Plans',
    subtitle: 'Choose the level of relationship tools and experiences that fits you',
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
      mostPopular: 'MOST POPULAR', free: 'Free', month: 'month', pricingPending: 'Pricing to be finalized', pricingPendingButton: 'Pricing coming next', processing: 'Processing...', selected: 'Selected', choose: 'Choose',
      paymentFailed: 'Failed to process payment', basicSuccess: 'Successfully subscribed to Basic plan!', redirecting: 'Redirecting to Stripe checkout...', genericError: 'An error occurred. Please try again.'
    },
    plans: {
      Basic: {
        displayName: 'Basic',
        description: 'Core tools for couples building and maintaining connection',
        features: ['Love Notes', 'Relationship Quizzes', 'Date Ideas', 'Anniversary Tracker', 'Memory Lane', 'Relationship Goals', 'Couples Calendar', 'Community & Chat']
      },
      Premiere: {
        displayName: 'Premiere',
        description: 'Deeper tools for couples who want to grow together',
        features: ['Everything in Basic, plus:', 'AI Relationship Coach', 'Shared Journals', 'Relationship Milestones', 'Communication Practice', 'Meditation', 'Couple Activities', 'Cooperative Games', 'Find Friends & Friend Requests']
      },
      Exclusive: {
        displayName: 'Exclusive',
        description: 'The broadest One2OneLove relationship experience',
        features: ['Everything in Premiere, plus:', 'AI Content Creator', 'Couples Dashboard', 'Couples Profile', 'Premium Features Hub', 'Achievements & Leaderboard', 'Counseling Support', 'Articles & Podcast Support', 'Influencer & Community Support', 'LGBTQ Relationship Support']
      }
    }
  },
  es: {
    choosePlan: 'Compara los Planes de One2OneLove',
    subtitle: 'Elige el nivel de herramientas y experiencias para la relación que mejor se adapte a ti',
    currentlyOn: 'Actualmente en', planWord: 'plan', currentSubscription: 'Tu Suscripción Actual', plan: 'Plan', status: 'Estado', renewsOn: 'Se Renueva El', notAvailable: 'N/D', cancelNotice: 'Tu suscripción se cancelará al final del período de facturación actual.', paymentHistory: 'Historial de Pagos', recentTransactions: 'Tus transacciones recientes', date: 'Fecha', amount: 'Monto', questions: '¿Tienes preguntas sobre nuestros planes?', contactSupport: 'Contactar Soporte', loadError: 'No se pudo cargar la información de la suscripción', statuses: { active: 'Activo', succeeded: 'Completado', failed: 'Fallido', pending: 'Pendiente' },
    labels: { mostPopular: 'MÁS POPULAR', free: 'Gratis', month: 'mes', pricingPending: 'Precio por finalizar', pricingPendingButton: 'Precio próximamente', processing: 'Procesando...', selected: 'Seleccionado', choose: 'Elegir', paymentFailed: 'No se pudo procesar el pago', basicSuccess: '¡Te suscribiste correctamente al plan Basic!', redirecting: 'Redirigiendo al pago de Stripe...', genericError: 'Ocurrió un error. Inténtalo de nuevo.' },
    plans: {
      Basic: { displayName: 'Básico', description: 'Herramientas esenciales para parejas que construyen y mantienen su conexión', features: ['Notas de Amor', 'Cuestionarios de Relación', 'Ideas para Citas', 'Seguimiento de Aniversarios', 'Memory Lane', 'Metas de Relación', 'Calendario de Pareja', 'Comunidad y Chat'] },
      Premiere: { displayName: 'Premiere', description: 'Herramientas más profundas para parejas que quieren crecer juntas', features: ['Todo lo de Básico, más:', 'Coach de Relación con IA', 'Diarios Compartidos', 'Hitos de la Relación', 'Práctica de Comunicación', 'Meditación', 'Actividades en Pareja', 'Juegos Cooperativos', 'Buscar Amigos y Solicitudes de Amistad'] },
      Exclusive: { displayName: 'Exclusivo', description: 'La experiencia de relación más amplia de One2OneLove', features: ['Todo lo de Premiere, más:', 'Creador de Contenido con IA', 'Panel de Pareja', 'Perfil de Pareja', 'Centro de Funciones Premium', 'Logros y Clasificación', 'Apoyo de Consejería', 'Artículos y Podcasts', 'Apoyo de Influencers y Comunidad', 'Apoyo para Relaciones LGBTQ'] }
    }
  },
  fr: {
    choosePlan: 'Comparez les Formules One2OneLove',
    subtitle: 'Choisissez le niveau d’outils et d’expériences relationnelles qui vous convient',
    currentlyOn: 'Formule actuelle', planWord: '', currentSubscription: 'Votre Abonnement Actuel', plan: 'Formule', status: 'Statut', renewsOn: 'Renouvellement Le', notAvailable: 'N/D', cancelNotice: 'Votre abonnement sera annulé à la fin de la période de facturation en cours.', paymentHistory: 'Historique des Paiements', recentTransactions: 'Vos transactions récentes', date: 'Date', amount: 'Montant', questions: 'Des questions sur nos formules ?', contactSupport: 'Contacter le Support', loadError: 'Impossible de charger les informations d’abonnement', statuses: { active: 'Actif', succeeded: 'Réussi', failed: 'Échoué', pending: 'En attente' },
    labels: { mostPopular: 'LE PLUS POPULAIRE', free: 'Gratuit', month: 'mois', pricingPending: 'Tarification à finaliser', pricingPendingButton: 'Tarification à venir', processing: 'Traitement...', selected: 'Sélectionné', choose: 'Choisir', paymentFailed: 'Échec du traitement du paiement', basicSuccess: 'Abonnement au plan Basic effectué avec succès !', redirecting: 'Redirection vers le paiement Stripe...', genericError: 'Une erreur s’est produite. Veuillez réessayer.' },
    plans: {
      Basic: { displayName: 'Basique', description: 'Les outils essentiels pour les couples qui construisent et entretiennent leur lien', features: ['Notes d’Amour', 'Quiz Relationnels', 'Idées de Rendez-vous', 'Suivi des Anniversaires', 'Memory Lane', 'Objectifs de Relation', 'Calendrier du Couple', 'Communauté et Chat'] },
      Premiere: { displayName: 'Première', description: 'Des outils plus approfondis pour les couples qui veulent grandir ensemble', features: ['Tout ce qui est inclus dans Basique, plus :', 'Coach Relationnel IA', 'Journaux Partagés', 'Étapes de la Relation', 'Pratique de la Communication', 'Méditation', 'Activités de Couple', 'Jeux Coopératifs', 'Trouver des Amis et Demandes d’Amitié'] },
      Exclusive: { displayName: 'Exclusif', description: 'L’expérience relationnelle One2OneLove la plus complète', features: ['Tout ce qui est inclus dans Première, plus :', 'Créateur de Contenu IA', 'Tableau de Bord du Couple', 'Profil du Couple', 'Centre de Fonctions Premium', 'Réussites et Classement', 'Soutien de Conseil', 'Articles et Podcasts', 'Soutien Influenceurs et Communauté', 'Soutien aux Relations LGBTQ'] }
    }
  },
  it: {
    choosePlan: 'Confronta i Piani One2OneLove',
    subtitle: 'Scegli il livello di strumenti ed esperienze di coppia più adatto a te',
    currentlyOn: 'Piano attuale', planWord: '', currentSubscription: 'Il Tuo Abbonamento Attuale', plan: 'Piano', status: 'Stato', renewsOn: 'Rinnovo Il', notAvailable: 'N/D', cancelNotice: 'Il tuo abbonamento verrà annullato alla fine del periodo di fatturazione corrente.', paymentHistory: 'Cronologia Pagamenti', recentTransactions: 'Le tue transazioni recenti', date: 'Data', amount: 'Importo', questions: 'Hai domande sui nostri piani?', contactSupport: 'Contatta il Supporto', loadError: 'Impossibile caricare le informazioni sull’abbonamento', statuses: { active: 'Attivo', succeeded: 'Riuscito', failed: 'Fallito', pending: 'In sospeso' },
    labels: { mostPopular: 'PIÙ POPOLARE', free: 'Gratis', month: 'mese', pricingPending: 'Prezzo da definire', pricingPendingButton: 'Prezzo in arrivo', processing: 'Elaborazione...', selected: 'Selezionato', choose: 'Scegli', paymentFailed: 'Impossibile elaborare il pagamento', basicSuccess: 'Abbonamento al piano Basic completato!', redirecting: 'Reindirizzamento al checkout Stripe...', genericError: 'Si è verificato un errore. Riprova.' },
    plans: {
      Basic: { displayName: 'Base', description: 'Strumenti essenziali per le coppie che costruiscono e mantengono il legame', features: ['Note d’Amore', 'Quiz di Relazione', 'Idee per Appuntamenti', 'Tracker degli Anniversari', 'Memory Lane', 'Obiettivi di Relazione', 'Calendario di Coppia', 'Community e Chat'] },
      Premiere: { displayName: 'Premiere', description: 'Strumenti più approfonditi per le coppie che vogliono crescere insieme', features: ['Tutto del piano Base, più:', 'Coach Relazionale IA', 'Diari Condivisi', 'Traguardi della Relazione', 'Pratica di Comunicazione', 'Meditazione', 'Attività di Coppia', 'Giochi Cooperativi', 'Trova Amici e Richieste di Amicizia'] },
      Exclusive: { displayName: 'Esclusivo', description: 'L’esperienza One2OneLove più completa', features: ['Tutto del piano Premiere, più:', 'Creatore di Contenuti IA', 'Dashboard di Coppia', 'Profilo di Coppia', 'Hub Funzioni Premium', 'Risultati e Classifica', 'Supporto di Consulenza', 'Articoli e Podcast', 'Supporto Influencer e Community', 'Supporto Relazioni LGBTQ'] }
    }
  },
  de: {
    choosePlan: 'One2OneLove-Pläne Vergleichen',
    subtitle: 'Wählen Sie die passenden Beziehungstools und Erlebnisse für sich',
    currentlyOn: 'Aktueller Plan', planWord: '', currentSubscription: 'Dein Aktuelles Abonnement', plan: 'Plan', status: 'Status', renewsOn: 'Verlängert Am', notAvailable: 'k. A.', cancelNotice: 'Dein Abonnement wird am Ende des aktuellen Abrechnungszeitraums gekündigt.', paymentHistory: 'Zahlungsverlauf', recentTransactions: 'Deine letzten Transaktionen', date: 'Datum', amount: 'Betrag', questions: 'Fragen zu unseren Plänen?', contactSupport: 'Support Kontaktieren', loadError: 'Abonnementinformationen konnten nicht geladen werden', statuses: { active: 'Aktiv', succeeded: 'Erfolgreich', failed: 'Fehlgeschlagen', pending: 'Ausstehend' },
    labels: { mostPopular: 'AM BELIEBTESTEN', free: 'Kostenlos', month: 'Monat', pricingPending: 'Preis wird noch festgelegt', pricingPendingButton: 'Preis folgt als Nächstes', processing: 'Verarbeitung...', selected: 'Ausgewählt', choose: 'Wählen', paymentFailed: 'Zahlung konnte nicht verarbeitet werden', basicSuccess: 'Basic-Plan erfolgreich abonniert!', redirecting: 'Weiterleitung zur Stripe-Kasse...', genericError: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.' },
    plans: {
      Basic: { displayName: 'Basis', description: 'Grundlegende Tools für Paare, die ihre Verbindung aufbauen und pflegen', features: ['Liebesnotizen', 'Beziehungsquizze', 'Date-Ideen', 'Jahrestags-Tracker', 'Memory Lane', 'Beziehungsziele', 'Paarkalender', 'Community und Chat'] },
      Premiere: { displayName: 'Premiere', description: 'Vertiefende Tools für Paare, die gemeinsam wachsen möchten', features: ['Alles aus Basis, plus:', 'KI-Beziehungscoach', 'Geteilte Tagebücher', 'Beziehungsmeilensteine', 'Kommunikationsübungen', 'Meditation', 'Paaraktivitäten', 'Kooperative Spiele', 'Freunde Finden und Freundschaftsanfragen'] },
      Exclusive: { displayName: 'Exklusiv', description: 'Das umfassendste One2OneLove-Beziehungserlebnis', features: ['Alles aus Premiere, plus:', 'KI-Content-Creator', 'Paar-Dashboard', 'Paarprofil', 'Premium-Funktionen-Hub', 'Erfolge und Bestenliste', 'Beratungsunterstützung', 'Artikel und Podcasts', 'Influencer- und Community-Support', 'LGBTQ-Beziehungsunterstützung'] }
    }
  },
  nl: {
    choosePlan: 'Vergelijk One2OneLove-abonnementen',
    subtitle: 'Kies het niveau van relatietools en ervaringen dat bij jullie past',
    currentlyOn: 'Huidig abonnement', planWord: '', currentSubscription: 'Je Huidige Abonnement', plan: 'Abonnement', status: 'Status', renewsOn: 'Verlenging Op', notAvailable: 'N.v.t.', cancelNotice: 'Je abonnement wordt aan het einde van de huidige factureringsperiode beëindigd.', paymentHistory: 'Betalingsgeschiedenis', recentTransactions: 'Je recente transacties', date: 'Datum', amount: 'Bedrag', questions: 'Vragen over onze abonnementen?', contactSupport: 'Contact Opnemen', loadError: 'Abonnementsinformatie kon niet worden geladen', statuses: { active: 'Actief', succeeded: 'Geslaagd', failed: 'Mislukt', pending: 'In behandeling' },
    labels: { mostPopular: 'MEEST POPULAIR', free: 'Gratis', month: 'maand', pricingPending: 'Prijs wordt nog vastgesteld', pricingPendingButton: 'Prijs volgt hierna', processing: 'Bezig...', selected: 'Geselecteerd', choose: 'Kies', paymentFailed: 'Betaling kon niet worden verwerkt', basicSuccess: 'Basic-abonnement succesvol geactiveerd!', redirecting: 'Doorsturen naar Stripe-checkout...', genericError: 'Er is een fout opgetreden. Probeer het opnieuw.' },
    plans: {
      Basic: { displayName: 'Basis', description: 'Kernfuncties voor koppels die hun verbinding opbouwen en onderhouden', features: ['Liefdesnotities', 'Relatiequizzen', 'Date-ideeën', 'Jubileumtracker', 'Memory Lane', 'Relatiedoelen', 'Koppelkalender', 'Community en Chat'] },
      Premiere: { displayName: 'Premiere', description: 'Diepere tools voor koppels die samen willen groeien', features: ['Alles van Basis, plus:', 'AI-relatiecoach', 'Gedeelde Dagboeken', 'Relatiemijlpalen', 'Communicatieoefeningen', 'Meditatie', 'Koppelactiviteiten', 'Coöperatieve Spellen', 'Vrienden Vinden en Vriendschapsverzoeken'] },
      Exclusive: { displayName: 'Exclusive', description: 'De meest uitgebreide One2OneLove-relatie-ervaring', features: ['Alles van Premiere, plus:', 'AI-contentmaker', 'Koppeldashboard', 'Koppelprofiel', 'Premiumfuncties-hub', 'Prestaties en Ranglijst', 'Ondersteuning bij Counseling', 'Artikelen en Podcasts', 'Influencer- en Communityondersteuning', 'LGBTQ-relatieondersteuning'] }
    }
  },
  pt: {
    choosePlan: 'Compare os Planos One2OneLove',
    subtitle: 'Escolha o nível de ferramentas e experiências de relacionamento que combina com você',
    currentlyOn: 'Plano atual', planWord: '', currentSubscription: 'Sua Assinatura Atual', plan: 'Plano', status: 'Status', renewsOn: 'Renova Em', notAvailable: 'N/D', cancelNotice: 'Sua assinatura será cancelada ao final do período de cobrança atual.', paymentHistory: 'Histórico de Pagamentos', recentTransactions: 'Suas transações recentes', date: 'Data', amount: 'Valor', questions: 'Tem dúvidas sobre nossos planos?', contactSupport: 'Contatar Suporte', loadError: 'Não foi possível carregar as informações da assinatura', statuses: { active: 'Ativo', succeeded: 'Concluído', failed: 'Falhou', pending: 'Pendente' },
    labels: { mostPopular: 'MAIS POPULAR', free: 'Grátis', month: 'mês', pricingPending: 'Preço a ser definido', pricingPendingButton: 'Preço em breve', processing: 'Processando...', selected: 'Selecionado', choose: 'Escolher', paymentFailed: 'Falha ao processar o pagamento', basicSuccess: 'Assinatura do plano Basic realizada com sucesso!', redirecting: 'Redirecionando para o checkout Stripe...', genericError: 'Ocorreu um erro. Tente novamente.' },
    plans: {
      Basic: { displayName: 'Básico', description: 'Ferramentas essenciais para casais que constroem e mantêm sua conexão', features: ['Notas de Amor', 'Questionários de Relacionamento', 'Ideias para Encontros', 'Rastreador de Aniversários', 'Memory Lane', 'Metas de Relacionamento', 'Calendário do Casal', 'Comunidade e Chat'] },
      Premiere: { displayName: 'Premiere', description: 'Ferramentas mais profundas para casais que querem crescer juntos', features: ['Tudo do Básico, mais:', 'Coach de Relacionamento com IA', 'Diários Compartilhados', 'Marcos do Relacionamento', 'Prática de Comunicação', 'Meditação', 'Atividades para Casais', 'Jogos Cooperativos', 'Encontrar Amigos e Solicitações de Amizade'] },
      Exclusive: { displayName: 'Exclusivo', description: 'A experiência de relacionamento One2OneLove mais completa', features: ['Tudo do Premiere, mais:', 'Criador de Conteúdo com IA', 'Painel do Casal', 'Perfil do Casal', 'Central de Recursos Premium', 'Conquistas e Classificação', 'Apoio de Aconselhamento', 'Artigos e Podcasts', 'Apoio de Influenciadores e Comunidade', 'Apoio a Relacionamentos LGBTQ'] }
    }
  }
};

const tierBase = {
  Basic: { name: 'Basic', price: null, icon: '💝', gradient: 'from-blue-400 to-blue-600', popular: false, isFree: false, checkoutDisabled: true },
  Premiere: { name: 'Premiere', price: null, icon: '💖', gradient: 'from-purple-400 to-pink-500', popular: true, priceId: import.meta.env.VITE_STRIPE_PRICE_PREMIERE || 'price_premiere', checkoutDisabled: true },
  Exclusive: { name: 'Exclusive', price: null, icon: '👑', gradient: 'from-yellow-400 to-orange-500', popular: false, priceId: import.meta.env.VITE_STRIPE_PRICE_EXCLUSIVE || 'price_exclusive', checkoutDisabled: true }
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
