import React from "react";
import { ArrowLeft, HeartHandshake, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Therapist Applications — Post Launch",
    subtitle: "One2OneLove is not accepting therapist applications or operating a verified therapist directory at launch.",
    notice: "We will only open therapist onboarding after a real credential-review, verification, privacy, and professional-support process is in place. This page does not collect licensing, phone, photo, payment, or practice information today.",
    future: "Planned professional ecosystem",
    futureCopy: "A future verified program may support credentialed therapist profiles and professional discovery. Participation rules and verification requirements will be published before applications open.",
    support: "Relationship Support",
    contact: "Contact One2OneLove",
    home: "Back Home",
  },
  es: {
    title: "Solicitudes de Terapeutas — Después del Lanzamiento",
    subtitle: "One2OneLove no acepta solicitudes de terapeutas ni opera un directorio verificado de terapeutas en el lanzamiento.",
    notice: "Solo abriremos la incorporación de terapeutas cuando exista un proceso real de revisión de credenciales, verificación, privacidad y apoyo profesional. Esta página no recopila hoy información de licencias, teléfono, fotos, pagos ni práctica profesional.",
    future: "Ecosistema profesional previsto",
    futureCopy: "Un futuro programa verificado podrá incluir perfiles de terapeutas acreditados y descubrimiento profesional. Las reglas de participación y requisitos de verificación se publicarán antes de abrir las solicitudes.",
    support: "Apoyo para Relaciones",
    contact: "Contactar a One2OneLove",
    home: "Volver al Inicio",
  },
  fr: {
    title: "Candidatures de Thérapeutes — Après le Lancement",
    subtitle: "One2OneLove n’accepte pas de candidatures de thérapeutes et n’exploite pas d’annuaire vérifié de thérapeutes au lancement.",
    notice: "L’intégration des thérapeutes ne sera ouverte qu’après la mise en place d’un véritable processus de contrôle des qualifications, de vérification, de confidentialité et de soutien professionnel. Cette page ne collecte aujourd’hui aucune donnée de licence, téléphone, photo, paiement ou cabinet.",
    future: "Écosystème professionnel prévu",
    futureCopy: "Un futur programme vérifié pourra proposer des profils de thérapeutes accrédités et une découverte professionnelle. Les règles de participation et exigences de vérification seront publiées avant l’ouverture des candidatures.",
    support: "Soutien Relationnel",
    contact: "Contacter One2OneLove",
    home: "Retour à l’Accueil",
  },
  it: {
    title: "Candidature Terapeuti — Dopo il Lancio",
    subtitle: "One2OneLove non accetta candidature di terapeuti e non gestisce un elenco verificato di terapeuti al lancio.",
    notice: "Apriremo l’onboarding dei terapeuti solo dopo aver predisposto un vero processo di verifica delle credenziali, controllo, privacy e supporto professionale. Oggi questa pagina non raccoglie dati su licenze, telefono, foto, pagamenti o attività professionale.",
    future: "Ecosistema professionale previsto",
    futureCopy: "Un futuro programma verificato potrà includere profili di terapeuti accreditati e scoperta professionale. Regole di partecipazione e requisiti di verifica saranno pubblicati prima dell’apertura delle candidature.",
    support: "Supporto Relazionale",
    contact: "Contatta One2OneLove",
    home: "Torna alla Home",
  },
  de: {
    title: "Therapeuten-Bewerbungen — Nach dem Start",
    subtitle: "One2OneLove nimmt zum Start keine Therapeuten-Bewerbungen an und betreibt kein verifiziertes Therapeutenverzeichnis.",
    notice: "Therapeuten-Onboarding wird erst geöffnet, wenn ein echtes Verfahren für Qualifikationsprüfung, Verifizierung, Datenschutz und professionelle Unterstützung besteht. Diese Seite erhebt derzeit keine Lizenz-, Telefon-, Foto-, Zahlungs- oder Praxisdaten.",
    future: "Geplantes Fachpersonen-Ökosystem",
    futureCopy: "Ein zukünftiges verifiziertes Programm kann Profile qualifizierter Therapeuten und professionelle Suche unterstützen. Teilnahmebedingungen und Verifizierungsanforderungen werden veröffentlicht, bevor Bewerbungen geöffnet werden.",
    support: "Beziehungsunterstützung",
    contact: "One2OneLove Kontaktieren",
    home: "Zurück zur Startseite",
  },
};

export default function TherapistSignup() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-teal-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t.home}
        </Link>
        <header className="mx-auto mt-8 max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700"><Stethoscope className="h-8 w-8" aria-hidden="true" /></div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
        </header>
        <Card className="mx-auto mt-8 max-w-3xl border-teal-100 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex gap-3 rounded-2xl bg-teal-50 p-5 text-sm leading-6 text-teal-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>{t.notice}</p>
            </div>
            <div className="mt-6 flex gap-3 rounded-2xl border border-slate-200 p-5">
              <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
              <div><h2 className="font-bold text-slate-900">{t.future}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t.futureCopy}</p></div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild><Link to="/CoupleSupport">{t.support}</Link></Button>
              <Button asChild variant="outline"><Link to="/ContactUs">{t.contact}</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
