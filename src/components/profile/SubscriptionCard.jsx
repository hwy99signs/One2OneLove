import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check, ArrowRight, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { subscriptionPlanCopy } from '@/data/subscriptionPlanCopy';

const planMeta = {
  Basic: { icon: '💝', gradient: 'from-blue-400 to-blue-600', price: 4.99 },
  Premiere: { icon: '💖', gradient: 'from-purple-400 to-pink-500', price: 9.99 },
  Exclusive: { icon: '👑', gradient: 'from-yellow-400 to-orange-500', price: 19.99 },
};

const translations = {
  en: {
    currentPlan: 'Current Plan', viewPlans: 'View All Plans', planFeatures: 'Plan Features', unlockMore: 'Unlock More Features', perMonth: 'per month', free: 'FREE', moreFeatures: 'more features', upgrade: 'Upgrade Plan', upgradeText: 'Upgrade to Premiere or Exclusive for unlimited features!',
    names: { Basic: 'Basic', Premiere: 'Premiere', Exclusive: 'Exclusive' },
    features: {
      Basic: ['Access to 50+ Love Notes Library', 'Basic Relationship Quizzes', 'Monthly Date Ideas (5 ideas)', 'Anniversary Reminders', 'Digital Memory Timeline', 'Mobile App Access', 'Email Support'],
      Premiere: ['Everything in Basic, plus:', '1000+ Love Notes Library', 'AI Relationship Coach (50 questions/month)', 'Unlimited Date Ideas with Filters', 'Relationship Goals Tracker', 'Advanced Quizzes & Compatibility Tests', 'Schedule Surprise Messages', 'Ad-Free Experience', 'Priority Support'],
      Exclusive: ['Everything in Premiere, plus:', 'Unlimited Love Notes Library', 'Unlimited AI Relationship Coach', 'AI Content Creator (poems, letters)', 'Personalized Relationship Reports', 'Exclusive Couples Community Access', '1-on-1 Expert Consultation (1/month)', 'Premium WhatsApp Support', 'VIP Badge & Recognition']
    }
  },
  es: {
    currentPlan: 'Plan Actual', viewPlans: 'Ver Todos los Planes', planFeatures: 'Características del Plan', unlockMore: 'Desbloquear Más Funciones', perMonth: 'por mes', free: 'GRATIS', moreFeatures: 'funciones más', upgrade: 'Mejorar Plan', upgradeText: '¡Mejora a Premiere o Exclusive para obtener funciones ilimitadas!',
    names: { Basic: 'Básico', Premiere: 'Premiere', Exclusive: 'Exclusivo' },
    features: {
      Basic: ['Acceso a más de 50 notas de amor', 'Cuestionarios básicos de relación', 'Ideas mensuales para citas (5 ideas)', 'Recordatorios de aniversario', 'Línea de tiempo digital de recuerdos', 'Acceso a la aplicación móvil', 'Soporte por correo electrónico'],
      Premiere: ['Todo lo de Básico, más:', 'Más de 1000 notas de amor', 'Coach de relación con IA (50 preguntas/mes)', 'Ideas ilimitadas para citas con filtros', 'Seguimiento de metas de relación', 'Cuestionarios avanzados y pruebas de compatibilidad', 'Programar mensajes sorpresa', 'Experiencia sin anuncios', 'Soporte prioritario'],
      Exclusive: ['Todo lo de Premiere, más:', 'Biblioteca ilimitada de notas de amor', 'Coach de relación con IA ilimitado', 'Creador de contenido con IA', 'Informes personalizados de relación', 'Acceso exclusivo a la comunidad de parejas', 'Consulta individual con un experto (1/mes)', 'Soporte premium por WhatsApp', 'Insignia VIP y reconocimiento']
    }
  },
  fr: {
    currentPlan: 'Plan Actuel', viewPlans: 'Voir Tous les Plans', planFeatures: 'Fonctionnalités du Plan', unlockMore: 'Débloquer Plus de Fonctionnalités', perMonth: 'par mois', free: 'GRATUIT', moreFeatures: 'fonctionnalités supplémentaires', upgrade: 'Améliorer le Plan', upgradeText: 'Passez à Premiere ou Exclusive pour profiter de fonctionnalités illimitées !',
    names: { Basic: 'Basique', Premiere: 'Première', Exclusive: 'Exclusif' },
    features: {
      Basic: ['Accès à plus de 50 Notes d’Amour', 'Quiz relationnels de base', 'Idées de rendez-vous mensuelles (5 idées)', 'Rappels d’anniversaire', 'Chronologie numérique des souvenirs', 'Accès à l’application mobile', 'Assistance par e-mail'],
      Premiere: ['Tout ce qui est inclus dans Basique, plus :', 'Plus de 1000 Notes d’Amour', 'Coach relationnel IA (50 questions/mois)', 'Idées de rendez-vous illimitées avec filtres', 'Suivi des objectifs de relation', 'Quiz avancés et tests de compatibilité', 'Programmation de messages surprise', 'Expérience sans publicité', 'Assistance prioritaire'],
      Exclusive: ['Tout ce qui est inclus dans Première, plus :', 'Bibliothèque illimitée de Notes d’Amour', 'Coach relationnel IA illimité', 'Créateur de contenu IA', 'Rapports relationnels personnalisés', 'Accès exclusif à la communauté des couples', 'Consultation individuelle avec un expert (1/mois)', 'Assistance WhatsApp premium', 'Badge VIP et reconnaissance']
    }
  },
  it: {
    currentPlan: 'Piano Attuale', viewPlans: 'Visualizza Tutti i Piani', planFeatures: 'Caratteristiche del Piano', unlockMore: 'Sblocca Altre Funzionalità', perMonth: 'al mese', free: 'GRATIS', moreFeatures: 'altre funzionalità', upgrade: 'Aggiorna Piano', upgradeText: 'Passa a Premiere o Exclusive per funzionalità illimitate!',
    names: { Basic: 'Base', Premiere: 'Premiere', Exclusive: 'Esclusivo' },
    features: {
      Basic: ['Accesso a oltre 50 Note d’Amore', 'Quiz relazionali di base', 'Idee mensili per appuntamenti (5 idee)', 'Promemoria anniversario', 'Timeline digitale dei ricordi', 'Accesso all’app mobile', 'Supporto via e-mail'],
      Premiere: ['Tutto del piano Base, più:', 'Oltre 1000 Note d’Amore', 'Coach relazionale IA (50 domande/mese)', 'Idee illimitate per appuntamenti con filtri', 'Monitoraggio degli obiettivi di coppia', 'Quiz avanzati e test di compatibilità', 'Programmazione di messaggi sorpresa', 'Esperienza senza pubblicità', 'Supporto prioritario'],
      Exclusive: ['Tutto del piano Premiere, più:', 'Libreria illimitata di Note d’Amore', 'Coach relazionale IA illimitato', 'Creatore di contenuti IA', 'Report relazionali personalizzati', 'Accesso esclusivo alla community delle coppie', 'Consulenza individuale con un esperto (1/mese)', 'Supporto WhatsApp premium', 'Badge VIP e riconoscimento']
    }
  },
  de: {
    currentPlan: 'Aktueller Plan', viewPlans: 'Alle Pläne Anzeigen', planFeatures: 'Plan-Funktionen', unlockMore: 'Mehr Funktionen Freischalten', perMonth: 'pro Monat', free: 'KOSTENLOS', moreFeatures: 'weitere Funktionen', upgrade: 'Plan Upgraden', upgradeText: 'Upgrade auf Premiere oder Exclusive für unbegrenzte Funktionen!',
    names: { Basic: 'Basis', Premiere: 'Premiere', Exclusive: 'Exklusiv' },
    features: {
      Basic: ['Zugriff auf über 50 Liebesnotizen', 'Grundlegende Beziehungsquizze', 'Monatliche Date-Ideen (5 Ideen)', 'Jahrestagserinnerungen', 'Digitale Erinnerungs-Zeitleiste', 'Zugriff auf die mobile App', 'E-Mail-Support'],
      Premiere: ['Alles aus Basis, plus:', 'Über 1000 Liebesnotizen', 'KI-Beziehungscoach (50 Fragen/Monat)', 'Unbegrenzte Date-Ideen mit Filtern', 'Tracker für Beziehungsziele', 'Erweiterte Quizze und Kompatibilitätstests', 'Überraschungsnachrichten planen', 'Werbefreie Nutzung', 'Prioritäts-Support'],
      Exclusive: ['Alles aus Premiere, plus:', 'Unbegrenzte Liebesnotizen-Bibliothek', 'Unbegrenzter KI-Beziehungscoach', 'KI-Content Creator', 'Personalisierte Beziehungsberichte', 'Exklusiver Community-Zugang für Paare', '1-zu-1-Expertenberatung (1/Monat)', 'Premium-WhatsApp-Support', 'VIP-Abzeichen und Anerkennung']
    }
  },
  nl: {
    currentPlan: 'Huidig Abonnement', viewPlans: 'Bekijk Alle Abonnementen', planFeatures: 'Abonnementsfuncties', unlockMore: 'Ontgrendel Meer Functies', perMonth: 'per maand', free: 'GRATIS', moreFeatures: 'meer functies', upgrade: 'Abonnement Upgraden', upgradeText: 'Upgrade naar Premiere of Exclusive voor onbeperkte functies!',
    names: { Basic: 'Basis', Premiere: 'Premiere', Exclusive: 'Exclusief' },
    features: {
      Basic: ['Toegang tot 50+ liefdesbriefjes', 'Basis relatiequizzen', 'Maandelijkse date-ideeën (5 ideeën)', 'Jubileumherinneringen', 'Digitale herinneringstijdlijn', 'Toegang tot mobiele app', 'E-mailondersteuning'],
      Premiere: ['Alles van Basis, plus:', '1000+ liefdesbriefjes', 'AI-relatiecoach (50 vragen/maand)', 'Onbeperkte date-ideeën met filters', 'Tracker voor relatiedoelen', 'Geavanceerde quizzen en compatibiliteitstests', 'Verrassingsberichten plannen', 'Advertentievrije ervaring', 'Prioriteitsondersteuning'],
      Exclusive: ['Alles van Premiere, plus:', 'Onbeperkte liefdesbriefjesbibliotheek', 'Onbeperkte AI-relatiecoach', 'AI-contentmaker', 'Gepersonaliseerde relatierapporten', 'Exclusieve communitytoegang voor koppels', '1-op-1 expertconsult (1/maand)', 'Premium WhatsApp-ondersteuning', 'VIP-badge en erkenning']
    }
  },
  pt: {
    currentPlan: 'Plano Atual', viewPlans: 'Ver Todos os Planos', planFeatures: 'Recursos do Plano', unlockMore: 'Desbloquear Mais Recursos', perMonth: 'por mês', free: 'GRÁTIS', moreFeatures: 'recursos a mais', upgrade: 'Melhorar Plano', upgradeText: 'Faça upgrade para Premiere ou Exclusive e tenha recursos ilimitados!',
    names: { Basic: 'Básico', Premiere: 'Premiere', Exclusive: 'Exclusivo' },
    features: {
      Basic: ['Acesso a mais de 50 Notas de Amor', 'Questionários básicos de relacionamento', 'Ideias mensais para encontros (5 ideias)', 'Lembretes de aniversário', 'Linha do tempo digital de memórias', 'Acesso ao aplicativo móvel', 'Suporte por e-mail'],
      Premiere: ['Tudo do Básico, mais:', 'Mais de 1000 Notas de Amor', 'Coach de relacionamento com IA (50 perguntas/mês)', 'Ideias ilimitadas para encontros com filtros', 'Rastreador de metas de relacionamento', 'Questionários avançados e testes de compatibilidade', 'Agendar mensagens surpresa', 'Experiência sem anúncios', 'Suporte prioritário'],
      Exclusive: ['Tudo do Premiere, mais:', 'Biblioteca ilimitada de Notas de Amor', 'Coach de relacionamento com IA ilimitado', 'Criador de conteúdo com IA', 'Relatórios personalizados de relacionamento', 'Acesso exclusivo à comunidade de casais', 'Consulta individual com especialista (1/mês)', 'Suporte premium por WhatsApp', 'Selo VIP e reconhecimento']
    }
  }
};

