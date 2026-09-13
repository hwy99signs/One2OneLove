import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const COPY = {
  en: {
    title: "Relationship Articles & Advice",
    subtitle: "A curated library of real relationship guidance from established professional and health sources.",
    back: "Back to Relationship Support",
    search: "Search topics, titles, or sources...",
    category: "Browse by Topic",
    all: "All Articles",
    modernDating: "Modern Dating",
    communication: "Communication",
    trust: "Trust & Boundaries",
    intimacy: "Intimacy",
    marriage: "Marriage & Commitment",
    healthy: "Healthy Relationships",
    modernTitle: "Modern dating can be confusing. Start here.",
    modernBody: "Ghosting, situationships, love bombing, dating-app fatigue, mixed signals, red flags, and online dating are now part of everyday relationship questions. This section brings those topics into One2OneLove without pretending there is one answer for everyone.",
    modernCta: "Explore Modern Dating",
    showing: "Showing",
    article: "article",
    articles: "articles",
    open: "Read at Source",
    source: "Source",
    originalTitle: "Original publisher title",
    noResults: "No articles match your search.",
    noResultsHint: "Try another topic or clear the search.",
    disclaimerTitle: "Curated, not copied",
    disclaimer: "One2OneLove links to the original publisher. We do not present third-party articles as our own, and inclusion does not mean every viewpoint will fit every relationship.",
    topicHelp: {
      modernDating: "Dating apps, ghosting, situationships, red flags, mixed signals, and new relationship decisions.",
      communication: "Conflict, listening, repair, criticism, defensiveness, and healthier conversations.",
      trust: "Trust-building, boundaries, betrayal, accountability, and emotional safety.",
      intimacy: "Emotional closeness, consent, affection, sex, and deeper connection.",
      marriage: "Premarital conversations, commitment, long-term connection, and rebuilding closeness.",
      healthy: "Healthy versus unhealthy patterns, mutual respect, safety, and relationship basics.",
    },
  },
  es: {
    title: "Artículos y Consejos sobre Relaciones",
    subtitle: "Una biblioteca seleccionada de orientación real sobre relaciones de fuentes profesionales y de salud reconocidas.",
    back: "Volver a Apoyo para Relaciones",
    search: "Buscar temas, títulos o fuentes...",
    category: "Explorar por Tema",
    all: "Todos los Artículos",
    modernDating: "Citas Modernas",
    communication: "Comunicación",
    trust: "Confianza y Límites",
    intimacy: "Intimidad",
    marriage: "Matrimonio y Compromiso",
    healthy: "Relaciones Saludables",
    modernTitle: "Las citas modernas pueden ser confusas. Empieza aquí.",
    modernBody: "Ghosting, situaciones sin definir, love bombing, cansancio de las apps de citas, señales mixtas, alertas y citas en línea forman parte de las preguntas actuales. Esta sección reúne esos temas sin asumir que existe una sola respuesta para todos.",
    modernCta: "Explorar Citas Modernas",
    showing: "Mostrando",
    article: "artículo",
    articles: "artículos",
    open: "Leer en la Fuente",
    source: "Fuente",
    originalTitle: "Título original del editor",
    noResults: "Ningún artículo coincide con tu búsqueda.",
    noResultsHint: "Prueba otro tema o borra la búsqueda.",
    disclaimerTitle: "Seleccionados, no copiados",
    disclaimer: "One2OneLove enlaza al editor original. No presentamos artículos de terceros como propios, y su inclusión no significa que cada punto de vista se adapte a cada relación.",
    topicHelp: {
      modernDating: "Apps de citas, ghosting, situaciones ambiguas, alertas, señales mixtas y decisiones al iniciar una relación.",
      communication: "Conflicto, escucha, reparación, críticas, defensividad y conversaciones más saludables.",
      trust: "Construcción de confianza, límites, traición, responsabilidad y seguridad emocional.",
      intimacy: "Cercanía emocional, consentimiento, afecto, sexo y conexión más profunda.",
      marriage: "Conversaciones prematrimoniales, compromiso, conexión a largo plazo y recuperación de la cercanía.",
      healthy: "Patrones saludables y no saludables, respeto mutuo, seguridad y fundamentos de una relación.",
    },
  },
  fr: {
    title: "Articles et Conseils sur les Relations",
    subtitle: "Une bibliothèque sélectionnée de conseils relationnels réels provenant de sources professionnelles et de santé reconnues.",
    back: "Retour au Soutien Relationnel",
    search: "Rechercher des thèmes, titres ou sources...",
    category: "Explorer par Thème",
    all: "Tous les Articles",
    modernDating: "Rencontres Modernes",
    communication: "Communication",
    trust: "Confiance et Limites",
    intimacy: "Intimité",
    marriage: "Mariage et Engagement",
    healthy: "Relations Saines",
    modernTitle: "Les rencontres modernes peuvent être déroutantes. Commencez ici.",
    modernBody: "Ghosting, situations ambiguës, love bombing, fatigue des applications, signaux contradictoires et drapeaux rouges font désormais partie des questions courantes. Cette section rassemble ces sujets sans prétendre qu'une seule réponse convient à tout le monde.",
    modernCta: "Explorer les Rencontres Modernes",
    showing: "Affichage de",
    article: "article",
    articles: "articles",
    open: "Lire à la Source",
    source: "Source",
    originalTitle: "Titre original de l'éditeur",
    noResults: "Aucun article ne correspond à votre recherche.",
    noResultsHint: "Essayez un autre thème ou effacez la recherche.",
    disclaimerTitle: "Sélectionnés, pas copiés",
    disclaimer: "One2OneLove renvoie vers l'éditeur d'origine. Nous ne présentons pas les articles de tiers comme les nôtres, et leur inclusion ne signifie pas que chaque point de vue convient à chaque relation.",
    topicHelp: {
      modernDating: "Applications de rencontre, ghosting, situations ambiguës, drapeaux rouges, signaux contradictoires et décisions en début de relation.",
      communication: "Conflit, écoute, réparation, critique, défensive et conversations plus saines.",
      trust: "Construction de la confiance, limites, trahison, responsabilité et sécurité émotionnelle.",
      intimacy: "Proximité émotionnelle, consentement, affection, sexualité et connexion plus profonde.",
      marriage: "Conversations avant le mariage, engagement, lien à long terme et reconstruction de la proximité.",
      healthy: "Schémas sains ou malsains, respect mutuel, sécurité et bases d'une relation.",
    },
  },
  it: {
    title: "Articoli e Consigli sulle Relazioni",
    subtitle: "Una raccolta selezionata di consigli reali sulle relazioni provenienti da fonti professionali e sanitarie riconosciute.",
    back: "Torna al Supporto Relazionale",
    search: "Cerca argomenti, titoli o fonti...",
    category: "Esplora per Argomento",
    all: "Tutti gli Articoli",
    modernDating: "Dating Moderno",
    communication: "Comunicazione",
    trust: "Fiducia e Confini",
    intimacy: "Intimità",
    marriage: "Matrimonio e Impegno",
    healthy: "Relazioni Sane",
    modernTitle: "Il dating moderno può essere confuso. Inizia qui.",
    modernBody: "Ghosting, situazioni non definite, love bombing, stanchezza da app, segnali contrastanti e red flag fanno ormai parte delle domande comuni. Questa sezione riunisce questi temi senza fingere che esista una sola risposta valida per tutti.",
    modernCta: "Esplora il Dating Moderno",
    showing: "Mostrando",
    article: "articolo",
    articles: "articoli",
    open: "Leggi alla Fonte",
    source: "Fonte",
    originalTitle: "Titolo originale dell'editore",
    noResults: "Nessun articolo corrisponde alla ricerca.",
    noResultsHint: "Prova un altro argomento o cancella la ricerca.",
    disclaimerTitle: "Selezionati, non copiati",
    disclaimer: "One2OneLove rimanda all'editore originale. Non presentiamo articoli di terzi come nostri e l'inclusione non significa che ogni punto di vista sia adatto a ogni relazione.",
    topicHelp: {
      modernDating: "App di incontri, ghosting, situazioni ambigue, red flag, segnali contrastanti e decisioni nelle nuove relazioni.",
      communication: "Conflitto, ascolto, riparazione, critica, difensività e conversazioni più sane.",
      trust: "Costruzione della fiducia, confini, tradimento, responsabilità e sicurezza emotiva.",
      intimacy: "Vicinanza emotiva, consenso, affetto, sesso e connessione più profonda.",
      marriage: "Conversazioni prematrimoniali, impegno, connessione a lungo termine e recupero della vicinanza.",
      healthy: "Modelli sani e malsani, rispetto reciproco, sicurezza e basi di una relazione.",
    },
  },
  de: {
    title: "Beziehungsartikel & Ratschläge",
    subtitle: "Eine kuratierte Sammlung echter Beziehungsinformationen aus etablierten professionellen und gesundheitlichen Quellen.",
    back: "Zurück zur Beziehungsunterstützung",
    search: "Themen, Titel oder Quellen durchsuchen...",
    category: "Nach Thema Durchsuchen",
    all: "Alle Artikel",
    modernDating: "Modernes Dating",
    communication: "Kommunikation",
    trust: "Vertrauen & Grenzen",
    intimacy: "Intimität",
    marriage: "Ehe & Bindung",
    healthy: "Gesunde Beziehungen",
    modernTitle: "Modernes Dating kann verwirrend sein. Starten Sie hier.",
    modernBody: "Ghosting, Situationships, Love Bombing, Dating-App-Müdigkeit, gemischte Signale und Warnzeichen gehören heute zu den häufigsten Fragen. Dieser Bereich bündelt diese Themen, ohne so zu tun, als gäbe es eine einzige Antwort für alle.",
    modernCta: "Modernes Dating Erkunden",
    showing: "Angezeigt werden",
    article: "Artikel",
    articles: "Artikel",
    open: "Bei der Quelle Lesen",
    source: "Quelle",
    originalTitle: "Originaltitel des Herausgebers",
    noResults: "Keine Artikel passen zu Ihrer Suche.",
    noResultsHint: "Versuchen Sie ein anderes Thema oder löschen Sie die Suche.",
    disclaimerTitle: "Kuratiert, nicht kopiert",
    disclaimer: "One2OneLove verlinkt zur Originalquelle. Wir geben Artikel Dritter nicht als eigene Inhalte aus, und die Aufnahme bedeutet nicht, dass jede Sichtweise zu jeder Beziehung passt.",
    topicHelp: {
      modernDating: "Dating-Apps, Ghosting, Situationships, Warnzeichen, gemischte Signale und Entscheidungen in neuen Beziehungen.",
      communication: "Konflikt, Zuhören, Reparatur, Kritik, Abwehrhaltung und gesündere Gespräche.",
      trust: "Vertrauensaufbau, Grenzen, Verrat, Verantwortung und emotionale Sicherheit.",
      intimacy: "Emotionale Nähe, Zustimmung, Zuneigung, Sexualität und tiefere Verbindung.",
      marriage: "Gespräche vor der Ehe, Bindung, langfristige Verbindung und Wiederaufbau von Nähe.",
      healthy: "Gesunde und ungesunde Muster, gegenseitiger Respekt, Sicherheit und Beziehungsgrundlagen.",
    },
  },
};

