import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BarChart3, Check, ChevronRight, Globe2,
  MessageCircleQuestion, Search, Send, Sparkles, Users, X
} from "lucide-react";
import rawQuestions from "@/data/whatShouldTheyDoQuestions.json";
import { useLanguage } from "@/Layout";

const CATEGORY = {
  "communication": { label: "Communication", icon: "💬", a: "#1d4ed8", b: "#60a5fa", soft: "#eff6ff" },
  "trust-honesty": { label: "Trust & Honesty", icon: "🤝", a: "#0f766e", b: "#5eead4", soft: "#f0fdfa" },
  "boundaries": { label: "Boundaries", icon: "🛡️", a: "#7c3aed", b: "#c4b5fd", soft: "#f5f3ff" },
  "conflict-repair": { label: "Conflict & Repair", icon: "🧩", a: "#c2410c", b: "#fdba74", soft: "#fff7ed" },
  "emotional-needs": { label: "Emotional Needs", icon: "❤️", a: "#be123c", b: "#fda4af", soft: "#fff1f2" },
  "attachment-closeness": { label: "Attachment & Closeness", icon: "🫶", a: "#a21caf", b: "#f0abfc", soft: "#fdf4ff" },
  "independence-togetherness": { label: "Independence vs. Togetherness", icon: "⚖️", a: "#0369a1", b: "#7dd3fc", soft: "#f0f9ff" },
  "jealousy-insecurity": { label: "Jealousy & Insecurity", icon: "🪞", a: "#b45309", b: "#fcd34d", soft: "#fffbeb" },
  "forgiveness-resentment": { label: "Forgiveness & Resentment", icon: "🌱", a: "#15803d", b: "#86efac", soft: "#f0fdf4" },
  "family-in-laws": { label: "Family & In-Laws", icon: "🏡", a: "#9f1239", b: "#f9a8d4", soft: "#fff1f2" },
};

const CATEGORY_LABELS = {
  en: {
    communication: "Communication", "trust-honesty": "Trust & Honesty", boundaries: "Boundaries",
    "conflict-repair": "Conflict & Repair", "emotional-needs": "Emotional Needs",
    "attachment-closeness": "Attachment & Closeness", "independence-togetherness": "Independence vs. Togetherness",
    "jealousy-insecurity": "Jealousy & Insecurity", "forgiveness-resentment": "Forgiveness & Resentment", "family-in-laws": "Family & In-Laws"
  },
  es: {
    communication: "Comunicación", "trust-honesty": "Confianza y Honestidad", boundaries: "Límites",
    "conflict-repair": "Conflicto y Reparación", "emotional-needs": "Necesidades Emocionales",
    "attachment-closeness": "Apego y Cercanía", "independence-togetherness": "Independencia vs. Unión",
    "jealousy-insecurity": "Celos e Inseguridad", "forgiveness-resentment": "Perdón y Resentimiento", "family-in-laws": "Familia y Familia Política"
  },
  fr: {
    communication: "Communication", "trust-honesty": "Confiance et Honnêteté", boundaries: "Limites",
    "conflict-repair": "Conflit et Réparation", "emotional-needs": "Besoins Émotionnels",
    "attachment-closeness": "Attachement et Proximité", "independence-togetherness": "Indépendance vs. Vie à Deux",
    "jealousy-insecurity": "Jalousie et Insécurité", "forgiveness-resentment": "Pardon et Ressentiment", "family-in-laws": "Famille et Belle-Famille"
  },
  it: {
    communication: "Comunicazione", "trust-honesty": "Fiducia e Onestà", boundaries: "Confini",
    "conflict-repair": "Conflitto e Riparazione", "emotional-needs": "Bisogni Emotivi",
    "attachment-closeness": "Attaccamento e Vicinanza", "independence-togetherness": "Indipendenza vs. Unione",
    "jealousy-insecurity": "Gelosia e Insicurezza", "forgiveness-resentment": "Perdono e Risentimento", "family-in-laws": "Famiglia e Suoceri"
  },
  de: {
    communication: "Kommunikation", "trust-honesty": "Vertrauen und Ehrlichkeit", boundaries: "Grenzen",
    "conflict-repair": "Konflikt und Wiedergutmachung", "emotional-needs": "Emotionale Bedürfnisse",
    "attachment-closeness": "Bindung und Nähe", "independence-togetherness": "Unabhängigkeit vs. Gemeinsamkeit",
    "jealousy-insecurity": "Eifersucht und Unsicherheit", "forgiveness-resentment": "Vergebung und Groll", "family-in-laws": "Familie und Schwiegerfamilie"
  }
};

