import React from 'react';
import { ArrowLeft, BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: { title: 'Professional Applications — Post Launch', subtitle: 'One2OneLove is not opening the general professional directory or referral ecosystem at launch.', notice: 'Professional applications will open only after participation standards, review procedures, privacy rules, profile verification, and public-directory policies are finalized. This page does not collect professional profile information today.', future: 'Planned later', futureCopy: 'Future participation may include approved relationship educators, coaches, consultants, and other relationship-adjacent professionals under clearly published standards.', support: 'Relationship Support', contact: 'Contact One2OneLove', home: 'Back Home' },
  es: { title: 'Solicitudes Profesionales — Después del Lanzamiento', subtitle: 'One2OneLove no abrirá el directorio profesional general ni el ecosistema de referencias en el lanzamiento.', notice: 'Las solicitudes profesionales se abrirán solo cuando se hayan finalizado los estándares de participación, revisión, privacidad, verificación de perfiles y políticas del directorio público. Esta página no recopila hoy información de perfiles profesionales.', future: 'Previsto para más adelante', futureCopy: 'La participación futura podrá incluir educadores, coaches, consultores y otros profesionales relacionados con las relaciones que hayan sido aprobados bajo estándares publicados claramente.', support: 'Apoyo para Relaciones', contact: 'Contactar a One2OneLove', home: 'Volver al Inicio' },
  fr: { title: 'Candidatures Professionnelles — Après le Lancement', subtitle: 'One2OneLove n’ouvrira pas l’annuaire professionnel général ni l’écosystème de mise en relation au lancement.', notice: 'Les candidatures professionnelles n’ouvriront qu’après finalisation des normes de participation, procédures d’examen, règles de confidentialité, vérification des profils et politiques d’annuaire public. Cette page ne collecte aujourd’hui aucune information de profil professionnel.', future: 'Prévu plus tard', futureCopy: 'La participation future pourra inclure des éducateurs relationnels, coachs, consultants et autres professionnels connexes approuvés selon des normes clairement publiées.', support: 'Soutien Relationnel', contact: 'Contacter One2OneLove', home: 'Retour à l’Accueil' },
  it: { title: 'Candidature Professionali — Dopo il Lancio', subtitle: 'One2OneLove non aprirà al lancio l’elenco professionale generale né l’ecosistema di referral.', notice: 'Le candidature professionali apriranno solo dopo la definizione di standard di partecipazione, procedure di revisione, regole privacy, verifica dei profili e politiche dell’elenco pubblico. Oggi questa pagina non raccoglie informazioni di profilo professionale.', future: 'Previsto più avanti', futureCopy: 'La partecipazione futura potrà includere educatori relazionali, coach, consulenti e altri professionisti collegati alle relazioni approvati secondo standard chiaramente pubblicati.', support: 'Supporto Relazionale', contact: 'Contatta One2OneLove', home: 'Torna alla Home' },
  de: { title: 'Fachpersonen-Bewerbungen — Nach dem Start', subtitle: 'One2OneLove öffnet zum Start weder das allgemeine Fachpersonenverzeichnis noch ein Vermittlungs-Ökosystem.', notice: 'Bewerbungen werden erst geöffnet, wenn Teilnahmebedingungen, Prüfverfahren, Datenschutzregeln, Profilverifizierung und Richtlinien für ein öffentliches Verzeichnis festgelegt sind. Diese Seite erhebt derzeit keine beruflichen Profildaten.', future: 'Für später geplant', futureCopy: 'Eine zukünftige Teilnahme kann geprüfte Beziehungsbildner, Coaches, Berater und andere beziehungsnahe Fachpersonen nach klar veröffentlichten Standards umfassen.', support: 'Beziehungsunterstützung', contact: 'One2OneLove Kontaktieren', home: 'Zurück zur Startseite' },
};

export default function ProfessionalSignup() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t.home}</Link>
        <header className="mx-auto mt-8 max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"><BriefcaseBusiness className="h-8 w-8" aria-hidden="true" /></div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
        </header>
        <Card className="mx-auto mt-8 max-w-3xl border-indigo-100 bg-white shadow-sm"><CardContent className="p-6 md:p-8">
          <div className="flex gap-3 rounded-2xl bg-indigo-50 p-5 text-sm leading-6 text-indigo-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{t.notice}</p></div>
          <div className="mt-6 rounded-2xl border border-slate-200 p-5"><h2 className="font-bold text-slate-900">{t.future}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t.futureCopy}</p></div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button asChild><Link to="/CoupleSupport">{t.support}</Link></Button><Button asChild variant="outline"><Link to="/ContactUs">{t.contact}</Link></Button></div>
        </CardContent></Card>
      </div>
    </main>
  );
}
