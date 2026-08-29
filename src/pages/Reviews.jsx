import React from "react";
import { Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: { title: "One2OneLove Stories & Reviews", subtitle: "We are not publishing fabricated ratings or testimonials at launch.", notice: "Public reviews and testimonials will only be displayed when they come from real users and we have permission to publish them. Until then, use the Community for real member-submitted relationship stories and platform participation.", community: "Visit Community", invite: "Invite Someone", home: "Back Home" },
  es: { title: "Historias y Reseñas de One2OneLove", subtitle: "No publicamos calificaciones ni testimonios inventados en el lanzamiento.", notice: "Las reseñas y testimonios públicos solo se mostrarán cuando provengan de usuarios reales y tengamos permiso para publicarlos. Hasta entonces, usa la Comunidad para historias de relaciones enviadas por miembros reales y participación en la plataforma.", community: "Visitar Comunidad", invite: "Invitar a Alguien", home: "Volver al Inicio" },
  fr: { title: "Histoires et Avis One2OneLove", subtitle: "Nous ne publions pas de notes ou témoignages inventés au lancement.", notice: "Les avis et témoignages publics ne seront affichés que lorsqu’ils proviendront de vrais utilisateurs et que nous aurons l’autorisation de les publier. En attendant, utilisez la Communauté pour consulter des histoires relationnelles soumises par de vrais membres.", community: "Visiter la Communauté", invite: "Inviter Quelqu’un", home: "Retour à l’Accueil" },
  it: { title: "Storie e Recensioni One2OneLove", subtitle: "Al lancio non pubblichiamo valutazioni o testimonianze inventate.", notice: "Recensioni e testimonianze pubbliche saranno mostrate solo quando provengono da utenti reali e abbiamo il permesso di pubblicarle. Nel frattempo, usa la Comunità per storie di relazione inviate da membri reali e partecipazione alla piattaforma.", community: "Visita la Comunità", invite: "Invita Qualcuno", home: "Torna alla Home" },
  de: { title: "One2OneLove Geschichten & Bewertungen", subtitle: "Zum Start veröffentlichen wir keine erfundenen Bewertungen oder Erfahrungsberichte.", notice: "Öffentliche Bewertungen und Testimonials werden nur angezeigt, wenn sie von echten Nutzern stammen und eine Veröffentlichungserlaubnis vorliegt. Bis dahin bietet die Community echte von Mitgliedern eingereichte Beziehungsgeschichten und Plattformbeteiligung.", community: "Community Besuchen", invite: "Jemanden Einladen", home: "Zurück zur Startseite" },
};

export default function Reviews() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  return <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 px-4 py-12 md:py-20"><div className="mx-auto max-w-4xl text-center"><Heart className="mx-auto h-14 w-14 text-rose-600" aria-hidden="true"/><h1 className="mt-5 text-4xl font-bold text-slate-900 md:text-5xl">{t.title}</h1><p className="mt-4 text-lg text-slate-600">{t.subtitle}</p><Card className="mx-auto mt-8 max-w-3xl border-rose-100 text-left"><CardContent className="p-6 md:p-8"><div className="flex gap-3 rounded-2xl bg-rose-50 p-5 text-sm leading-6 text-rose-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"/><p>{t.notice}</p></div><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button asChild><Link to="/Community"><MessageCircle className="mr-2 h-4 w-4" aria-hidden="true"/>{t.community}</Link></Button><Button asChild variant="outline"><Link to="/Invite">{t.invite}</Link></Button><Button asChild variant="ghost"><Link to="/">{t.home}</Link></Button></div></CardContent></Card></div></main>;
}