const COPY = {
  en: {
    relationshipGames:"Relationship Games", questions:"Questions", suggestQuestion:"Suggest a Question",
    titleA:"What Should", titleB:"They Do?", subtitle:"Vote first. Then see what the world thinks.",
    realPeople:"Real People.", realDilemmas:"Real Dilemmas.", realOpinions:"Real Opinions.",
    sceneBased:"Scene-Based", categoryGraphic:"Category Graphic", textLed:"Text-Led",
    chooseOne:"Choose one answer", prompt:"What should they do?", castVote:"Cast Your Vote",
    hiddenResults:"Community results stay hidden until you vote.", yourAnswer:"Your Answer", result:"Result",
    popular:p=>`You chose the most popular answer at ${p}%.`, choice:(p,t)=>`Your choice received ${p}%. The leading answer received ${t}%.`,
    anotherQuestion:"Another Question", browseQuestions:"Browse Questions", seeAll:"See All", open:"Open",
    worldVoted:"The World Voted", byCountry:"By Country", worldwide:"Worldwide", unitedStates:"United States",
    unitedKingdom:"United Kingdom", canada:"Canada", australia:"Australia",
    countryThreshold:n=>`Country results appear after at least ${n} votes in a country.`,
    notEnough:"Not enough country votes yet", checkBack:n=>`Check back after at least ${n} votes are recorded for this country.`,
    votes:"votes", locked:"Results are shown only after your answer is locked in.",
    browser:"Question Browser", questionCount:(a,b)=>`${a} of ${b} questions`, closeBrowser:"Close question browser",
    search:"Search dilemmas...", all:"All", footer:(a,b)=>`${a} recovered launch questions • ${b} relationship categories • dynamic visual rotation`
  },
  es: {
    relationshipGames:"Juegos de Pareja", questions:"Preguntas", suggestQuestion:"Sugerir una Pregunta",
    titleA:"¿Qué Deberían", titleB:"Hacer?", subtitle:"Vota primero. Después mira lo que piensa el mundo.",
    realPeople:"Personas Reales.", realDilemmas:"Dilemas Reales.", realOpinions:"Opiniones Reales.",
    sceneBased:"Basado en Escena", categoryGraphic:"Gráfico de Categoría", textLed:"Enfoque de Texto",
    chooseOne:"Elige una respuesta", prompt:"¿Qué deberían hacer?", castVote:"Emitir Tu Voto",
    hiddenResults:"Los resultados de la comunidad permanecen ocultos hasta que votes.", yourAnswer:"Tu Respuesta", result:"Resultado",
    popular:p=>`Elegiste la respuesta más popular con ${p}%.`, choice:(p,t)=>`Tu elección recibió ${p}%. La respuesta líder recibió ${t}%.`,
    anotherQuestion:"Otra Pregunta", browseQuestions:"Explorar Preguntas", seeAll:"Ver Todas", open:"Abrir",
    worldVoted:"El Mundo Votó", byCountry:"Por País", worldwide:"Todo el Mundo", unitedStates:"Estados Unidos",
    unitedKingdom:"Reino Unido", canada:"Canadá", australia:"Australia",
    countryThreshold:n=>`Los resultados por país aparecen después de al menos ${n} votos en un país.`,
    notEnough:"Aún no hay suficientes votos del país", checkBack:n=>`Vuelve cuando se hayan registrado al menos ${n} votos para este país.`,
    votes:"votos", locked:"Los resultados se muestran solo después de confirmar tu respuesta.",
    browser:"Explorar Preguntas", questionCount:(a,b)=>`${a} de ${b} preguntas`, closeBrowser:"Cerrar explorador de preguntas",
    search:"Buscar dilemas...", all:"Todas", footer:(a,b)=>`${a} preguntas recuperadas para el lanzamiento • ${b} categorías de relación • rotación visual dinámica`
  },
  fr: {
    relationshipGames:"Jeux de Couple", questions:"Questions", suggestQuestion:"Suggérer une Question",
    titleA:"Que Devraient-Ils", titleB:"Faire ?", subtitle:"Votez d’abord. Découvrez ensuite ce que pense le monde.",
    realPeople:"Vraies Personnes.", realDilemmas:"Vrais Dilemmes.", realOpinions:"Vraies Opinions.",
    sceneBased:"Basé sur une Scène", categoryGraphic:"Visuel de Catégorie", textLed:"Axé sur le Texte",
    chooseOne:"Choisissez une réponse", prompt:"Que devraient-ils faire ?", castVote:"Voter",
    hiddenResults:"Les résultats de la communauté restent masqués jusqu’à votre vote.", yourAnswer:"Votre Réponse", result:"Résultat",
    popular:p=>`Vous avez choisi la réponse la plus populaire avec ${p} %.`, choice:(p,t)=>`Votre choix a obtenu ${p} %. La réponse en tête a obtenu ${t} %.`,
    anotherQuestion:"Autre Question", browseQuestions:"Parcourir les Questions", seeAll:"Tout Voir", open:"Ouvrir",
    worldVoted:"Le Monde a Voté", byCountry:"Par Pays", worldwide:"Monde Entier", unitedStates:"États-Unis",
    unitedKingdom:"Royaume-Uni", canada:"Canada", australia:"Australie",
    countryThreshold:n=>`Les résultats par pays apparaissent après au moins ${n} votes dans un pays.`,
    notEnough:"Pas encore assez de votes dans ce pays", checkBack:n=>`Revenez après au moins ${n} votes enregistrés pour ce pays.`,
    votes:"votes", locked:"Les résultats s’affichent uniquement après validation de votre réponse.",
    browser:"Explorateur de Questions", questionCount:(a,b)=>`${a} sur ${b} questions`, closeBrowser:"Fermer l’explorateur de questions",
    search:"Rechercher des dilemmes...", all:"Toutes", footer:(a,b)=>`${a} questions récupérées pour le lancement • ${b} catégories relationnelles • rotation visuelle dynamique`
  },
  it: {
    relationshipGames:"Giochi di Coppia", questions:"Domande", suggestQuestion:"Suggerisci una Domanda",
    titleA:"Cosa Dovrebbero", titleB:"Fare?", subtitle:"Vota prima. Poi scopri cosa ne pensa il mondo.",
    realPeople:"Persone Vere.", realDilemmas:"Dilemmi Veri.", realOpinions:"Opinioni Vere.",
    sceneBased:"Basato su Scena", categoryGraphic:"Grafica di Categoria", textLed:"Guidato dal Testo",
    chooseOne:"Scegli una risposta", prompt:"Cosa dovrebbero fare?", castVote:"Invia il Tuo Voto",
    hiddenResults:"I risultati della community restano nascosti finché non voti.", yourAnswer:"La Tua Risposta", result:"Risultato",
    popular:p=>`Hai scelto la risposta più popolare con il ${p}%.`, choice:(p,t)=>`La tua scelta ha ricevuto il ${p}%. La risposta principale ha ricevuto il ${t}%.`,
    anotherQuestion:"Un’Altra Domanda", browseQuestions:"Sfoglia le Domande", seeAll:"Vedi Tutte", open:"Apri",
    worldVoted:"Il Mondo ha Votato", byCountry:"Per Paese", worldwide:"Tutto il Mondo", unitedStates:"Stati Uniti",
    unitedKingdom:"Regno Unito", canada:"Canada", australia:"Australia",
    countryThreshold:n=>`I risultati per paese appaiono dopo almeno ${n} voti in un paese.`,
    notEnough:"Non ci sono ancora abbastanza voti nel paese", checkBack:n=>`Torna quando saranno stati registrati almeno ${n} voti per questo paese.`,
    votes:"voti", locked:"I risultati vengono mostrati solo dopo aver confermato la risposta.",
    browser:"Sfoglia Domande", questionCount:(a,b)=>`${a} di ${b} domande`, closeBrowser:"Chiudi esploratore domande",
    search:"Cerca dilemmi...", all:"Tutte", footer:(a,b)=>`${a} domande recuperate per il lancio • ${b} categorie di relazione • rotazione visiva dinamica`
  },
  de: {
    relationshipGames:"Beziehungsspiele", questions:"Fragen", suggestQuestion:"Frage Vorschlagen",
    titleA:"Was Sollten Sie", titleB:"Tun?", subtitle:"Stimme zuerst ab. Sieh dann, was die Welt denkt.",
    realPeople:"Echte Menschen.", realDilemmas:"Echte Dilemmata.", realOpinions:"Echte Meinungen.",
    sceneBased:"Szenenbasiert", categoryGraphic:"Kategoriegrafik", textLed:"Textbasiert",
    chooseOne:"Wähle eine Antwort", prompt:"Was sollten sie tun?", castVote:"Stimme Abgeben",
    hiddenResults:"Die Community-Ergebnisse bleiben verborgen, bis du abgestimmt hast.", yourAnswer:"Deine Antwort", result:"Ergebnis",
    popular:p=>`Du hast mit ${p}% die beliebteste Antwort gewählt.`, choice:(p,t)=>`Deine Wahl erhielt ${p}%. Die führende Antwort erhielt ${t}%.`,
    anotherQuestion:"Weitere Frage", browseQuestions:"Fragen Durchsuchen", seeAll:"Alle Anzeigen", open:"Öffnen",
    worldVoted:"Die Welt Hat Abgestimmt", byCountry:"Nach Land", worldwide:"Weltweit", unitedStates:"Vereinigte Staaten",
    unitedKingdom:"Vereinigtes Königreich", canada:"Kanada", australia:"Australien",
    countryThreshold:n=>`Länderergebnisse erscheinen nach mindestens ${n} Stimmen in einem Land.`,
    notEnough:"Noch nicht genügend Länderstimmen", checkBack:n=>`Schau wieder vorbei, sobald mindestens ${n} Stimmen für dieses Land erfasst wurden.`,
    votes:"Stimmen", locked:"Ergebnisse werden erst angezeigt, nachdem deine Antwort festgelegt wurde.",
    browser:"Fragen Durchsuchen", questionCount:(a,b)=>`${a} von ${b} Fragen`, closeBrowser:"Fragenbrowser schließen",
    search:"Dilemmata suchen...", all:"Alle", footer:(a,b)=>`${a} wiederhergestellte Startfragen • ${b} Beziehungskategorien • dynamische visuelle Rotation`
  }
};