const ARTICLE_LIBRARY = [
  { id: "apa-dating-profiles", title: "Stories, not shopping lists: Narrative dating profiles draw more interest", source: "American Psychological Association", category: "modernDating", tags: ["online dating", "dating apps", "profiles", "connection"], url: "https://www.apa.org/news/press/releases/2026/03/narrative-dating-profiles", featured: true },
  { id: "gottman-red-green-flags", title: "Red Flag/Green Flag: What to Look for When You’re Dating", source: "The Gottman Institute", category: "modernDating", tags: ["red flags", "green flags", "dating", "boundaries"], url: "https://www.gottman.com/blog/red-flag-green-flag-what-to-look-for-when-youre-dating/", featured: true },
  { id: "pt-situationships", title: "Situationships Aren’t Casual, They’re Draining", source: "Psychology Today", category: "modernDating", tags: ["situationships", "ambiguity", "dating", "clarity"], url: "https://www.psychologytoday.com/us/blog/couples-thrive/202604/situationships-arent-casual-theyre-draining", featured: true },
  { id: "pt-ghosting", title: "What Really Drives Ghosting in Relationships", source: "Psychology Today", category: "modernDating", tags: ["ghosting", "online dating", "rejection", "communication"], url: "https://www.psychologytoday.com/us/blog/understanding-ptsd/202311/the-psychology-behind-ghosting-in-a-romantic-relationship", featured: true },
  { id: "pt-love-bombing", title: "10 Signs of Love Bombing a Lot of People Might Miss", source: "Psychology Today", category: "modernDating", tags: ["love bombing", "red flags", "dating", "manipulation"], url: "https://www.psychologytoday.com/us/blog/mindful-dating/202605/10-signs-of-love-bombing-a-lot-of-people-might-miss/amp" },
  { id: "pt-modern-dating-terms", title: "21 Terms That Explain Modern Dating", source: "Psychology Today", category: "modernDating", tags: ["modern dating", "ghosting", "breadcrumbing", "dating terms"], url: "https://www.psychologytoday.com/us/blog/the-psychology-of-relationships/202501/decoding-modern-dating-the-new-lingo-you-need-to-know" },
  { id: "gottman-four-horsemen", title: "The Four Horsemen: Criticism, Contempt, Defensiveness, and Stonewalling", source: "The Gottman Institute", category: "communication", tags: ["conflict", "criticism", "defensiveness", "stonewalling"], url: "https://www.gottman.com/blog/the-four-horsemen-recognizing-criticism-contempt-defensiveness-and-stonewalling/" },
  { id: "gottman-communication-problems", title: "Solving Relationship Communication Problems: How Couples Overcome Issues in Relationships", source: "The Gottman Institute", category: "communication", tags: ["communication", "conflict", "listening", "connection"], url: "https://www.gottman.com/blog/solving-relationship-communication-problems-how-couples-overcome-issues-in-relationships/" },
  { id: "gottman-repair", title: "Repair is the Secret Weapon of Emotionally Connected Couples", source: "The Gottman Institute", category: "communication", tags: ["repair", "arguments", "conflict", "connection"], url: "https://www.gottman.com/blog/repair-secret-weapon-emotionally-connected-couples/" },
  { id: "gottman-trust", title: "How to Build Trust in Your Relationship", source: "The Gottman Institute", category: "trust", tags: ["trust", "emotional safety", "attunement", "commitment"], url: "https://www.gottman.com/blog/trust/" },
  { id: "cleveland-trust", title: "Learn How To Build Trust in Any Relationship", source: "Cleveland Clinic", category: "trust", tags: ["trust", "boundaries", "respect", "expectations"], url: "https://health.clevelandclinic.org/how-to-build-trust-in-a-relationship" },
  { id: "gottman-affair", title: "Can a Relationship Survive an Affair?", source: "The Gottman Institute", category: "trust", tags: ["infidelity", "betrayal", "trust", "recovery"], url: "https://www.gottman.com/blog/can-a-relationship-survive-an-affair/" },
  { id: "planned-parenthood-consent", title: "How do I talk about consent?", source: "Planned Parenthood", category: "intimacy", tags: ["consent", "boundaries", "sex", "communication"], url: "https://www.plannedparenthood.org/learn/relationships/sexual-consent/how-do-i-talk-about-consent" },
  { id: "gottman-emotional-intimacy", title: "75 Insightful Questions to Deepen Emotional Intimacy", source: "The Gottman Institute", category: "intimacy", tags: ["emotional intimacy", "questions", "connection", "compatibility"], url: "https://www.gottman.com/blog/75-insightful-questions-to-deepen-emotional-intimacy/" },
  { id: "gottman-passion", title: "10 Ways to Rekindle the Passion in Your Marriage", source: "The Gottman Institute", category: "intimacy", tags: ["passion", "sex", "marriage", "emotional intimacy"], url: "https://www.gottman.com/blog/10-ways-rekindle-passion-marriage/" },
  { id: "gottman-premarital", title: "5 Premarital Conversations to Help You Sustain Love", source: "The Gottman Institute", category: "marriage", tags: ["premarital", "marriage", "commitment", "finances"], url: "https://www.gottman.com/blog/5-premarital-conversations-sustain-love/" },
  { id: "gottman-rekindle", title: "How to Rekindle a Relationship When Romance, Intimacy, and Passion Have All Been Gone", source: "The Gottman Institute", category: "marriage", tags: ["long-term relationships", "marriage", "intimacy", "reconnection"], url: "https://www.gottman.com/blog/how-to-rekindle-a-relationship/" },
  { id: "apa-healthy-couples", title: "Happy couples: How to keep your relationship healthy", source: "American Psychological Association", category: "healthy", tags: ["healthy relationships", "communication", "conflict", "connection"], url: "https://www.apa.org/topics/healthy-relationships" },
  { id: "planned-parenthood-healthy", title: "Healthy Relationships", source: "Planned Parenthood", category: "healthy", tags: ["healthy relationship", "respect", "communication", "consent"], url: "https://www.plannedparenthood.org/learn/relationships/healthy-relationships" },
  { id: "planned-parenthood-unhealthy", title: "What makes a relationship unhealthy?", source: "Planned Parenthood", category: "healthy", tags: ["unhealthy relationships", "control", "jealousy", "safety"], url: "https://www.plannedparenthood.org/learn/relationships/healthy-relationships/what-makes-relationship-unhealthy" },
];

