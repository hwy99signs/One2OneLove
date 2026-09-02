import React from 'react';
import { ArrowLeft, FileCheck2, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const COPY = {
  en: {
    termsTitle: 'Terms of Service — final review pending',
    privacyTitle: 'Privacy Policy — final review pending',
    body: 'One2OneLove is updating this policy for the relaunch so it accurately reflects the current product, privacy, community, AI, support and membership systems. The older policy text is intentionally not being presented as final while that review is incomplete.',
    detail: 'Production release remains blocked until the final policy is reviewed and approved for the actual launch markets and operating details.',
    sms: 'The optional Love Notes SMS program and its consent, STOP/HELP, provider and mobile-data disclosures are also included in this final review. SMS sending remains disabled until that legal/provider review and a controlled production activation are completed.',
    back: 'Back to One2OneLove',
    badge: 'RELAUNCH LEGAL REVIEW',
  },
  es: {
    termsTitle: 'Términos de Servicio — revisión final pendiente',
    privacyTitle: 'Política de Privacidad — revisión final pendiente',
    body: 'One2OneLove está actualizando esta política para el relanzamiento, de modo que refleje con precisión el producto actual, la privacidad, la comunidad, la IA, el soporte y los sistemas de membresía. El texto anterior no se presenta como definitivo mientras la revisión siga incompleta.',
    detail: 'El lanzamiento de producción permanece bloqueado hasta que la política final sea revisada y aprobada para los mercados y detalles operativos reales del lanzamiento.',
    sms: 'El programa opcional de SMS de Notas de Amor y sus avisos de consentimiento, STOP/HELP, proveedor y datos móviles también forman parte de esta revisión final. El envío de SMS permanece desactivado hasta completar esa revisión legal/del proveedor y una activación controlada en producción.',
    back: 'Volver a One2OneLove',
    badge: 'REVISIÓN LEGAL DEL RELANZAMIENTO',
  },
  fr: {
    termsTitle: 'Conditions d’utilisation — revue finale en attente',
    privacyTitle: 'Politique de confidentialité — revue finale en attente',
    body: 'One2OneLove met à jour cette politique pour la relance afin qu’elle reflète correctement le produit actuel, la confidentialité, la communauté, l’IA, l’assistance et les systèmes d’adhésion. L’ancien texte n’est volontairement pas présenté comme définitif tant que cette revue n’est pas terminée.',
    detail: 'La mise en production reste bloquée jusqu’à ce que la politique finale soit examinée et approuvée pour les marchés de lancement et les modalités d’exploitation réelles.',
    sms: 'Le programme facultatif de SMS Mots d’Amour et ses informations relatives au consentement, à STOP/HELP, au fournisseur et aux données mobiles font également partie de cette revue finale. L’envoi de SMS reste désactivé jusqu’à l’achèvement de cette revue juridique/fournisseur et d’une activation contrôlée en production.',
    back: 'Retour à One2OneLove',
    badge: 'REVUE JURIDIQUE DE LA RELANCE',
  },
  it: {
    termsTitle: 'Termini di Servizio — revisione finale in sospeso',
    privacyTitle: 'Informativa sulla Privacy — revisione finale in sospeso',
    body: 'One2OneLove sta aggiornando questa politica per il rilancio affinché rifletta correttamente il prodotto attuale, la privacy, la community, l’IA, l’assistenza e i sistemi di abbonamento. Il testo precedente non viene presentato come definitivo finché questa revisione non sarà completata.',
    detail: 'Il rilascio in produzione resta bloccato finché la politica finale non sarà revisionata e approvata per i mercati di lancio e i dettagli operativi effettivi.',
    sms: 'Il programma SMS facoltativo Note d’Amore e le relative informative su consenso, STOP/HELP, provider e dati mobili rientrano anch’essi nella revisione finale. L’invio di SMS resta disattivato finché non saranno completate la revisione legale/del provider e un’attivazione controllata in produzione.',
    back: 'Torna a One2OneLove',
    badge: 'REVISIONE LEGALE DEL RILANCIO',
  },
  de: {
    termsTitle: 'Nutzungsbedingungen — abschließende Prüfung ausstehend',
    privacyTitle: 'Datenschutzrichtlinie — abschließende Prüfung ausstehend',
    body: 'One2OneLove aktualisiert diese Richtlinie für den Relaunch, damit sie das aktuelle Produkt sowie Datenschutz-, Community-, KI-, Support- und Mitgliedschaftssysteme korrekt beschreibt. Der frühere Text wird bewusst nicht als endgültig dargestellt, solange diese Prüfung noch offen ist.',
    detail: 'Die Produktionsfreigabe bleibt blockiert, bis die endgültige Richtlinie für die tatsächlichen Startmärkte und Betriebsdetails geprüft und genehmigt wurde.',
    sms: 'Das optionale Liebesnotizen-SMS-Programm sowie die Hinweise zu Einwilligung, STOP/HELP, Anbieter und mobilen Daten sind ebenfalls Teil dieser abschließenden Prüfung. Der SMS-Versand bleibt deaktiviert, bis diese rechtliche/Anbieterprüfung und eine kontrollierte Produktionsaktivierung abgeschlossen sind.',
    back: 'Zurück zu One2OneLove',
    badge: 'RELAUNCH-RECHTSPRÜFUNG',
  },
  nl: {
    termsTitle: 'Servicevoorwaarden — definitieve beoordeling in afwachting',
    privacyTitle: 'Privacybeleid — definitieve beoordeling in afwachting',
    body: 'One2OneLove werkt dit beleid bij voor de herlancering zodat het huidige product en de privacy-, community-, AI-, support- en lidmaatschapssystemen juist worden beschreven. De oudere tekst wordt bewust niet als definitief gepresenteerd zolang die beoordeling niet is afgerond.',
    detail: 'Productie blijft geblokkeerd totdat het definitieve beleid is beoordeeld en goedgekeurd voor de daadwerkelijke lanceringsmarkten en bedrijfsdetails.',
    sms: 'Het optionele Love Notes-sms-programma en de bijbehorende informatie over toestemming, STOP/HELP, provider en mobiele data maken ook deel uit van de definitieve beoordeling. Sms-verzending blijft uitgeschakeld totdat de juridische/providerbeoordeling en een gecontroleerde productieactivatie zijn voltooid.',
    back: 'Terug naar One2OneLove',
    badge: 'JURIDISCHE HERLANCERINGSREVIEW',
  },
};

export default function LegalPolicyPending() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const { pathname } = useLocation();
  const isPrivacy = pathname.toLowerCase().includes('privacy');

  return (
    <main className="min-h-[72vh] bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-14">
      <Card className="mx-auto max-w-3xl border-purple-100 shadow-xl">
        <CardContent className="p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            {isPrivacy ? <ShieldAlert className="h-8 w-8" /> : <FileCheck2 className="h-8 w-8" />}
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-purple-700">{t.badge}</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">{isPrivacy ? t.privacyTitle : t.termsTitle}</h1>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">{t.body}</p>
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">{t.detail}</div>
          <div className="mx-auto mt-3 max-w-2xl rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm font-semibold leading-6 text-purple-950">{t.sms}</div>
          <Button asChild variant="outline" className="mt-7"><Link to="/Home"><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