const QUESTIONS = rawQuestions.map(([category, scenario, options], index) => ({
  id: index + 1,
  category,
  scenario,
  options: options.map((label, optionIndex) => ({
    id: (index + 1) * 10 + optionIndex + 1,
    key: String.fromCharCode(65 + optionIndex),
    label,
  })),
}));

const BASE_VOTES = [
  [612, 389, 233, 142],
  [487, 441, 286, 173],
  [530, 368, 252, 157],
  [455, 397, 311, 184],
];

const REGION_SHIFT = { WORLD: 0, US: 1, GB: 2, CA: 3, AU: 4 };
const COUNTRY_MINIMUM_VOTES = 5;
const REGION_META = {
  WORLD: { labelKey: "worldwide", resultKey: "worldVoted", short: "World", flag: "🌍" },
  US: { labelKey: "unitedStates", resultKey: "byCountry", short: "US", flag: "🇺🇸" },
  GB: { labelKey: "unitedKingdom", resultKey: "byCountry", short: "GB", flag: "🇬🇧" },
  CA: { labelKey: "canada", resultKey: "byCountry", short: "CA", flag: "🇨🇦" },
  AU: { labelKey: "australia", resultKey: "byCountry", short: "AU", flag: "🇦🇺" },
};

function visualTypeFor(index) {
  const slot = index % 20;
  if (slot < 8) return "scene";
  if (slot < 15) return "text";
  return "category";
}

