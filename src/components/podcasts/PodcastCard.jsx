import React from "react";
import { PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PodcastArtwork from "@/components/podcasts/PodcastArtwork";

export default function PodcastCard({ podcast, t, onOpen }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="h-full">
      <Card
        className="group h-full cursor-pointer overflow-hidden border border-purple-100 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl"
        onClick={() => onOpen(podcast)}
      >
        <CardHeader className="pb-3">
          <div className="mx-auto mb-3 h-28 w-28 overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5">
            <PodcastArtwork
              podcast={podcast}
              className="h-full w-full object-cover"
              fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500"
              iconClassName="h-10 w-10 text-white"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{podcast.language}</span>
            {podcast.lgbtq && (
              <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-700">{t.lgbtq}</span>
            )}
          </div>
          <CardTitle className="mt-2 line-clamp-2 text-center text-lg font-bold leading-snug text-gray-900">{podcast.title}</CardTitle>
          <p className="line-clamp-2 text-center text-sm text-gray-600">{t.by} {podcast.host}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="line-clamp-3 text-center text-sm leading-5 text-gray-600">{podcast.description}</p>
          <div className="my-4 text-center text-sm font-semibold text-purple-700">{podcast.episodes.length} {t.selectedEpisodes}</div>
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(podcast);
            }}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {t.chooseEpisode}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
