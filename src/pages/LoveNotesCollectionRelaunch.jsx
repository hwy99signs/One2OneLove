import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Search, Send, Shuffle } from "lucide-react";
import { useLanguage } from "@/Layout";
import { loveNotesData } from "@/components/lovenotes/LoveNotesData";

const PAGE_SIZE = 24;

const copy = {
  en: {
    title: "365 Love Notes", subtitle: "Find the words, make them yours, then send the note privately.", search: "Search Love Notes…", all: "All", random: "Surprise me", send: "Send this Love Note", back: "Back to Love Notes", showing: "Showing", of: "of", notes: "Love Notes", empty: "No Love Notes match that search yet.", loadMore: "Show more Love Notes", draftTitle: "Love Note",
  },
  es: {
    title: "365 Notas de Amor", subtitle: "Encuentra las palabras, hazlas tuyas y luego envía la nota en privado.", search: "Buscar Notas de Amor…", all: "Todas", random: "Sorpréndeme", send: "Enviar esta Nota de Amor", back: "Volver a Notas de Amor", showing: "Mostrando", of: "de", notes: "Notas de Amor", empty: "Ninguna Nota de Amor coincide con esa búsqueda.", loadMore: "Mostrar más Notas de Amor", draftTitle: "Nota de Amor",
  },
  fr: {
    title: "365 Mots d’Amour", subtitle: "Trouvez les mots, personnalisez-les, puis envoyez votre mot en privé.", search: "Rechercher des Mots d’Amour…", all: "Tous", random: "Surprenez-moi", send: "Envoyer ce Mot d’Amour", back: "Retour aux Mots d’Amour", showing: "Affichage", of: "sur", notes: "Mots d’Amour", empty: "Aucun Mot d’Amour ne correspond à cette recherche.", loadMore: "Afficher plus de Mots d’Amour", draftTitle: "Mot d’Amour",
  },
  it: {
    title: "365 Note d’Amore", subtitle: "Trova le parole, rendile tue e poi invia la nota in privato.", search: "Cerca Note d’Amore…", all: "Tutte", random: "Sorprendimi", send: "Invia questa Nota d’Amore", back: "Torna alle Note d’Amore", showing: "Mostrando", of: "di", notes: "Note d’Amore", empty: "Nessuna Nota d’Amore corrisponde alla ricerca.", loadMore: "Mostra altre Note d’Amore", draftTitle: "Nota d’Amore",
  },
  de: {
    title: "365 Liebesnotizen", subtitle: "Finde die Worte, mach sie persönlich und sende die Notiz privat.", search: "Liebesnotizen durchsuchen…", all: "Alle", random: "Überrasch mich", send: "Diese Liebesnotiz senden", back: "Zurück zu Liebesnotizen", showing: "Angezeigt", of: "von", notes: "Liebesnotizen", empty: "Keine Liebesnotiz passt zu dieser Suche.", loadMore: "Mehr Liebesnotizen anzeigen", draftTitle: "Liebesnotiz",
  },
  nl: {
    title: "365 Liefdesbriefjes", subtitle: "Vind de woorden, maak ze persoonlijk en verstuur het briefje privé.", search: "Liefdesbriefjes zoeken…", all: "Alle", random: "Verras me", send: "Dit Liefdesbriefje sturen", back: "Terug naar Liefdesbriefjes", showing: "Getoond", of: "van", notes: "Liefdesbriefjes", empty: "Geen Liefdesbriefjes gevonden voor deze zoekopdracht.", loadMore: "Meer Liefdesbriefjes tonen", draftTitle: "Liefdesbriefje",
  },
};

const flattenNotes = (language) => {
  const source = loveNotesData[language] || loveNotesData.en || {};
  return Object.entries(source).flatMap(([category, notes]) =>
    Array.isArray(notes) ? notes.map((note, index) => ({ ...note, category, id: `${category}-${index}` })) : []
  );
};

export default function LoveNotesCollectionRelaunch() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const notes = useMemo(() => flattenNotes(currentLanguage), [currentLanguage]);
  const categories = useMemo(() => [...new Set(notes.map((note) => note.category))], [notes]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return notes.filter((note) => {
      const inCategory = category === "all" || note.category === category;
      const haystack = `${note.title || ""} ${note.content || ""} ${(note.tags || []).join(" ")}`.toLowerCase();
      return inCategory && (!term || haystack.includes(term));
    });
  }, [notes, category, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, query, currentLanguage]);

  const visibleNotes = filtered.slice(0, visibleCount);

  const sendNote = (note) => {
    sessionStorage.setItem("o2ol-love-note-draft", JSON.stringify({
      message: (note?.content || "").trim().slice(0, 500), source: "collection", title: note?.title || t.draftTitle,
    }));
    navigate("/LoveNotes/Send");
  };

  const surpriseMe = () => {
    if (!filtered.length) return;
    sendNote(filtered[Math.floor(Math.random() * filtered.length)]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => navigate("/LoveNotes")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />{t.back}</button>

        <header className="mt-7 rounded-[2rem] border border-white bg-white/85 p-7 shadow-xl backdrop-blur sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-pink-700"><Heart className="h-4 w-4 fill-pink-500 text-pink-500" />One2OneLove</div>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{t.subtitle}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" /></label>
            <button type="button" onClick={surpriseMe} disabled={!filtered.length} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white disabled:opacity-40"><Shuffle className="h-4 w-4 text-pink-300" />{t.random}</button>
          </div>
        </header>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
          <button type="button" onClick={() => setCategory("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${category === "all" ? "bg-pink-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{t.all}</button>
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${category === item ? "bg-pink-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}
        </div>

        <div className="mt-4 text-sm font-bold text-slate-500">{t.showing} {Math.min(visibleNotes.length, filtered.length)} {t.of} {filtered.length} {t.notes}</div>

        {filtered.length ? (
          <>
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleNotes.map((note) => (
                <article key={note.id} className="flex flex-col rounded-[1.75rem] border border-white bg-white p-6 shadow-lg">
                  <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-pink-700">{note.category}</span><Heart className="h-5 w-5 text-pink-500" /></div>
                  <h2 className="mt-5 text-xl font-black text-slate-950">{note.title}</h2><p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{note.content}</p>
                  <button type="button" onClick={() => sendNote(note)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-pink-700"><Send className="h-4 w-4" />{t.send}</button>
                </article>
              ))}
            </section>
            {visibleNotes.length < filtered.length && (
              <div className="mt-9 flex justify-center"><button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-2xl border border-pink-200 bg-white px-6 py-3.5 text-sm font-black text-pink-700 shadow-sm transition hover:bg-pink-50">{t.loadMore}</button></div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center font-bold text-slate-500">{t.empty}</div>
        )}
      </div>
    </main>
  );
}