function sceneBackground(question, index) {
  const theme = CATEGORY[question.category] || CATEGORY.communication;
  const variant = index % 6;
  const left = [18, 24, 16, 28, 20, 26][variant];
  const right = [70, 64, 74, 62, 68, 66][variant];
  const bubbleX = [47, 52, 43, 56, 49, 54][variant];
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${theme.a}"/>
        <stop offset="1" stop-color="${theme.b}"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="28"/></filter>
    </defs>
    <rect width="1200" height="700" fill="url(#g)"/>
    <circle cx="${left * 12}" cy="170" r="150" fill="white" opacity=".08"/>
    <circle cx="${right * 12}" cy="520" r="210" fill="white" opacity=".07"/>
    <g opacity=".97">
      <circle cx="${left * 12}" cy="285" r="74" fill="#f8fafc"/>
      <path d="M${left * 12 - 135} 610 Q${left * 12} 415 ${left * 12 + 135} 610 Z" fill="#f8fafc"/>
      <circle cx="${right * 12}" cy="300" r="74" fill="#e2e8f0"/>
      <path d="M${right * 12 - 135} 620 Q${right * 12} 425 ${right * 12 + 135} 620 Z" fill="#e2e8f0"/>
    </g>
    <rect x="${bubbleX * 12 - 125}" y="120" rx="34" ry="34" width="250" height="110" fill="white" opacity=".88"/>
    <circle cx="${bubbleX * 12 - 60}" cy="175" r="10" fill="${theme.a}"/>
    <circle cx="${bubbleX * 12}" cy="175" r="10" fill="${theme.a}"/>
    <circle cx="${bubbleX * 12 + 60}" cy="175" r="10" fill="${theme.a}"/>
    <path d="M${bubbleX * 12 - 22} 230 L${bubbleX * 12 + 28} 230 L${bubbleX * 12 + 8} 264 Z" fill="white" opacity=".88"/>
    <ellipse cx="600" cy="675" rx="480" ry="70" fill="#0f172a" opacity=".16" filter="url(#blur)"/>
  </svg>`;
  return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`;
}

