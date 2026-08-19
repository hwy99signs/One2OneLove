import React from "react";
import { BookOpen, Radio, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: { title: "One2OneLove Editorial", subtitle: "A full O2OL article and blog publishing system is planned for post launch.", notice: "We are not filling the launch site with invented authors, dates, or articles. Until the editorial system is active, use the Relationship Library, O2OL Show, and Global Relationship Room for real One2OneLove content.", library: "Relationship Library", show: "O2OL Show", room: "Global Relationship Room" },
  es: { title: "Editorial One2OneLove", subtitle: "Un sistema completo de artículos y blog de O2OL está previsto para después del lanzamiento.", notice: "No llenaremos el sitio de lanzamiento con autores, fechas o artículos inventados. Hasta que el sistema editorial esté activo, usa la Biblioteca de Relaciones, O2OL Show y la Sala Global de Relaciones para contenido real de One2OneLove.", library: "Biblioteca de Relaciones", show: "O2OL Show", room: "Sala Global de Relaciones" },
  fr: { title: "Éditorial One2OneLove", subtitle: "Un système complet de publication d’articles et de blog O2OL est prévu après le lancement.", notice: "Nous ne remplirons pas le site de lancement avec des auteurs, dates ou articles inventés. Jusqu’à l’activation du système éditorial, utilisez la Bibliothèque Relationnelle, O2OL Show et la Salle Mondiale des Relations pour du contenu One2OneLove réel.", library: "Bibliothèque Relationnelle", show: "O2OL Show", room: "Salle Mondiale des Relations" },
  it: { title: "Editoriale One2OneLove", subtitle: "Un sistema completo di articoli e blog O2OL è previsto dopo il lancio.", notice: "Non riempiremo il sito di lancio con autori, date o articoli inventati. Finché il sistema editoriale non sarà attivo, usa la Biblioteca delle Relazioni, O2OL Show e la Sala Globale delle Relazioni per contenuti reali One2OneLove.", library: "Biblioteca delle Relazioni", show: "O2OL Show", room: "Sala Globale delle Relazioni" },
  de: { title: "One2OneLove Redaktion", subtitle: "Ein vollständiges O2OL Artikel- und Blogsystem ist für die Zeit nach dem Start geplant.", notice: "Wir füllen die Startseite nicht mit erfundenen Autoren, Daten oder Artikeln. Bis das Redaktionssystem aktiv ist, nutzt die Beziehungsbibliothek, O2OL Show und den Globalen Beziehungsraum für echte One2OneLove-Inhalte.", library: "Beziehungsbibliothek", show: "O2OL Show", room: "Globaler Beziehungsraum" },
};

export default function Blog() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  return <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 px-4 py-12 md:py-20"><div className="mx-auto max-w-4xl text-center"><BookOpen className="mx-auto h-14 w-14 text-amber-700" aria-hidden="true"/><h1 className="mt-5 text-4xl font-bold text-slate-900 md:text-5xl">{t.title}</h1><p className="mt-4 text-lg text-slate-600">{t.subtitle}</p><Card className="mx-auto mt-8 max-w-3xl border-amber-100 text-left"><CardContent className="p-6 md:p-8"><p className="rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">{t.notice}</p><div className="mt-8 grid gap-3 sm:grid-cols-3"><Button asChild><Link to="/RelationshipLibrary"><Sparkles className="mr-2 h-4 w-4" aria-hidden="true"/>{t.library}</Link></Button><Button asChild variant="outline"><Link to="/O2OLShow">{t.show}</Link></Button><Button asChild variant="outline"><Link to="/GlobalRelationshipRoom"><Radio className="mr-2 h-4 w-4" aria-hidden="true"/>{t.room}</Link></Button></div></CardContent></Card></div></main>;
}
