
import React, { useEffect, useState } from "react";
import { Mic, ArrowLeft, Heart, Users, MessageCircle, TrendingUp, PlayCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Relationship Podcasts",
    subtitle: "Listen to relationship podcasts and expert advice for couples",
    back: "Back to Support",
    category: "Category",
    categories: { all: "All Podcasts", communication: "Communication", intimacy: "Intimacy & Connection", conflict: "Conflict Resolution", dating: "Dating & Singles", marriage: "Marriage", growth: "Personal Growth" },
    featuredPodcasts: "Featured Podcasts",
    episodes: "episodes",
    avgDuration: "Avg",
    listenNow: "Listen Now",
    chooseEpisode: "Choose an Episode",
    selectedEpisodes: "selected episodes",
    officialAudio: "Audio streams from the podcast publisher's official player.",
    ctaTitle: "Start Your Relationship Journey Today",
    ctaSubtitle: "Subscribe to these podcasts and get expert relationship advice delivered to your ears weekly",
    exploreAll: "Explore All Podcasts"
  },
  es: {
    title: "Podcasts de Relaciones",
    subtitle: "Escucha podcasts de relaciones y consejos de expertos para parejas",
    back: "Volver al Apoyo",
    category: "Categoría",
    categories: { all: "Todos los Podcasts", communication: "Comunicación", intimacy: "Intimidad y Conexión", conflict: "Resolución de Conflictos", dating: "Citas y Solteros", marriage: "Matrimonio", growth: "Crecimiento Personal" },
    featuredPodcasts: "Podcasts Destacados",
    episodes: "episodios",
    avgDuration: "Promedio",
    listenNow: "Escuchar Ahora",
    chooseEpisode: "Elige un Episodio",
    selectedEpisodes: "episodios seleccionados",
    officialAudio: "El audio se transmite desde el reproductor oficial del podcast.",
    ctaTitle: "Comienza Tu Viaje de Relación Hoy",
    ctaSubtitle: "Suscríbete a estos podcasts y recibe consejos expertos de relaciones directamente en tus oídos semanalmente",
    exploreAll: "Explorar Todos los Podcasts"
  },
  fr: {
    title: "Podcasts sur les Relations",
    subtitle: "Écoutez des podcasts sur les relations et des conseils d'experts pour les couples",
    back: "Retour au Soutien",
    category: "Catégorie",
    categories: { all: "Tous les Podcasts", communication: "Communication", intimacy: "Intimité et Connexion", conflict: "Résolution de Conflits", dating: "Rencontres et Célibataires", marriage: "Mariage", growth: "Croissance Personnelle" },
    featuredPodcasts: "Podcasts en Vedette",
    episodes: "épisodes",
    avgDuration: "Moy",
    listenNow: "Écouter Maintenant",
    chooseEpisode: "Choisir un Épisode",
    selectedEpisodes: "épisodes sélectionnés",
    officialAudio: "L'audio est diffusé depuis le lecteur officiel de l'éditeur du podcast.",
    ctaTitle: "Commencez Votre Parcours Relationnel Aujourd'hui",
    ctaSubtitle: "Abonnez-vous à ces podcasts et recevez des conseils d'experts en relations directement dans vos oreilles chaque semaine",
    exploreAll: "Explorer Tous les Podcasts"
  },
  it: {
    title: "Podcast sulle Relazioni",
    subtitle: "Ascolta podcast sulle relazioni e consigli di esperti per coppie",
    back: "Torna al Supporto",
    category: "Categoria",
    categories: { all: "Tutti i Podcast", communication: "Comunicazione", intimacy: "Intimità e Connessione", conflict: "Risoluzione dei Conflitti", dating: "Appuntamenti e Single", marriage: "Matrimonio", growth: "Crescita Personale" },
    featuredPodcasts: "Podcast in Evidenza",
    episodes: "episodi",
    avgDuration: "Media",
    listenNow: "Ascolta Ora",
    chooseEpisode: "Scegli un Episodio",
    selectedEpisodes: "episodi selezionati",
    officialAudio: "L'audio viene riprodotto dal lettore ufficiale dell'editore del podcast.",
    ctaTitle: "Inizia Il Tuo Viaggio Relazionale Oggi",
    ctaSubtitle: "Iscriviti a questi podcast e ricevi consigli esperti sulle relazioni direttamente nelle tue orecchie ogni settimana",
    exploreAll: "Esplora Tutti i Podcast"
  },
  de: {
    title: "Beziehungspodcasts",
    subtitle: "Hören Sie Beziehungspodcasts und Expertenrat für Paare",
    back: "Zurück zur Unterstützung",
    category: "Kategorie",
    categories: { all: "Alle Podcasts", communication: "Kommunikation", intimacy: "Intimität & Verbindung", conflict: "Konfliktlösung", dating: "Dating & Singles", marriage: "Ehe", growth: "Persönliches Wachstum" },
    featuredPodcasts: "Hervorgehobene Podcasts",
    episodes: "Episoden",
    avgDuration: "Durchschn.",
    listenNow: "Jetzt Anhören",
    chooseEpisode: "Episode Auswählen",
    selectedEpisodes: "ausgewählte Episoden",
    officialAudio: "Das Audio wird über den offiziellen Player des Podcast-Anbieters gestreamt.",
    ctaTitle: "Beginnen Sie Ihre Beziehungsreise Heute",
    ctaSubtitle: "Abonnieren Sie diese Podcasts und erhalten Sie wöchentlich Expertenrat für Beziehungen in Ihre Ohren geliefert",
    exploreAll: "Alle Podcasts Erkunden"
  },
  nl: {
    title: "Relatie Podcasts",
    subtitle: "Luister naar relatiepodcasts en expert advies voor koppels",
    back: "Terug naar Ondersteuning",
    category: "Categorie",
    categories: { all: "Alle Podcasts", communication: "Communicatie", intimacy: "Intimiteit & Verbinding", conflict: "Conflictoplossing", dating: "Daten & Singles", marriage: "Huwelijk", growth: "Persoonlijke Groei" },
    featuredPodcasts: "Uitgelichte Podcasts",
    episodes: "afleveringen",
    avgDuration: "Gem",
    listenNow: "Nu Beluisteren",
    chooseEpisode: "Kies een Aflevering",
    selectedEpisodes: "geselecteerde afleveringen",
    officialAudio: "De audio wordt gestreamd via de officiële speler van de podcastuitgever.",
    ctaTitle: "Begin Je Relatiereis Vandaag",
    ctaSubtitle: "Abonneer je op deze podcasts en ontvang wekelijks expert relatieadvies in je oren",
    exploreAll: "Alle Podcasts Verkennen"
  },
  pt: {
    title: "Podcasts de Relacionamento",
    subtitle: "Ouça podcasts sobre relacionamentos e conselhos de especialistas para casais",
    back: "Voltar ao Suporte",
    category: "Categoria",
    categories: { all: "Todos os Podcasts", communication: "Comunicação", intimacy: "Intimidade e Conexão", conflict: "Resolução de Conflitos", dating: "Namoro e Solteiros", marriage: "Casamento", growth: "Crescimento Pessoal" },
    featuredPodcasts: "Podcasts em Destaque",
    episodes: "episódios",
    avgDuration: "Média",
    listenNow: "Ouvir Agora",
    chooseEpisode: "Escolha um Episódio",
    selectedEpisodes: "episódios selecionados",
    officialAudio: "O áudio é transmitido pelo player oficial da editora do podcast.",
    ctaTitle: "Comece Sua Jornada de Relacionamento Hoje",
    ctaSubtitle: "Inscreva-se nesses podcasts e receba conselhos especializados em relacionamentos semanalmente em seus ouvidos",
    exploreAll: "Explorar Todos os Podcasts"
  }
};

