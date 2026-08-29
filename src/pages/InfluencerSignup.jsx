import React from 'react';
import { ArrowLeft, Radio, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: { title: 'Creators on One2OneLove', subtitle: 'The old influencer application has been replaced by the Global Relationship Room creator program.', creator: 'Become a Global Room Creator', creatorCopy: 'Approved creators can apply for creator access, see approval status, and self-book available Global Relationship Room programming slots under the current creator rules.', brand: 'Brand and influencer partnerships', brandCopy: 'Separate sponsorship, brand-collaboration, and influencer partnership programs are not open yet. Those programs will be published later with clear eligibility, disclosure, and commercial terms.', openCreator: 'Open Creator Access', room: 'Visit Global Relationship Room', home: 'Back Home' },
  es: { title: 'Creadores en One2OneLove', subtitle: 'La antigua solicitud de influencer ha sido reemplazada por el programa de creadores de la Sala Global de Relaciones.', creator: 'Conviértete en Creador de la Sala Global', creatorCopy: 'Los creadores aprobados pueden solicitar acceso, consultar su estado de aprobación y reservar por sí mismos espacios disponibles de programación de la Sala Global según las reglas actuales.', brand: 'Colaboraciones con marcas e influencers', brandCopy: 'Los programas separados de patrocinio, colaboración con marcas e influencers aún no están abiertos. Se publicarán más adelante con requisitos, divulgaciones y términos comerciales claros.', openCreator: 'Abrir Acceso de Creadores', room: 'Visitar la Sala Global', home: 'Volver al Inicio' },
  fr: { title: 'Créateurs sur One2OneLove', subtitle: 'L’ancienne candidature influenceur a été remplacée par le programme créateurs de la Salle Mondiale des Relations.', creator: 'Devenir Créateur de la Salle Mondiale', creatorCopy: 'Les créateurs approuvés peuvent demander l’accès créateur, consulter leur statut d’approbation et réserver eux-mêmes des créneaux disponibles selon les règles actuelles.', brand: 'Partenariats marques et influenceurs', brandCopy: 'Les programmes distincts de sponsoring, collaboration de marque et partenariats influenceurs ne sont pas encore ouverts. Ils seront publiés plus tard avec des critères, obligations de transparence et conditions commerciales clairs.', openCreator: 'Ouvrir l’Accès Créateur', room: 'Visiter la Salle Mondiale', home: 'Retour à l’Accueil' },
  it: { title: 'Creator su One2OneLove', subtitle: 'La vecchia candidatura influencer è stata sostituita dal programma creator della Sala Globale delle Relazioni.', creator: 'Diventa Creator della Sala Globale', creatorCopy: 'I creator approvati possono richiedere accesso, vedere lo stato di approvazione e prenotare autonomamente gli slot disponibili della Sala Globale secondo le regole attuali.', brand: 'Partnership con brand e influencer', brandCopy: 'Programmi separati di sponsorizzazione, collaborazione con brand e partnership influencer non sono ancora aperti. Saranno pubblicati in seguito con requisiti, disclosure e termini commerciali chiari.', openCreator: 'Apri Accesso Creator', room: 'Visita la Sala Globale', home: 'Torna alla Home' },
  de: { title: 'Creator auf One2OneLove', subtitle: 'Die frühere Influencer-Bewerbung wurde durch das Creator-Programm des Globalen Beziehungsraums ersetzt.', creator: 'Creator im Globalen Beziehungsraum Werden', creatorCopy: 'Genehmigte Creator können Creator-Zugang beantragen, ihren Genehmigungsstatus sehen und verfügbare Programmslots des Globalen Beziehungsraums nach den aktuellen Regeln selbst buchen.', brand: 'Marken- und Influencer-Partnerschaften', brandCopy: 'Separate Sponsoring-, Markenkooperations- und Influencer-Partnerschaftsprogramme sind noch nicht geöffnet. Sie werden später mit klaren Teilnahme-, Offenlegungs- und Geschäftsbedingungen veröffentlicht.', openCreator: 'Creator-Zugang Öffnen', room: 'Globalen Beziehungsraum Besuchen', home: 'Zurück zur Startseite' },
};

export default function InfluencerSignup() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  return (
    <main className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-fuchsia-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t.home}</Link>
        <header className="mx-auto mt-8 max-w-3xl text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700"><Radio className="h-8 w-8" aria-hidden="true" /></div><h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1><p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p></header>
        <div className="mx-auto mt-8 grid max-w-3xl gap-5 md:grid-cols-2">
          <Card className="border-fuchsia-100 bg-white shadow-sm"><CardContent className="p-6"><Sparkles className="h-7 w-7 text-fuchsia-700" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-slate-900">{t.creator}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{t.creatorCopy}</p><Button asChild className="mt-6 w-full"><Link to="/RoomCreatorAccess">{t.openCreator}</Link></Button></CardContent></Card>
          <Card className="border-slate-200 bg-white shadow-sm"><CardContent className="p-6"><h2 className="text-xl font-bold text-slate-900">{t.brand}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{t.brandCopy}</p><Button asChild variant="outline" className="mt-6 w-full"><Link to="/GlobalRelationshipRoom">{t.room}</Link></Button></CardContent></Card>
        </div>
      </div>
    </main>
  );
}
