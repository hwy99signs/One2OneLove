const metadataCache = new Map();
const episodeListCache = new Map();

const safeJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Podcast lookup failed (${response.status})`);
  }
  return response.json();
};

const normalise = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[\u2018\u2019\u201c\u201d'"!?.,:;()[\]{}\-–—_/\\|*+#]/g, " ")
    .replace(/\b(ep|episode|episodio|folge|aflevering)\s*#?\s*\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const similarity = (a, b) => {
  const left = normalise(a);
  const right = normalise(b);
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (left.includes(right) || right.includes(left)) return 90;

  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size || 1;
  return (overlap / union) * 80;
};

const slugFromAppleUrl = (url) => {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\/podcast\/([^/]+)\/id\d+/);
    return match?.[1] || "podcast";
  } catch {
    return "podcast";
  }
};

const makeEmbedUrl = (country, collectionViewUrl, collectionId, trackId) => {
  if (!collectionId || !trackId) return null;
  const slug = slugFromAppleUrl(collectionViewUrl);
  return `https://embed.podcasts.apple.com/${country || "us"}/podcast/${slug}/id${collectionId}?i=${trackId}&theme=light`;
};

const choosePodcastResult = (results, podcast) => {
  const podcastResults = results.filter(
    (item) => item.wrapperType === "track" || item.kind === "podcast" || item.collectionId
  );

  return podcastResults
    .map((item) => ({
      item,
      score:
        similarity(item.collectionName || item.trackName, podcast.title) +
        similarity(item.artistName, podcast.host) * 0.35,
    }))
    .sort((a, b) => b.score - a.score)[0]?.item;
};

export async function resolvePodcastMetadata(podcast) {
  if (!podcast?.id) return null;
  if (metadataCache.has(podcast.id)) return metadataCache.get(podcast.id);

  const promise = (async () => {
    const country = podcast.appleCountry || "us";

    if (podcast.appleId) {
      const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(
        podcast.appleId
      )}&country=${country}&entity=podcast`;

      try {
        const data = await fetch(lookupUrl).then(safeJson);
        const match = data.results?.find(
          (item) => Number(item.collectionId) === Number(podcast.appleId)
        );
        if (match) {
          return {
            collectionId: match.collectionId,
            collectionViewUrl: match.collectionViewUrl,
            artworkUrl:
              match.artworkUrl600 ||
              match.artworkUrl100?.replace("100x100", "600x600") ||
              match.artworkUrl100,
            artistName: match.artistName,
            collectionName: match.collectionName,
            country,
          };
        }
      } catch {
        // Fall through to search.
      }
    }

    const term = encodeURIComponent(podcast.appleSearchTerm || `${podcast.title} ${podcast.host}`);
    const searchUrl = `https://itunes.apple.com/search?term=${term}&country=${country}&media=podcast&entity=podcast&limit=15`;
    const data = await fetch(searchUrl).then(safeJson);
    const match = choosePodcastResult(data.results || [], podcast);

    if (!match) {
      return {
        collectionId: null,
        collectionViewUrl: podcast.sourceUrl || null,
        artworkUrl: null,
        country,
      };
    }

    return {
      collectionId: match.collectionId,
      collectionViewUrl: match.collectionViewUrl,
      artworkUrl:
        match.artworkUrl600 ||
        match.artworkUrl100?.replace("100x100", "600x600") ||
        match.artworkUrl100,
      artistName: match.artistName,
      collectionName: match.collectionName,
      country,
    };
  })().catch(() => ({
    collectionId: null,
    collectionViewUrl: podcast.sourceUrl || null,
    artworkUrl: null,
    country: podcast.appleCountry || "us",
  }));

  metadataCache.set(podcast.id, promise);
  return promise;
}

async function getEpisodeList(podcast, metadata) {
  if (!metadata?.collectionId) return [];
  const key = `${podcast.id}:${metadata.collectionId}`;
  if (episodeListCache.has(key)) return episodeListCache.get(key);

  const promise = fetch(
    `https://itunes.apple.com/lookup?id=${metadata.collectionId}&country=${
      metadata.country || podcast.appleCountry || "us"
    }&entity=podcastEpisode&limit=200`
  )
    .then(safeJson)
    .then((data) =>
      (data.results || []).filter(
        (item) =>
          item.wrapperType === "podcastEpisode" ||
          item.kind === "podcast-episode" ||
          item.trackId
      )
    )
    .catch(() => []);

  episodeListCache.set(key, promise);
  return promise;
}

const findEpisode = (results, podcast, episode, metadata) => {
  const sameShow = results.filter((item) => {
    if (!metadata?.collectionId) return true;
    return (
      Number(item.collectionId) === Number(metadata.collectionId) ||
      similarity(item.collectionName, podcast.title) >= 50
    );
  });

  const ranked = sameShow
    .map((item) => ({
      item,
      score: similarity(item.trackName, episode.title),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score >= 48 ? ranked[0].item : null;
};

export async function resolvePodcastEpisode(podcast, episode) {
  const metadata = await resolvePodcastMetadata(podcast);
  let match = null;

  const existingEpisodes = await getEpisodeList(podcast, metadata);
  match = findEpisode(existingEpisodes, podcast, episode, metadata);

  if (!match) {
    const country = metadata?.country || podcast.appleCountry || "us";
    const term = encodeURIComponent(`${episode.title} ${podcast.title}`);
    try {
      const data = await fetch(
        `https://itunes.apple.com/search?term=${term}&country=${country}&media=podcast&entity=podcastEpisode&limit=25`
      ).then(safeJson);
      match = findEpisode(data.results || [], podcast, episode, metadata);
    } catch {
      match = null;
    }
  }

  if (!match) {
    return {
      resolved: false,
      artworkUrl: metadata?.artworkUrl || null,
      sourceUrl: metadata?.collectionViewUrl || podcast.sourceUrl || null,
    };
  }

  return {
    resolved: true,
    trackId: match.trackId,
    collectionId: match.collectionId || metadata?.collectionId,
    title: match.trackName || episode.title,
    releaseDate: match.releaseDate || episode.date || null,
    durationMs: match.trackTimeMillis || null,
    artworkUrl:
      match.artworkUrl600 ||
      match.artworkUrl160 ||
      metadata?.artworkUrl ||
      null,
    sourceUrl: match.trackViewUrl || metadata?.collectionViewUrl || podcast.sourceUrl || null,
    embedUrl: makeEmbedUrl(
      metadata?.country || podcast.appleCountry || "us",
      metadata?.collectionViewUrl || match.collectionViewUrl,
      match.collectionId || metadata?.collectionId,
      match.trackId
    ),
  };
}

export function formatEpisodeDuration(durationMs) {
  if (!durationMs || Number.isNaN(Number(durationMs))) return null;
  const totalMinutes = Math.max(1, Math.round(Number(durationMs) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours} hr ${minutes ? `${minutes} min` : ""}`.trim() : `${minutes} min`;
}

export function formatEpisodeDate(value, locale = "en-US") {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}
