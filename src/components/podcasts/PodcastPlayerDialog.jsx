import React, { useEffect, useState } from "react";
import { ExternalLink, Loader2, Mic, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  formatEpisodeDate,
  formatEpisodeDuration,
  resolvePodcastEpisode,
  resolvePodcastMetadata,
} from "@/lib/applePodcastService";

const matureTerms = [
  /\bsex\b/i, /sexual/i, /porn/i, /kink/i, /erection/i, /orgasm/i,
  /menopaus/i, /desire/i, /désir/i, /deseo/i, /sessual/i,
  /intimità/i, /intimidad/i, /fetish/i, /fetisj/i, /placer/i, /excita/i,
];

const isMatureEpisode = (episode) => {
  if (typeof episode?.mature === "boolean") return episode.mature;
  return matureTerms.some((pattern) => pattern.test(episode?.title || ""));
};

export default function PodcastPlayerDialog({ podcast, onClose, t, locale }) {
  const [metadata, setMetadata] = useState(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [resolvedEpisode, setResolvedEpisode] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    let active = true;
    if (!podcast) return undefined;

    setSelectedEpisodeId(podcast.episodes?.[0]?.id || "");
    setResolvedEpisode(null);
    setResolveError("");
    setMetadata(null);

    resolvePodcastMetadata(podcast).then((result) => {
      if (active) setMetadata(result);
    });

    return () => {
      active = false;
    };
  }, [podcast]);

  const selectedEpisode = podcast?.episodes?.find((episode) => episode.id === selectedEpisodeId) || null;
  const selectedIsMature = isMatureEpisode(selectedEpisode);

  const playEpisode = async () => {
    if (!podcast || !selectedEpisode) return;
    setIsResolving(true);
    setResolveError("");
    setResolvedEpisode(null);

    try {
      const resolved = await resolvePodcastEpisode(podcast, selectedEpisode);
      setResolvedEpisode(resolved);
      if (!resolved?.resolved || !resolved?.embedUrl) setResolveError(t.unavailable);
    } catch (error) {
      console.error("Podcast episode resolution failed:", error);
      setResolveError(t.unavailable);
      setResolvedEpisode({
        resolved: false,
        sourceUrl: metadata?.collectionViewUrl || podcast.sourceUrl || null,
      });
    } finally {
      setIsResolving(false);
    }
  };

  if (!podcast) return null;

  const displayArtwork = resolvedEpisode?.artworkUrl || metadata?.artworkUrl || null;
  const resolvedDate = resolvedEpisode?.releaseDate || selectedEpisode?.date || null;
  const resolvedDuration = resolvedEpisode?.durationMs ? formatEpisodeDuration(resolvedEpisode.durationMs) : null;
  const fallbackUrl = resolvedEpisode?.sourceUrl || metadata?.collectionViewUrl || podcast.sourceUrl || null;

  return (
    <Dialog open={Boolean(podcast)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col gap-5 pr-6 sm:flex-row sm:items-center">
            <div className="relative mx-auto shrink-0 pb-4 pr-4 sm:mx-0">
              {displayArtwork ? (
                <img src={displayArtwork} alt={`${podcast.title} podcast cover`} className="h-32 w-32 rounded-2xl object-cover shadow-lg ring-1 ring-black/5" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <Mic className="h-12 w-12 text-white" />
                </div>
              )}
              {podcast.hostImageUrl && (
                <img
                  src={podcast.hostImageUrl}
                  alt={podcast.hostImageAlt || podcast.host}
                  className="absolute bottom-0 right-0 h-20 w-20 rounded-full border-4 border-white object-cover object-top shadow-lg"
                />
              )}
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <div className="mb-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{podcast.language}</span>
                {podcast.lgbtq && <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-700">{t.lgbtq}</span>}
              </div>
              <DialogTitle className="text-2xl leading-tight sm:text-3xl">{podcast.title}</DialogTitle>
              <DialogDescription className="mt-1 text-base">{podcast.host}</DialogDescription>
              <p className="mt-1 text-xs text-gray-500">{podcast.market}</p>
              {podcast.hostImageCredit && (
                <a href={podcast.hostImageCreditUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] text-gray-500 underline-offset-2 hover:underline">
                  Photo: {podcast.hostImageCredit}
                </a>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <p className="text-sm leading-6 text-gray-700">{podcast.description}</p>

          <div>
            <label htmlFor="podcast-episode-select" className="mb-2 block text-sm font-semibold text-gray-800">{t.chooseEpisode}</label>
            <select
              id="podcast-episode-select"
              value={selectedEpisodeId}
              onChange={(event) => {
                setSelectedEpisodeId(event.target.value);
                setResolvedEpisode(null);
                setResolveError("");
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              {podcast.episodes.map((episode) => (
                <option key={episode.id} value={episode.id}>
                  {isMatureEpisode(episode) ? "18+ • " : ""}{episode.title}{episode.date ? ` — ${formatEpisodeDate(episode.date, locale)}` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedIsMature && (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              <ShieldCheck className="h-4 w-4" />{t.mature}
            </div>
          )}

          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-6 hover:opacity-90" disabled={!selectedEpisode || isResolving} onClick={playEpisode}>
            {isResolving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.loadingAudio}</> : <><PlayCircle className="mr-2 h-5 w-5" />{t.listenNow}</>}
          </Button>

          {resolvedEpisode?.resolved && resolvedEpisode?.embedUrl && (
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <h3 className="font-semibold text-gray-900">{resolvedEpisode.title || selectedEpisode.title}</h3>
              {(resolvedDate || resolvedDuration) && (
                <p className="mb-3 mt-1 text-xs text-gray-600">
                  {[resolvedDate ? formatEpisodeDate(resolvedDate, locale) : null, resolvedDuration].filter(Boolean).join(" · ")}
                </p>
              )}
              <iframe
                key={resolvedEpisode.trackId || selectedEpisode.id}
                src={resolvedEpisode.embedUrl}
                title={`${podcast.title} — ${resolvedEpisode.title || selectedEpisode.title}`}
                className="w-full rounded-xl bg-white"
                height="175"
                frameBorder="0"
                scrolling="no"
                allow="autoplay; clipboard-write"
                loading="lazy"
              />
              <p className="mt-3 text-center text-xs leading-5 text-gray-500">{t.officialAudio}</p>
            </div>
          )}

          {resolveError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-900">{resolveError}</p>
              {fallbackUrl && (
                <a href={fallbackUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-800">
                  <ExternalLink className="h-4 w-4" />{t.openSource}
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