export default function PodcastsSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openPodcast, setOpenPodcast] = useState(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('');
  const [playingEpisodeId, setPlayingEpisodeId] = useState('');
  const [estherPodcastArtwork, setEstherPodcastArtwork] = useState('');

  useEffect(() => {
    let active = true;

    fetch('https://itunes.apple.com/lookup?id=1237931798&entity=podcast')
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        const artwork = data?.results?.[0]?.artworkUrl600 || data?.results?.[0]?.artworkUrl100;
        if (artwork) setEstherPodcastArtwork(artwork);
      })
      .catch(() => {
        // The play screen still has a branded fallback if Apple artwork is unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = [
    { id: 'all', name: t.categories.all, icon: Mic, color: 'from-pink-500 to-rose-600' },
    { id: 'communication', name: t.categories.communication, icon: MessageCircle, color: 'from-blue-500 to-cyan-600' },
    { id: 'intimacy', name: t.categories.intimacy, icon: Heart, color: 'from-red-500 to-pink-600' },
    { id: 'conflict', name: t.categories.conflict, icon: Users, color: 'from-purple-500 to-pink-600' },
    { id: 'dating', name: t.categories.dating, icon: Heart, color: 'from-orange-500 to-red-600' },
    { id: 'marriage', name: t.categories.marriage, icon: Heart, color: 'from-green-500 to-emerald-600' },
    { id: 'growth', name: t.categories.growth, icon: TrendingUp, color: 'from-yellow-500 to-orange-600' }
  ];

  const podcasts = [
    {
      id: 1,
      title: "The Relationship School Podcast",
      host: "Dr. Jayson and Ellen Gaddis",
      category: 'communication',
      episodes: 250,
      duration: "45 min",
      color: "from-blue-500 to-cyan-600",
      description: "Deep conversations about conscious relationships, communication skills, and personal growth for couples.",
      rating: 4.9
    },
    {
      id: 2,
      title: "Where Should We Begin?",
      host: "Esther Perel",
      category: 'intimacy',
      episodes: 180,
      duration: "50 min",
      color: "from-red-500 to-pink-600",
      description: "Real conversations exploring intimacy, desire, communication, trust, and the complexities of modern relationships.",
      rating: 4.8,
      podcastArtworkUrl: estherPodcastArtwork,
      hostImageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Esther%20Perel%20at%20SXSW%20London%202026.jpg?width=600",
      hostImageAlt: "Esther Perel at SXSW London 2026",
      hostImageCredit: "Mateusz Malta / Wikimedia Commons · CC BY-SA 4.0",
      hostImageCreditUrl: "https://commons.wikimedia.org/wiki/File:Esther_Perel_at_SXSW_London_2026.jpg",
      featuredEpisodes: [
        {
          id: 'on-again-off-again',
          title: "On Again/Off Again",
          date: "Aug 31, 2026",
          duration: "53 min",
          embedUrl: "https://playlist.megaphone.fm/?e=VMP8395182908"
        },
        {
          id: 'will-i-always-be-alone',
          title: "Will I Always Be Alone?",
          date: "Aug 24, 2026",
          duration: "49 min",
          embedUrl: "https://playlist.megaphone.fm/?e=VMP9310269222"
        },
        {
          id: 'can-i-be-loved',
          title: "Can I Be Loved?",
          date: "Aug 17, 2026",
          duration: "37 min",
          embedUrl: "https://playlist.megaphone.fm/?e=VMP1492521442"
        },
        {
          id: 'let-go-of-my-ex',
          title: "I Love My Partner, So Why Can’t I Let Go of My Ex?",
          date: "Aug 3, 2026",
          duration: "51 min",
          embedUrl: "https://playlist.megaphone.fm/?e=VMP2690073404"
        },
        {
          id: 'chatgpt-relationship',
          title: "Is Using ChatGPT Hurting My Relationship?",
          date: "Jul 20, 2026",
          duration: "52 min",
          embedUrl: "https://playlist.megaphone.fm/?e=VMP6814785204"
        },
        {
          id: 'mating-in-captivity-20-years',
          title: "20 Years Later, Esther Revisits Mating in Captivity",
          date: "Jun 22, 2026",
          duration: "44 min",
          embedUrl: "https://playlist.megaphone.fm/?e=VMP1364412653"
        }
      ]
    },
    {
      id: 3,
      title: "The Love, Happiness & Success Podcast",
      host: "Dr. Lisa Marie Bobby",
      category: 'growth',
      episodes: 320,
      duration: "35 min",
      color: "from-yellow-500 to-orange-600",
      description: "Practical advice on creating healthy relationships while maintaining personal growth and happiness.",
      rating: 4.7
    },
    {
      id: 4,
      title: "Marriage Therapy Radio",
      host: "Zach Brittle",
      category: 'marriage',
      episodes: 200,
      duration: "30 min",
      color: "from-green-500 to-emerald-600",
      description: "Evidence-based strategies for building strong marriages based on the Gottman Method.",
      rating: 4.8
    },
    {
      id: 5,
      title: "The Art of Charm",
      host: "Jordan Harbinger",
      category: 'dating',
      episodes: 500,
      duration: "60 min",
      color: "from-orange-500 to-red-600",
      description: "Social dynamics, dating advice, and communication skills for singles and couples alike.",
      rating: 4.6
    },
    {
      id: 6,
      title: "Foreplay Radio",
      host: "George & Laurie Sapp",
      category: 'intimacy',
      episodes: 400,
      duration: "40 min",
      color: "from-pink-500 to-rose-600",
      description: "Honest conversations about sex, intimacy, and keeping the passion alive in long-term relationships.",
      rating: 4.7
    }
  ];

  const filteredPodcasts = selectedCategory === 'all'
    ? podcasts
    : podcasts.filter(podcast => podcast.category === selectedCategory);

  const openPodcastLibrary = (podcast) => {
    if (!podcast.featuredEpisodes?.length) return;
    setOpenPodcast(podcast);
    setSelectedEpisodeId(podcast.featuredEpisodes[0].id);
    setPlayingEpisodeId('');
  };

  const selectedEpisode = openPodcast?.featuredEpisodes?.find(
    episode => episode.id === selectedEpisodeId
  );

  const playingEpisode = openPodcast?.featuredEpisodes?.find(
    episode => episode.id === playingEpisodeId
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              to={createPageUrl("CoupleSupport")}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
            >
              <ArrowLeft size={20} className="mr-2" />
              {t.back}
            </Link>
            <div className="flex items-center">
              <Mic className="text-purple-500 mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t.category}</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Podcasts Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {t.featuredPodcasts}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPodcasts.map((podcast, index) => {
              const isLibraryPrototype = Boolean(podcast.featuredEpisodes?.length);

              return (
                <motion.div
                  key={podcast.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    onClick={() => isLibraryPrototype && openPodcastLibrary(podcast)}
                    className={`h-full hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 ${
                      isLibraryPrototype ? 'cursor-pointer' : ''
                    }`}
                  >
                    <CardHeader className={isLibraryPrototype ? 'pb-3' : undefined}>
                      <div className={`${isLibraryPrototype ? 'w-14 h-14' : 'w-20 h-20'} bg-gradient-to-br ${podcast.color} rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto`}>
                        <Mic className={`${isLibraryPrototype ? 'w-7 h-7' : 'w-10 h-10'} text-white`} />
                      </div>
                      <CardTitle className={`${isLibraryPrototype ? 'text-lg' : 'text-xl'} font-bold text-gray-900 text-center line-clamp-2`}>
                        {podcast.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 text-center">By {podcast.host}</p>
                    </CardHeader>
                    <CardContent>
                      {isLibraryPrototype ? (
                        <>
                          <p className="text-gray-700 leading-relaxed mb-4 text-center text-sm">
                            {podcast.description}
                          </p>
                          <div className="text-center text-sm font-medium text-purple-700 mb-4">
                            {podcast.featuredEpisodes.length} {t.selectedEpisodes}
                          </div>
                          <Button
                            className={`w-full bg-gradient-to-r ${podcast.color} hover:opacity-90`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openPodcastLibrary(podcast);
                            }}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {t.chooseEpisode}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-4 mb-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <PlayCircle className="w-4 h-4" />
                              <span>{podcast.episodes} {t.episodes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{t.avgDuration} {podcast.duration}</span>
                            </div>
                          </div>

                          <p className="text-gray-700 leading-relaxed mb-4 text-center">
                            {podcast.description}
                          </p>

                          <div className="flex items-center justify-center gap-1 mb-4">
                            {[...Array(5)].map((_, idx) => (
                              <Heart
                                key={idx}
                                className={`w-4 h-4 ${
                                  idx < Math.floor(podcast.rating)
                                    ? 'text-pink-500 fill-pink-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-2">({podcast.rating})</span>
                          </div>

                          <Button className={`w-full bg-gradient-to-r ${podcast.color} hover:opacity-90`}>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {t.listenNow}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl"
        >
          <Mic className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t.ctaSubtitle}
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
            {t.exploreAll}
          </Button>
        </motion.div>
      </div>

      <Dialog
        open={Boolean(openPodcast)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpenPodcast(null);
            setSelectedEpisodeId('');
            setPlayingEpisodeId('');
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-5 pr-6">
              <div className="relative shrink-0 pb-3 pr-3">
                {openPodcast?.podcastArtworkUrl ? (
                  <img
                    src={openPodcast.podcastArtworkUrl}
                    alt={`${openPodcast.title} podcast cover`}
                    className="h-28 w-28 rounded-2xl object-cover shadow-lg ring-1 ring-black/5"
                  />
                ) : (
                  <div className="h-28 w-28 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Mic className="w-12 h-12 text-white" />
                  </div>
                )}

                {openPodcast?.hostImageUrl && (
                  <img
                    src={openPodcast.hostImageUrl}
                    alt={openPodcast.hostImageAlt || openPodcast.host}
                    className="absolute bottom-0 right-0 h-16 w-16 rounded-full object-cover object-top border-4 border-white shadow-lg"
                  />
                )}
              </div>

              <div className="min-w-0 text-left">
                <DialogTitle className="text-2xl leading-tight">{openPodcast?.title}</DialogTitle>
                <DialogDescription className="mt-1 text-base">
                  {openPodcast?.host}
                </DialogDescription>
                {openPodcast?.hostImageCredit && (
                  <a
                    href={openPodcast.hostImageCreditUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-[11px] text-gray-500 underline-offset-2 hover:underline"
                  >
                    Photo: {openPodcast.hostImageCredit}
                  </a>
                )}
              </div>
            </div>
          </DialogHeader>

          {openPodcast && (
            <div className="space-y-5 pt-2">
              <p className="text-sm leading-relaxed text-gray-700">
                {openPodcast.description}
              </p>

              <div>
                <label htmlFor="podcast-episode-select" className="block text-sm font-semibold text-gray-800 mb-2">
                  {t.chooseEpisode}
                </label>
                <select
                  id="podcast-episode-select"
                  value={selectedEpisodeId}
                  onChange={(event) => {
                    setSelectedEpisodeId(event.target.value);
                    setPlayingEpisodeId('');
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  {openPodcast.featuredEpisodes.map((episode) => (
                    <option key={episode.id} value={episode.id}>
                      {episode.title} — {episode.date} · {episode.duration}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:opacity-90"
                disabled={!selectedEpisode}
                onClick={() => setPlayingEpisodeId(selectedEpisodeId)}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {t.listenNow}
              </Button>

              {playingEpisode && (
                <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {playingEpisode.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {playingEpisode.date} · {playingEpisode.duration}
                  </p>
                  <iframe
                    key={playingEpisode.id}
                    src={playingEpisode.embedUrl}
                    title={`${openPodcast.title} — ${playingEpisode.title}`}
                    className="w-full rounded-xl bg-white"
                    height="200"
                    frameBorder="0"
                    scrolling="no"
                    allow="autoplay; clipboard-write"
                  />
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    {t.officialAudio}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
