import React from 'react';
import { ArrowLeft, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const COPY = {
  en: { eyebrow: 'MEMBERSHIP ROADMAP', title: 'This membership feature is being prepared.', body: 'The feature exists in the earlier One2OneLove prototype, but it has not yet passed the relaunch privacy, data, product and real-functionality review. We are keeping it out of the active beta instead of presenting unfinished behavior as complete.', detail: 'The relaunch membership starts with the reviewed premium foundation: AI Relationship Coach, AI Content Creator and Relationship Goals. Additional couple tools can be released after their own controlled review.', back: 'Back', membership: 'View Membership' },
  es: { eyebrow: 'HOJA DE RUTA DE MEMBRESÍA', title: 'Esta función de membresía se está preparando.', body: 'La función existe en el prototipo anterior de One2OneLove, pero aún no ha pasado la revisión de privacidad, datos, producto y funcionalidad real del relanzamiento. La mantenemos fuera de la beta activa en lugar de presentar algo inacabado como completo.', detail: 'La membresía del relanzamiento comienza con la base premium revisada: Coach de Relaciones IA, Creador de Contenido IA y Metas de Relación. Las demás herramientas de pareja se publicarán después de su propia revisión controlada.', back: 'Volver', membership: 'Ver Membresía' },
  fr: { eyebrow: 'FEUILLE DE ROUTE ADHÉSION', title: 'Cette fonction d’adhésion est en préparation.', body: 'La fonction existe dans l’ancien prototype One2OneLove, mais n’a pas encore passé la revue de confidentialité, données, produit et fonctionnement réel de la relance. Elle reste hors de la bêta active plutôt que d’être présentée comme terminée.', detail: 'L’adhésion de relance commence par la base premium examinée : Coach Relationnel IA, Créateur de Contenu IA et Objectifs de Relation. Les autres outils de couple pourront être publiés après leur propre revue contrôlée.', back: 'Retour', membership: 'Voir l’Adhésion' },
  it: { eyebrow: 'ROADMAP ABBONAMENTO', title: 'Questa funzione di abbonamento è in preparazione.', body: 'La funzione esiste nel precedente prototipo One2OneLove, ma non ha ancora superato la revisione di privacy, dati, prodotto e reale funzionalità del rilancio. La teniamo fuori dalla beta attiva invece di presentare un comportamento incompleto come finito.', detail: 'L’abbonamento del rilancio parte dalla base premium revisionata: Coach Relazionale IA, Creatore di Contenuti IA e Obiettivi di Relazione. Gli altri strumenti di coppia potranno essere pubblicati dopo la propria revisione controllata.', back: 'Indietro', membership: 'Vedi Abbonamento' },
  de: { eyebrow: 'MITGLIEDSCHAFTS-ROADMAP', title: 'Diese Mitgliedschaftsfunktion wird vorbereitet.', body: 'Die Funktion existiert im früheren One2OneLove-Prototyp, hat aber die Relaunch-Prüfung für Datenschutz, Daten, Produkt und echte Funktionalität noch nicht bestanden. Sie bleibt aus der aktiven Beta, statt unfertiges Verhalten als fertig darzustellen.', detail: 'Die Relaunch-Mitgliedschaft startet mit der geprüften Premium-Basis: KI-Beziehungscoach, KI-Content-Ersteller und Beziehungsziele. Weitere Paarwerkzeuge können nach ihrer eigenen kontrollierten Prüfung veröffentlicht werden.', back: 'Zurück', membership: 'Mitgliedschaft Ansehen' },
  nl: { eyebrow: 'LIDMAATSCHAPSROADMAP', title: 'Deze lidmaatschapsfunctie wordt voorbereid.', body: 'De functie bestaat in het eerdere One2OneLove-prototype, maar heeft de herlanceringscontrole voor privacy, data, product en echte werking nog niet doorlopen. We houden haar uit de actieve bèta in plaats van onafgemaakt gedrag als voltooid te presenteren.', detail: 'Het herlanceringslidmaatschap begint met de beoordeelde premiumbasis: AI Relatiecoach, AI Content Maker en Relatiedoelen. Extra koppeltools kunnen na hun eigen gecontroleerde beoordeling worden uitgebracht.', back: 'Terug', membership: 'Bekijk Lidmaatschap' },
};

export default function PremiumFeatureStaged() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-[72vh] bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-14">
      <div className="mx-auto max-w-2xl rounded-3xl border border-purple-200 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white"><Crown className="h-8 w-8" /></div>
        <p className="mt-6 text-sm font-black tracking-[0.18em] text-purple-700">{t.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl">{t.title}</h1>
        <p className="mt-5 leading-7 text-gray-600">{t.body}</p>
        <div className="mt-6 rounded-2xl bg-purple-50 p-5 text-left text-sm leading-7 text-purple-950"><Sparkles className="mr-2 inline h-4 w-4" />{t.detail}</div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline"><Link to="/PremiumFeatures"><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Link></Button>
          <Button asChild><Link to="/Subscription">{t.membership}</Link></Button>
        </div>
      </div>
    </div>
  );
}