function buildResults(question, selectedOptionId, region) {
  const shift = (question.id + REGION_SHIFT[region]) % BASE_VOTES.length;
  const base = [...BASE_VOTES[shift]];
  const regionFactor = region === "WORLD" ? 1 : ({ US: .42, GB: .22, CA: .18, AU: .14 }[region] || .2);
  const selectedIndex = question.options.findIndex(o => o.id === selectedOptionId);
  if (selectedIndex >= 0) base[selectedIndex] += 1;
  const adjusted = base.map((v, i) => Math.max(1, Math.round(v * regionFactor + ((question.id * (i + 3)) % 17))));
  const total = adjusted.reduce((sum, v) => sum + v, 0);
  return question.options.map((option, i) => ({
    ...option,
    votes: adjusted[i],
    percentage: Math.round((adjusted[i] / total) * 100),
  }));
}

function QuestionVisual({ question, index }) {
  const type = visualTypeFor(index);
  const theme = CATEGORY[question.category] || CATEGORY.communication;

  if (type === "scene") {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: sceneBackground(question, index) }}
        aria-hidden="true"
      />
    );
  }

  if (type === "category") {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.a}, ${theme.b})` }}
        aria-hidden="true"
      >
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-white/10" />
        <div className="text-[8rem] opacity-25 sm:text-[11rem]">{theme.icon}</div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(140deg, ${theme.soft}, #ffffff 55%, ${theme.soft})` }}
      aria-hidden="true"
    >
      <div className="absolute left-0 top-0 h-full w-3" style={{ background: theme.a }} />
      <div className="absolute right-8 top-10 text-7xl opacity-10 sm:text-9xl">{theme.icon}</div>
      <div className="absolute bottom-8 left-10 h-20 w-20 rounded-full opacity-10" style={{ background: theme.a }} />
    </div>
  );
}

