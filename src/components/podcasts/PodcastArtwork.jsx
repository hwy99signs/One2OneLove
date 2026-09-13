import React, { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { resolvePodcastMetadata } from "@/lib/applePodcastService";

export default function PodcastArtwork({ podcast, className = "", fallbackClassName = "", iconClassName = "" }) {
  const [metadata, setMetadata] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setMetadata(null);
    setFailed(false);
    resolvePodcastMetadata(podcast)
      .then((result) => active && setMetadata(result))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [podcast]);

  if (metadata?.artworkUrl && !failed) {
    return (
      <img
        src={metadata.artworkUrl}
        alt={`${podcast.title} podcast cover`}
        className={className}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={fallbackClassName} aria-hidden="true">
      <Mic className={iconClassName} />
    </div>
  );
}
