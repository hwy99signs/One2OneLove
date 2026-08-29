import React from "react";
import { Gift, Heart, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "One2OneLove Promotions",
    subtitle: "There is no active One2OneLove prize, cruise, cash, or points competition at this time.",
    notice: "We do not want relationship activities to imply a prize that has not been formally launched. If One2OneLove introduces a future promotion, official eligibility, dates, rules, prizes, and terms will be published before participation opens.",
    explore: "Explore real relationship activities instead",
    challenges: "Couples Challenges",
    room: "Global Relationship Room",
    activities: "Couple Activities",
    home: "Back Home"
  },
  es: {
    title: "Promociones de One2OneLove",
    subtitle: "Actualmente no hay ningún concurso activo de One2OneLove con crucero, dinero, puntos o premios.",
    notice: "No queremos que las actividades de relación impliquen un premio que no haya sido lanzado formalmente. Si One2OneLove presenta una promoción futura, publicaremos primero la elegibilidad, las fechas, las reglas, los premios y los términos oficiales.",
    explore: "Explora actividades reales de relación",
    challenges: "Desafíos para Parejas",
    room: "Sala Global de Relaciones",
    activities: "Actividades de Pareja",
    home: "Volver al Inicio"
  },
  fr: {
    title: "Promotions One2OneLove",
    subtitle: "Il n’y a actuellement aucun concours One2OneLove actif offrant croisière, argent, points ou prix.",
    notice: "Nous ne voulons pas que les activités relationnelles laissent entendre qu’un prix existe alors qu’aucune promotion officielle n’a été lancée. Si One2OneLove propose une future promotion, l’admissibilité, les dates, les règles, les prix et les conditions seront publiés avant l’ouverture des participations.",
    explore: "Découvrez plutôt de vraies activités relationnelles",
    challenges: "Défis de Couple",
    room: "Salle Mondiale des Relations",
    activities: "Activités de Couple",
    home: "Retour à l’Accueil"
  },
  it: {
    title: "Promozioni One2OneLove",
    subtitle: "Al momento non è attivo alcun concorso One2OneLove con crociere, denaro, punti o premi.",
    notice: "Non vogliamo che le attività di coppia facciano pensare a un premio non ancora lanciato ufficialmente. Se One2OneLove introdurrà una promozione futura, pubblicheremo prima requisiti, date, regole, premi e condizioni ufficiali.",
    explore: "Esplora invece attività di coppia reali",
    challenges: "Sfide di Coppia",
    room: "Sala Globale delle Relazioni",
    activities: "Attività di Coppia",
    home: "Torna alla Home"
  },
  de: {
    title: "One2OneLove Aktionen",
    subtitle: "Derzeit gibt es keinen aktiven One2OneLove-Wettbewerb mit Kreuzfahrt-, Geld-, Punkte- oder Sachpreisen.",
    notice: "Beziehungsaktivitäten sollen keinen Preis versprechen, der nicht offiziell gestartet wurde. Wenn One2OneLove künftig eine Aktion anbietet, werden Teilnahmeberechtigung, Termine, Regeln, Preise und Bedingungen veröffentlicht, bevor die Teilnahme beginnt.",
    explore: "Stattdessen echte Beziehungsaktivitäten entdecken",
    challenges: "Paar-Challenges",
    room: "Globaler Beziehungsraum",
    activities: "Paar-Aktivitäten",
    home: "Zurück zur Startseite"
  }
};

export default function WinACruise() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Gift className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-slate-600">{t.subtitle}</p>
        </header>

        <Card className="mx-auto mt-8 max-w-3xl border-emerald-100 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>{t.notice}</p>
            </div>
            <h2 className="mt-8 text-xl font-bold text-slate-900">{t.explore}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Button asChild variant="outline"><Link to="/CouplesChallenges"><Heart className="mr-2 h-4 w-4" aria-hidden="true" />{t.challenges}</Link></Button>
              <Button asChild variant="outline"><Link to="/GlobalRelationshipRoom">{t.room}</Link></Button>
              <Button asChild variant="outline"><Link to="/CoupleActivities">{t.activities}</Link></Button>
            </div>
            <div className="mt-6 text-center"><Button asChild><Link to="/Home">{t.home}</Link></Button></div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