function QuestionBrowser({ questions, onClose, onSelect, t, currentLanguage }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(questions.map(q => q.category))], [questions]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return questions.filter(q => {
      const matchesCategory = category === "all" || q.category === category;
      const matchesQuery = !needle || `${q.scenario} ${CATEGORY_LABELS[currentLanguage]?.[q.category] || CATEGORY[q.category]?.label || q.category} ${q.options.map(o => o.label).join(" ")}`
        .toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [questions, query, category, currentLanguage]);

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 rounded-t-3xl border-b bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#102f60]">{t.browser}</h2>
              <p className="text-sm font-semibold text-slate-500">{t.questionCount(filtered.length, questions.length)}</p>
            </div>
            <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label={t.closeBrowser}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex min-h-12 items-center gap-2 rounded-xl border bg-slate-50 px-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} className="min-w-0 flex-1 bg-transparent text-base outline-none" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCategory("all")} className={`rounded-full px-3 py-2 text-xs font-black ${category === "all" ? "bg-[#102f60] text-white" : "bg-slate-100 text-slate-600"}`}>{t.all}</button>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} className={`rounded-full px-3 py-2 text-xs font-black ${category === cat ? "bg-[#102f60] text-white" : "bg-slate-100 text-slate-600"}`}>
                  {CATEGORY_LABELS[currentLanguage]?.[cat] || CATEGORY[cat]?.label || cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {filtered.map(q => (
            <button key={q.id} type="button" onClick={() => onSelect(q.id)} className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-pink-300 hover:shadow-md">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl" style={{ background: CATEGORY[q.category]?.soft }}>{CATEGORY[q.category]?.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-black uppercase tracking-wider text-pink-600">{CATEGORY_LABELS[currentLanguage]?.[q.category] || CATEGORY[q.category]?.label}</span>
                <span className="mt-1 block text-base font-bold leading-6 text-[#17345f]">{q.scenario}</span>
              </span>
              <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WhatShouldTheyDo() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const categoryLabels = CATEGORY_LABELS[currentLanguage] || CATEGORY_LABELS.en;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [region, setRegion] = useState("WORLD");

  const question = QUESTIONS[questionIndex];
  const theme = CATEGORY[question.category] || CATEGORY.communication;
  const visualType = visualTypeFor(questionIndex);
  const results = useMemo(
    () => submitted ? buildResults(question, selectedOptionId, region) : [],
    [question, selectedOptionId, submitted, region]
  );
  const selected = question.options.find(o => o.id === selectedOptionId);
  const top = submitted ? [...results].sort((a, b) => b.percentage - a.percentage)[0] : null;
  const userResult = submitted ? results.find(r => r.id === selectedOptionId) : null;
  const regionMeta = REGION_META[region] || REGION_META.WORLD;
  const regionLabel = t[regionMeta.labelKey] || COPY.en[regionMeta.labelKey];
  const regionResultTitle = t[regionMeta.resultKey] || COPY.en[regionMeta.resultKey];
  const regionTotalVotes = results.reduce((sum, row) => sum + row.votes, 0);
  const regionMeetsMinimum = region === "WORLD" || regionTotalVotes >= COUNTRY_MINIMUM_VOTES;

  function openQuestion(id) {
    const next = QUESTIONS.findIndex(q => q.id === id);
    if (next < 0) return;
    setQuestionIndex(next);
    setSelectedOptionId(null);
    setSubmitted(false);
    setRegion("WORLD");
    setBrowserOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextQuestion() {
    const next = (questionIndex + 1) % QUESTIONS.length;
    openQuestion(QUESTIONS[next].id);
  }

  function castVote() {
    if (!selectedOptionId) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {browserOpen && <QuestionBrowser questions={QUESTIONS} onClose={() => setBrowserOpen(false)} onSelect={openQuestion} t={t} currentLanguage={currentLanguage} />}

      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <Link to="/CooperativeGames" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-black text-[#17345f] hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" /> {t.relationshipGames}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setBrowserOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-[#17345f]">
              <Search className="h-4 w-4" /> {t.questions}
            </button>
            <Link to="/Suggestions" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1976f3] px-4 text-sm font-black text-white">
              <Send className="h-4 w-4" /> {t.suggestQuestion}
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-7 lg:py-9">
        <div className="mb-6 flex items-start justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black uppercase leading-[.9] tracking-[-.05em] text-[#102f60] sm:text-6xl lg:text-7xl">
              {t.titleA} <span className="block text-[#ff176b]">{t.titleB}</span>
            </h1>
            <p className="mt-3 text-sm font-bold text-slate-500 sm:text-lg">{t.subtitle}</p>
          </div>
          <div className="hidden border-l pl-6 text-base font-black leading-7 text-slate-500 sm:block">
            <div>{t.realPeople}</div><div>{t.realDilemmas}</div><div>{t.realOpinions}</div>
            <div className="mt-2 h-1 w-16 -rotate-3 rounded-full bg-[#ff176b]" />
          </div>
        </div>

        {!submitted ? (
          <div className="grid gap-5 lg:grid-cols-[1.35fr_.85fr]">
            <section className="relative min-h-[360px] overflow-hidden rounded-3xl shadow-xl sm:min-h-[470px]">
              <QuestionVisual question={question} index={questionIndex} />
              <div className={`absolute inset-0 ${visualType === "text" ? "bg-white/5" : "bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-slate-950/5"}`} />
              <div className="absolute left-4 top-4 rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide text-white shadow" style={{ background: theme.a }}>
                {theme.icon} {categoryLabels[question.category] || theme.label}
              </div>
              <div className={`absolute right-4 top-4 rounded-full px-3 py-2 text-xs font-black ${visualType === "text" ? "bg-white text-[#102f60] shadow" : "bg-black/30 text-white backdrop-blur"}`}>
                {questionIndex + 1}/{QUESTIONS.length}
              </div>
              <div className={`absolute inset-x-0 bottom-0 p-5 sm:p-8 ${visualType === "text" ? "text-[#102f60]" : "text-white"}`}>
                <div className="mb-3 text-[10px] font-black uppercase tracking-[.25em] opacity-80">
                  {visualType === "scene" ? t.sceneBased : visualType === "category" ? t.categoryGraphic : t.textLed}
                </div>
                <p className="max-w-4xl text-2xl font-black leading-tight sm:text-3xl lg:text-[2.25rem]">{question.scenario}</p>
              </div>
            </section>

            <section className="flex flex-col rounded-3xl bg-white p-4 shadow-lg sm:p-6">
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{t.chooseOne}</div>
                <div className="mt-1 text-lg font-black text-[#17345f]">{t.prompt}</div>
              </div>
              <div className="grid gap-3">
                {question.options.map((option, idx) => {
                  const active = option.id === selectedOptionId;
                  const colors = ["#fff0f5", "#eef5ff", "#ecfbf6", "#f3efff"];
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`flex min-h-[68px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${active ? "border-[#ff176b] shadow-md" : "border-transparent hover:-translate-y-0.5 hover:shadow"}`}
                      style={{ background: colors[idx % colors.length] }}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${active ? "bg-[#ff176b] text-white" : "bg-white text-[#17345f]"}`}>
                        {active ? <Check className="h-5 w-5" /> : option.key}
                      </span>
                      <span className="font-black leading-5 text-[#17345f]">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" disabled={!selectedOptionId} onClick={castVote} className="mt-5 inline-flex min-h-[60px] items-center justify-center gap-3 rounded-2xl bg-[#ff176b] px-5 text-lg font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">
                <BarChart3 className="h-6 w-6" /> {t.castVote} <ArrowRight className="h-5 w-5" />
              </button>
              <p className="mt-3 text-center text-xs font-semibold text-slate-400">{t.hiddenResults}</p>
            </section>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
            <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-7">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide text-white" style={{ background: theme.a }}>
                {theme.icon} {categoryLabels[question.category] || theme.label}
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight text-[#102f60]">{question.scenario}</h2>
              <div className="mt-6 rounded-2xl bg-pink-50 p-4">
                <div className="text-xs font-black uppercase tracking-wider text-pink-600">{t.yourAnswer}</div>
                <div className="mt-1 text-lg font-black text-[#17345f]">{selected?.label}</div>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-[#17345f]"><Sparkles className="h-4 w-4 text-amber-500" /> {t.result}</div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {userResult?.id === top?.id
                    ? t.popular(userResult?.percentage)
                    : t.choice(userResult?.percentage, top?.percentage)}
                </p>
              </div>
              <button type="button" onClick={nextQuestion} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#102f60] px-5 font-black text-white">
                {t.anotherQuestion} <ArrowRight className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setBrowserOpen(true)} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 font-black text-[#17345f]">
                <Search className="h-4 w-4" /> {t.browseQuestions}
              </button>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400"><Globe2 className="h-4 w-4" /> {regionResultTitle}</div>
                  <h3 className="mt-1 text-2xl font-black text-[#102f60]">{regionLabel}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(REGION_META).map(([code, meta]) => (
                    <button key={code} type="button" onClick={() => setRegion(code)} className={`rounded-full px-3 py-2 text-xs font-black ${region === code ? "bg-[#102f60] text-white" : "bg-slate-100 text-slate-600"}`}>
                      <span aria-hidden="true">{meta.flag}</span> {meta.short}
                    </button>
                  ))}
                </div>
              </div>

              {region !== "WORLD" && (
                <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  {t.countryThreshold(COUNTRY_MINIMUM_VOTES)}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {!regionMeetsMinimum ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="font-black text-[#17345f]">{t.notEnough}</div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{t.checkBack(COUNTRY_MINIMUM_VOTES)}</p>
                  </div>
                ) : results.map((row, idx) => {
                  const isMine = row.id === selectedOptionId;
                  return (
                    <div key={row.id}>
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2">
                          <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${isMine ? "bg-[#ff176b] text-white" : "bg-slate-100 text-slate-600"}`}>{row.key}</span>
                          <span className="font-bold leading-5 text-[#17345f]">{row.label}</span>
                        </div>
                        <span className="shrink-0 text-lg font-black text-[#102f60]">{row.percentage}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all" style={{ width: `${row.percentage}%`, background: isMine ? "#ff176b" : ["#2563eb", "#14b8a6", "#8b5cf6", "#f59e0b"][idx % 4] }} />
                      </div>
                      <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">{row.votes.toLocaleString()} {t.votes}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-[#17345f]">
                <Users className="h-5 w-5 shrink-0 text-blue-600" />
                {t.locked}
              </div>
            </section>
          </div>
        )}

        {!submitted && (
          <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{t.anotherQuestion}</div>
                  <button type="button" onClick={() => setBrowserOpen(true)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-black text-[#17345f] hover:bg-slate-100">
                    {t.seeAll} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 max-w-4xl font-black text-[#17345f]">{QUESTIONS[(questionIndex + 1) % QUESTIONS.length].scenario}</p>
              </div>
              <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-[#17345f]">
                {t.open} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <MessageCircleQuestion className="h-4 w-4" />
          {t.footer(QUESTIONS.length, Object.keys(CATEGORY).length)}
        </div>
      </main>
    </div>
  );
}
