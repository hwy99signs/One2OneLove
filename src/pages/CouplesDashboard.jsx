import React from "react";
import { CalendarDays, CalendarHeart, Heart, Inbox, NotebookPen, Sparkles, Target, UserRound, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Couples Dashboard",
    subtitle: "A simple home base for the relationship tools you actually use—without invented scores, badges, or activity claims.",
    privacy: "This dashboard is navigation only. It does not calculate a relationship score or create analytics about your relationship.",
    items: [
      ["Couple Profile", "Review your own profile and your mutually linked partner connection.", "/CouplesProfile", "profile"],
      ["Couples Calendar", "Plan dates, reminders, milestones, and shared time.", "/CouplesCalendar", "calendar"],
      ["Anniversary Tracker", "Keep your anniversary visible and plan how you want to celebrate it.", "/AnniversaryTracker", "anniversary"],
      ["Love Notes", "Send and receive private notes with your mutually linked partner.", "/LoveNotes", "notes"],
      ["Shared Journals", "Write reflections and preserve meaningful thoughts.", "/SharedJournals", "journal"],
      ["Memory Lane", "Return to meaningful memories already recorded.", "/MemoryLane", "memory"],
      ["Relationship Goals", "Set and work through meaningful goals together.", "/RelationshipGoals", "target"],
      ["Relationship Milestones", "Track and celebrate important relationship moments.", "/RelationshipMilestones", "award"],
      ["Weekly Check-In", "Use a short weekly conversation structure to stay connected.", "/WeeklyCheckIn", "heart"],
    ],
  },
  es: {
    title: "Panel de Pareja",
    subtitle: "Un punto de partida sencillo para las herramientas que realmente usan, sin puntuaciones, insignias ni actividad inventada.",
    privacy: "Este panel es solo de navegación. No calcula una puntuación de relación ni crea análisis sobre su relación.",
    items: [
      ["Perfil de Pareja", "Revisa tu propio perfil y la conexión con tu pareja vinculada mutuamente.", "/CouplesProfile", "profile"],
      ["Calendario de Pareja", "Planifiquen citas, recordatorios, hitos y tiempo compartido.", "/CouplesCalendar", "calendar"],
      ["Seguimiento de Aniversario", "Mantengan visible su aniversario y planifiquen cómo celebrarlo.", "/AnniversaryTracker", "anniversary"],
      ["Notas de Amor", "Envíen y reciban notas privadas con su pareja vinculada mutuamente.", "/LoveNotes", "notes"],
      ["Diarios Compartidos", "Escriban reflexiones y conserven pensamientos significativos.", "/SharedJournals", "journal"],
      ["Carril de Recuerdos", "Vuelvan a recuerdos significativos ya registrados.", "/MemoryLane", "memory"],
      ["Metas de Relación", "Establezcan y desarrollen metas significativas juntos.", "/RelationshipGoals", "target"],
      ["Hitos de Relación", "Sigan y celebren momentos importantes de la relación.", "/RelationshipMilestones", "award"],
      ["Revisión Semanal", "Usen una conversación semanal breve para mantenerse conectados.", "/WeeklyCheckIn", "heart"],
    ],
  },
  fr: {
    title: "Tableau de Bord du Couple",
    subtitle: "Un point de départ simple pour les outils que vous utilisez réellement, sans scores, badges ni activité inventée.",
    privacy: "Ce tableau de bord sert uniquement à la navigation. Il ne calcule aucun score relationnel et ne crée pas d’analyses sur votre relation.",
    items: [
      ["Profil du Couple", "Consultez votre profil et votre lien avec votre partenaire réciproquement associé.", "/CouplesProfile", "profile"],
      ["Calendrier du Couple", "Planifiez rendez-vous, rappels, jalons et temps partagé.", "/CouplesCalendar", "calendar"],
      ["Suivi d’Anniversaire", "Gardez votre anniversaire visible et planifiez votre célébration.", "/AnniversaryTracker", "anniversary"],
      ["Notes d’Amour", "Envoyez et recevez des notes privées avec votre partenaire réciproquement lié.", "/LoveNotes", "notes"],
      ["Journaux Partagés", "Écrivez des réflexions et conservez des pensées importantes.", "/SharedJournals", "journal"],
      ["Allée des Souvenirs", "Revenez aux souvenirs importants déjà enregistrés.", "/MemoryLane", "memory"],
      ["Objectifs de Relation", "Fixez et développez des objectifs significatifs ensemble.", "/RelationshipGoals", "target"],
      ["Jalons Relationnels", "Suivez et célébrez les moments importants de votre relation.", "/RelationshipMilestones", "award"],
      ["Bilan Hebdomadaire", "Utilisez une courte conversation hebdomadaire pour rester connectés.", "/WeeklyCheckIn", "heart"],
    ],
  },
  it: {
    title: "Dashboard di Coppia",
    subtitle: "Una base semplice per gli strumenti che usate davvero, senza punteggi, badge o attività inventate.",
    privacy: "Questa dashboard serve solo per la navigazione. Non calcola punteggi di relazione e non crea analisi sulla vostra relazione.",
    items: [
      ["Profilo di Coppia", "Rivedi il tuo profilo e il collegamento con il partner reciprocamente associato.", "/CouplesProfile", "profile"],
      ["Calendario di Coppia", "Pianificate appuntamenti, promemoria, traguardi e tempo condiviso.", "/CouplesCalendar", "calendar"],
      ["Monitoraggio Anniversario", "Tenete visibile l’anniversario e pianificate come celebrarlo.", "/AnniversaryTracker", "anniversary"],
      ["Note d’Amore", "Inviate e ricevete note private con il partner collegato reciprocamente.", "/LoveNotes", "notes"],
      ["Diari Condivisi", "Scrivete riflessioni e conservate pensieri significativi.", "/SharedJournals", "journal"],
      ["Viale dei Ricordi", "Rivisitate i ricordi importanti già registrati.", "/MemoryLane", "memory"],
      ["Obiettivi di Relazione", "Create e sviluppate obiettivi significativi insieme.", "/RelationshipGoals", "target"],
      ["Traguardi di Relazione", "Tracciate e celebrate i momenti importanti della relazione.", "/RelationshipMilestones", "award"],
      ["Check-In Settimanale", "Usate una breve conversazione settimanale per restare connessi.", "/WeeklyCheckIn", "heart"],
    ],
  },
  de: {
    title: "Paar-Dashboard",
    subtitle: "Eine einfache Zentrale für die Werkzeuge, die ihr wirklich nutzt – ohne erfundene Werte, Abzeichen oder Aktivitätsbehauptungen.",
    privacy: "Dieses Dashboard dient nur der Navigation. Es berechnet keinen Beziehungswert und erstellt keine Analysen über eure Beziehung.",
    items: [
      ["Paar-Profil", "Seht euer eigenes Profil und die Verbindung zum gegenseitig verknüpften Partner.", "/CouplesProfile", "profile"],
      ["Paar-Kalender", "Plant Dates, Erinnerungen, Meilensteine und gemeinsame Zeit.", "/CouplesCalendar", "calendar"],
      ["Jahrestags-Tracker", "Haltet euren Jahrestag sichtbar und plant eure Feier.", "/AnniversaryTracker", "anniversary"],
      ["Liebesbotschaften", "Sendet und empfangt private Nachrichten mit eurem gegenseitig verknüpften Partner.", "/LoveNotes", "notes"],
      ["Gemeinsame Journale", "Schreibt Gedanken auf und bewahrt bedeutungsvolle Reflexionen.", "/SharedJournals", "journal"],
      ["Erinnerungsgasse", "Blickt auf wichtige bereits festgehaltene Erinnerungen zurück.", "/MemoryLane", "memory"],
      ["Beziehungsziele", "Setzt und entwickelt bedeutungsvolle Ziele gemeinsam.", "/RelationshipGoals", "target"],
      ["Beziehungsmeilensteine", "Verfolgt und feiert wichtige Momente eurer Beziehung.", "/RelationshipMilestones", "award"],
      ["Wöchentlicher Check-In", "Nutzt ein kurzes wöchentliches Gespräch, um verbunden zu bleiben.", "/WeeklyCheckIn", "heart"],
    ],
  },
};

const icons = { profile: UserRound, calendar: CalendarDays, anniversary: CalendarHeart, notes: Inbox, journal: NotebookPen, memory: Sparkles, target: Target, award: Award, heart: Heart };

export default function CouplesDashboard() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-rose-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <Heart className="mx-auto h-14 w-14 fill-rose-100 text-rose-600" aria-hidden="true" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-3 text-xs font-medium leading-5 text-purple-800">{t.privacy}</p>
        </header>
        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label={t.title}>
          {t.items.map(([title, description, href, iconKey]) => {
            const Icon = icons[iconKey] || Heart;
            return <Link key={href} to={href} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"><Icon className="h-7 w-7 text-purple-600" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></Link>;
          })}
        </section>
      </div>
    </main>
  );
}
