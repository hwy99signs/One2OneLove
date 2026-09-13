import React, { useMemo, useState } from "react";
import { ArrowLeft, Heart, Languages, MessageCircle, Mic, Search, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AdultSensitiveContentGate from "@/components/content/AdultSensitiveContentGate";
import PodcastCard from "@/components/podcasts/PodcastCard";
import PodcastPlayerDialog from "@/components/podcasts/PodcastPlayerDialog";
import { podcastLibrary, podcastLanguages } from "@/data/podcastLibrary";
import { podcastCopy, podcastLocaleByLanguage } from "@/data/podcastCopy";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const focusDefinitions = (t) => [
  { id: "all", name: t.categories.all, icon: Mic },
  { id: "communication", name: t.categories.communication, icon: MessageCircle },
  { id: "intimacy", name: t.categories.intimacy, icon: Heart },
  { id: "conflict", name: t.categories.conflict, icon: Users },
  { id: "dating", name: t.categories.dating, icon: Sparkles },
  { id: "marriage", name: t.categories.marriage, icon: Heart },
  { id: "growth", name: t.categories.growth, icon: TrendingUp },
  { id: "lgbtq", name: t.categories.lgbtq, icon: Sparkles },
];

function PodcastLibraryPage() {
  const { currentLanguage } = useLanguage();
  const t = podcastCopy[currentLanguage] || podcastCopy.en;
  const locale = podcastLocaleByLanguage[currentLanguage] || "en-US";
  const [selectedFocus, setSelectedFocus] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openPodcast, setOpenPodcast] = useState(null);

  const focusOptions = useMemo(() => focusDefinitions(t), [t]);
  const totalEpisodes = useMemo(() => podcastLibrary.reduce((sum, podcast) => sum + podcast.episodes.length, 0), []);

  const filteredPodcasts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return podcastLibrary.filter((podcast) => {
      const matchesFocus = selectedFocus === "all" || (selectedFocus === "lgbtq" ? podcast.lgbtq : podcast.focus?.includes(selectedFocus));
      const matchesLanguage = selectedLanguage === "all" || podcast.language === selectedLanguage;
      const haystack = [
        podcast.title,
        podcast.host,
        podcast.description,
        podcast.market,
        podcast.language,
        ...(podcast.focus || []),
        ...podcast.episodes.map((episode) => episode.title),
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesFocus && matchesLanguage && (!query || haystack.includes(query));
    });
  }, [searchTerm, selectedFocus, selectedLanguage]);

  const clearFilters = () => {
    setSelectedFocus("all");
    setSelectedLanguage("all");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="sticky top-0 z-40 border-b border-purple-100 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("CoupleSupport")} className="flex items-center rounded-xl px-3 py-2 text-gray-600 transition-all hover:bg-purple-50 hover:text-purple-600">
              <ArrowLeft className="mr-2 h-5 w-5" /><span className="hidden sm:inline">{t.back}</span>
            </Link>
            <div className="flex min-w-0 items-center">
              <Mic className="mr-3 h-8 w-8 shrink-0 text-purple-500" />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{t.title}</h1>
                <p className="hidden text-sm text-gray-600 sm:block">{t.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <section className="mb-8 rounded-3xl border border-purple-100 bg-white/90 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.library}</h2>
              <p className="mt-2 text-sm text-gray-600">{podcastLibrary.length} {t.creatorCount} · {totalEpisodes} {t.episodeCount} · {podcastLanguages.length} {t.languageCount}</p>
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.search}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><Sparkles className="h-4 w-4 text-purple-500" />{t.category}</div>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((option) => {
                const Icon = option.icon;
                const active = selectedFocus === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedFocus(option.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${active ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50"}`}
                  >
                    <Icon className="h-4 w-4" />{option.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:max-w-sm">
            <label htmlFor="podcast-language" className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Languages className="h-4 w-4 text-purple-500" />{t.language}</label>
            <select
              id="podcast-language"
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">{t.allLanguages}</option>
              {podcastLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
          </div>
        </section>

        {filteredPodcasts.length ? (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPodcasts.map((podcast) => <PodcastCard key={podcast.id} podcast={podcast} t={t} onOpen={setOpenPodcast} />)}
          </section>
        ) : (
          <section className="rounded-3xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <Mic className="mx-auto h-10 w-10 text-purple-400" />
            <p className="mt-4 font-semibold text-gray-800">{t.noResults}</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>{t.clearFilters}</Button>
          </section>
        )}

        <section className="mt-10 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
            <div>
              <h3 className="font-bold text-gray-900">{t.disclaimerTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{t.disclaimer}</p>
              <p className="mt-2 text-xs leading-5 text-gray-500">{t.fixedLibrary}</p>
            </div>
          </div>
        </section>
      </main>

      <PodcastPlayerDialog podcast={openPodcast} onClose={() => setOpenPodcast(null)} t={t} locale={locale} />
    </div>
  );
}

export default function PodcastsSupport() {
  return <AdultSensitiveContentGate><PodcastLibraryPage /></AdultSensitiveContentGate>;
}