const CATEGORY_CONFIG = [
  { id: "all", icon: BookOpen },
  { id: "modernDating", icon: Sparkles },
  { id: "communication", icon: MessageCircle },
  { id: "trust", icon: ShieldCheck },
  { id: "intimacy", icon: Heart },
  { id: "marriage", icon: Users },
  { id: "healthy", icon: ShieldCheck },
];

export default function ArticlesSupport() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categoryName = (id) => (id === "all" ? t.all : t[id] || id);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ARTICLE_LIBRARY.filter((article) => {
      const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return [article.title, article.source, article.category, ...article.tags].join(" ").toLowerCase().includes(query);
    });
  }, [selectedCategory, searchQuery]);

  const handleModernDating = () => {
    setSelectedCategory("modernDating");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Link to={createPageUrl("CoupleSupport")} className="inline-flex items-center self-start px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
              <ArrowLeft size={20} className="mr-2" />
              {t.back}
            </Link>
            <div className="flex items-center">
              <BookOpen className="text-purple-500 mr-3 shrink-0" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-sm text-gray-600">{t.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <section className="mb-10 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 text-white p-7 md:p-10 shadow-xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              {t.modernDating}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.modernTitle}</h2>
            <p className="text-base md:text-lg text-white/90 leading-relaxed mb-6">{t.modernBody}</p>
            <button type="button" onClick={handleModernDating} className="inline-flex items-center rounded-xl bg-white text-purple-700 px-5 py-3 font-bold shadow hover:bg-purple-50 transition-colors">
              {t.modernCta}
            </button>
          </div>
        </section>

        <section className="mb-8">
          <div className="relative max-w-3xl mx-auto mb-7">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search} className="pl-12 pr-12 h-14 bg-white text-base shadow-md rounded-2xl" />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Clear search">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t.category}</h3>
          <div className="flex flex-wrap gap-3">
            {CATEGORY_CONFIG.map(({ id, icon: Icon }) => (
              <button type="button" key={id} onClick={() => setSelectedCategory(id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${selectedCategory === id ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-purple-50 shadow-sm"}`}>
                <Icon className="w-4 h-4" />
                {categoryName(id)}
              </button>
            ))}
          </div>
        </section>

        {selectedCategory !== "all" && (
          <div className="mb-8 rounded-2xl bg-white/80 border border-purple-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{categoryName(selectedCategory)}</h2>
            <p className="text-gray-600">{t.topicHelp[selectedCategory]}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {t.showing} <span className="font-bold text-purple-700">{filteredArticles.length}</span> {filteredArticles.length === 1 ? t.article : t.articles}
          </p>
        </div>

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredArticles.map((article, index) => (
              <motion.div key={article.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.18) }}>
                <Card className="h-full bg-white/95 hover:shadow-xl transition-all duration-300 border border-purple-100 hover:border-purple-300">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="inline-flex rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-semibold">{categoryName(article.category)}</span>
                      {article.featured && <span className="inline-flex rounded-full bg-pink-100 text-pink-700 px-3 py-1 text-xs font-semibold">{t.modernDating}</span>}
                    </div>
                    <CardTitle className="text-xl leading-snug text-gray-900">{article.title}</CardTitle>
                    <p className="text-xs text-gray-500 mt-2">{t.originalTitle}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col h-[calc(100%-1rem)]">
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">{t.source}</p>
                      <p className="font-semibold text-gray-800">{article.source}</p>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-5">{t.topicHelp[article.category]}</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {article.tags.slice(0, 3).map((tag) => <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">#{tag}</span>)}
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-4 py-3 hover:opacity-90 transition-opacity">
                      {t.open}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 rounded-3xl border border-purple-100 mb-12">
            <BookOpen className="w-14 h-14 text-purple-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">{t.noResults}</h3>
            <p className="text-gray-500">{t.noResultsHint}</p>
          </div>
        )}

        <section className="rounded-2xl bg-white border border-purple-100 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{t.disclaimerTitle}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.disclaimer}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