export default function SubscriptionCard({ user, currentLanguage = 'en' }) {
  const t = translations[currentLanguage] || translations.en;
  const rawPlan = user?.subscription_plan || 'Basic';
  const userPlan = rawPlan === 'Basis' ? 'Basic' : rawPlan;
  const planInfo = planMeta[userPlan] || planMeta.Basic;
  const launchPlanCopy = (subscriptionPlanCopy[currentLanguage] || subscriptionPlanCopy.en).plans;
  const planCopy = launchPlanCopy[userPlan] || launchPlanCopy.Basic;
  const features = planCopy.features;
  const isBasic = userPlan === 'Basic';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className={`shadow-xl border-2 ${isBasic ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${planInfo.gradient} rounded-xl flex items-center justify-center shadow-lg`}><span className="text-2xl">{planInfo.icon}</span></div>
              <div><p className="text-sm text-gray-600">{t.currentPlan}</p><h3 className="text-2xl font-bold text-gray-900">{planCopy.displayName || t.names[userPlan] || userPlan}</h3></div>
            </div>
            <div className="text-right">
              <><div className="text-2xl font-bold text-gray-900">${planInfo.price}</div><div className="text-xs text-gray-600">{t.perMonth}</div></>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" />{t.planFeatures}</h4>
            <div className="space-y-2">
              {features.slice(0, 5).map((feature, index) => <div key={index} className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-sm text-gray-700">{feature}</span></div>)}
              {features.length > 5 && <p className="text-sm text-gray-500 italic">+ {features.length - 5} {t.moreFeatures}</p>}
            </div>
          </div>

          {isBasic && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3"><Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" /><div><h5 className="font-bold text-gray-900 mb-1">{t.unlockMore}</h5><p className="text-sm text-gray-700">{t.upgradeText}</p></div></div>
              <Link to={createPageUrl('Subscription')}><Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">{t.upgrade}<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
            </div>
          )}

          <Link to={createPageUrl('Subscription')}><Button variant="outline" className="w-full">{t.viewPlans}<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
