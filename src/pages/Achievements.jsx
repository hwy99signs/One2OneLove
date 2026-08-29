import React from "react";
import { Award, Heart, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: { title: "Achievements — Post Launch", subtitle: "One2OneLove is not awarding pretend badges, points, streaks, or rewards at launch.", notice: "A future achievement system may celebrate private couple habits and participation using real activity data. It will not fabricate completed milestones or pressure couples to compete for relationship status.", challenges: "Couples Challenges", rituals: "Relationship Rituals", goals: "Relationship Goals" },
  es: { title: "Logros — Después del Lanzamiento", subtitle: "One2OneLove no otorgará insignias, puntos, rachas ni recompensas ficticias en el lanzamiento.", notice: "Un futuro sistema de logros podrá celebrar hábitos privados de pareja y participación usando datos reales de actividad. No inventará hitos completados ni presionará a las parejas para competir por estatus de relación.", challenges: "Desafíos para Parejas", rituals: "Rituales de Relación", goals: "Metas de Relación" },
  fr: { title: "Réalisations — Après le Lancement", subtitle: "One2OneLove n’attribuera pas de faux badges, points, séries ou récompenses au lancement.", notice: "Un futur système de réalisations pourra célébrer des habitudes privées de couple et la participation à partir de vraies données d’activité. Il n’inventera pas de jalons accomplis et n’incitera pas les couples à rivaliser pour un statut relationnel.", challenges: "Défis de Couple", rituals: "Rituels Relationnels", goals: "Objectifs de Relation" },
  it: { title: "Traguardi — Dopo il Lancio", subtitle: "One2OneLove non assegnerà badge, punti, serie o premi fittizi al lancio.", notice: "Un futuro sistema di traguardi potrà celebrare abitudini private di coppia e partecipazione usando dati reali. Non inventerà risultati completati né spingerà le coppie a competere per uno status relazionale.", challenges: "Sfide di Coppia", rituals: "Rituali di Relazione", goals: "Obiettivi di Relazione" },
  de: { title: "Erfolge — Nach dem Start", subtitle: "One2OneLove vergibt zum Start keine erfundenen Abzeichen, Punkte, Serien oder Belohnungen.", notice: "Ein zukünftiges Erfolgssystem kann private Paargewohnheiten und Teilnahme anhand realer Aktivitätsdaten würdigen. Es wird keine abgeschlossenen Meilensteine erfinden und Paare nicht zu einem Wettbewerb um Beziehungsstatus drängen.", challenges: "Paar-Challenges", rituals: "Beziehungsrituale", goals: "Beziehungsziele" },
};

export default function Achievements() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 px-4 py-12 md:py-20"><div className="mx-auto max-w-4xl text-center"><Award className="mx-auto h-14 w-14 text-violet-700" aria-hidden="true"/><h1 className="mt-5 text-4xl font-bold text-slate-900 md:text-5xl">{t.title}</h1><p className="mt-4 text-lg text-slate-600">{t.subtitle}</p><Card className="mx-auto mt-8 max-w-3xl text-left"><CardContent className="p-6 md:p-8"><div className="flex gap-3 rounded-2xl bg-violet-50 p-5 text-sm leading-6 text-violet-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"/><p>{t.notice}</p></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><Button asChild><Link to="/CouplesChallenges"><Heart className="mr-2 h-4 w-4" aria-hidden="true"/>{t.challenges}</Link></Button><Button asChild variant="outline"><Link to="/RelationshipRituals">{t.rituals}</Link></Button><Button asChild variant="outline"><Link to="/RelationshipGoals">{t.goals}</Link></Button></div></CardContent></Card></div></main>;
}
