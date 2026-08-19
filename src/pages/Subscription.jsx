import React from 'react';
import { CreditCard, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: { title: 'One2OneLove Membership', subtitle: 'The launch experience is not opening paid membership checkout yet.', notice: 'Basic, Premiere, and Exclusive pricing shown in earlier builds is not being offered at launch. Paid plans will be activated only after the launch feature set is stable, entitlements are finalized, and every advertised paid benefit is actually available.', free: 'Explore the launch experience', future: 'Paid memberships — post launch', futureCopy: 'Future plans may add expanded guided tools, creator experiences, personalization, and early access. Pricing and exact benefits will be published before checkout opens.', explore: 'Explore Relationship Tools', room: 'Global Relationship Room', contact: 'Billing / Membership Questions' },
  es: { title: 'Membresía One2OneLove', subtitle: 'La experiencia de lanzamiento no abrirá todavía el pago de membresías.', notice: 'Los precios Basic, Premiere y Exclusive mostrados en versiones anteriores no se ofrecen en el lanzamiento. Los planes de pago se activarán solo cuando las funciones de lanzamiento sean estables, los derechos estén definidos y cada beneficio anunciado esté realmente disponible.', free: 'Explora la experiencia de lanzamiento', future: 'Membresías de pago — después del lanzamiento', futureCopy: 'Los planes futuros podrán añadir más herramientas guiadas, experiencias para creadores, personalización y acceso anticipado. Los precios y beneficios exactos se publicarán antes de abrir el pago.', explore: 'Explorar Herramientas de Relación', room: 'Sala Global de Relaciones', contact: 'Preguntas de Membresía / Facturación' },
  fr: { title: 'Abonnement One2OneLove', subtitle: 'L’expérience de lancement n’ouvre pas encore le paiement des abonnements.', notice: 'Les tarifs Basic, Premiere et Exclusive affichés dans d’anciennes versions ne sont pas proposés au lancement. Les offres payantes ne seront activées que lorsque les fonctions de lancement seront stables, les droits finalisés et chaque avantage payant annoncé réellement disponible.', free: 'Découvrir l’expérience de lancement', future: 'Abonnements payants — après le lancement', futureCopy: 'Les futurs forfaits pourront ajouter davantage d’outils guidés, d’expériences créateurs, de personnalisation et d’accès anticipé. Les prix et avantages précis seront publiés avant l’ouverture du paiement.', explore: 'Explorer les Outils Relationnels', room: 'Salle Mondiale des Relations', contact: 'Questions d’Abonnement / Facturation' },
  it: { title: 'Abbonamento One2OneLove', subtitle: 'L’esperienza di lancio non apre ancora il checkout degli abbonamenti a pagamento.', notice: 'I prezzi Basic, Premiere ed Exclusive mostrati nelle versioni precedenti non sono offerti al lancio. I piani a pagamento saranno attivati solo quando le funzioni di lancio saranno stabili, i diritti definiti e ogni beneficio pubblicizzato sarà realmente disponibile.', free: 'Esplora l’esperienza di lancio', future: 'Abbonamenti a pagamento — dopo il lancio', futureCopy: 'I piani futuri potranno aggiungere strumenti guidati ampliati, esperienze creator, personalizzazione e accesso anticipato. Prezzi e vantaggi esatti saranno pubblicati prima dell’apertura del checkout.', explore: 'Esplora Strumenti Relazionali', room: 'Sala Globale delle Relazioni', contact: 'Domande su Abbonamento / Fatturazione' },
  de: { title: 'One2OneLove Mitgliedschaft', subtitle: 'Zum Start wird noch kein Checkout für kostenpflichtige Mitgliedschaften geöffnet.', notice: 'Die in früheren Builds gezeigten Basic-, Premiere- und Exclusive-Preise werden zum Start nicht angeboten. Bezahlte Tarife werden erst aktiviert, wenn die Startfunktionen stabil, Berechtigungen festgelegt und alle beworbenen Vorteile tatsächlich verfügbar sind.', free: 'Starterfahrung Entdecken', future: 'Bezahlte Mitgliedschaften — nach dem Start', futureCopy: 'Zukünftige Tarife können erweiterte geführte Werkzeuge, Creator-Erlebnisse, Personalisierung und frühen Zugang hinzufügen. Preise und genaue Vorteile werden veröffentlicht, bevor der Checkout geöffnet wird.', explore: 'Beziehungswerkzeuge Entdecken', room: 'Globaler Beziehungsraum', contact: 'Fragen zu Mitgliedschaft / Abrechnung' },
};

export default function Subscription() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <CreditCard className="mx-auto h-14 w-14 text-blue-700" aria-hidden="true" />
        <h1 className="mt-5 text-4xl font-bold text-slate-900 md:text-5xl">{t.title}</h1>
        <p className="mt-4 text-lg text-slate-600">{t.subtitle}</p>
        <Card className="mx-auto mt-8 max-w-3xl text-left"><CardContent className="p-6 md:p-8">
          <div className="flex gap-3 rounded-2xl bg-blue-50 p-5 text-sm leading-6 text-blue-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{t.notice}</p></div>
          <div className="mt-6 rounded-2xl border border-slate-200 p-5"><div className="flex items-center gap-2"><Heart className="h-5 w-5 text-rose-600" aria-hidden="true" /><h2 className="font-bold text-slate-900">{t.free}</h2></div><h3 className="mt-5 font-bold text-slate-900">{t.future}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{t.futureCopy}</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3"><Button asChild><Link to="/CoupleActivities">{t.explore}</Link></Button><Button asChild variant="outline"><Link to="/GlobalRelationshipRoom">{t.room}</Link></Button><Button asChild variant="outline"><Link to="/ContactUs">{t.contact}</Link></Button></div>
        </CardContent></Card>
      </div>
    </main>
  );
}
