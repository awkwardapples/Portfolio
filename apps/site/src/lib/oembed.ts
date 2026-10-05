/**
 * oEmbed at build time (spec K.2, ADR-0046): a video's or track's real title
 * and thumbnail, fetched once while the site builds, so the facade shows
 * them without the browser asking YouTube or Spotify for anything. The
 * thumbnail is then downloaded and optimised by Astro (astro.config.mjs
 * `image.domains`) and served from this site.
 *
 * Never throws: if the provider cannot be reached, the facade uses the title
 * in the content and no thumbnail, and the build carries on.
 */

export interface OEmbedInfo {
  title: string;
  thumbnail?: { url: string; width: number; height: number } | undefined;
}

export function youtubeOembedUrl(id: string): string {
  return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
}

export function spotifyOembedUrl(url: string): string {
  return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
}

/** Reads an oEmbed response; anything unexpected falls back to the given title. */
export function parseOembed(body: unknown, fallbackTitle: string): OEmbedInfo {
  const data = (body ?? {}) as Record<string, unknown>;
  const title =
    typeof data.title === 'string' && data.title.trim() !== '' ? data.title.trim() : fallbackTitle;
  const url = typeof data.thumbnail_url === 'string' ? data.thumbnail_url : undefined;
  const width = Number(data.thumbnail_width);
  const height = Number(data.thumbnail_height);
  return {
    title,
    thumbnail:
      url && url.startsWith('https://') && width > 0 && height > 0
        ? { url, width, height }
        : undefined,
  };
}

const cache = new Map<string, Promise<OEmbedInfo>>();

/** One request per endpoint per build. */
export function fetchOembed(
  endpoint: string,
  fallbackTitle: string,
  fetchImpl: typeof fetch = fetch,
  log: (message: string) => void = (message) => console.warn(message),
): Promise<OEmbedInfo> {
  const cached = cache.get(endpoint);
  if (cached) return cached;
  const pending = (async () => {
    try {
      const response = await fetchImpl(endpoint, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parseOembed(await response.json(), fallbackTitle);
    } catch (error) {
      log(
        `oembed: using the content's title (${error instanceof Error ? error.message : 'unknown error'})`,
      );
      return { title: fallbackTitle };
    }
  })();
  cache.set(endpoint, pending);
  return pending;
}

export interface ImageCandidate {
  url: string;
  width: number;
  height: number;
}

/**
 * The first remote image that actually exists, checked with a HEAD request.
 * Astro fetches remote images late in the build, where a missing one would
 * fail it, so each candidate is checked first; none available means none.
 */
export async function firstAvailable(
  candidates: readonly ImageCandidate[],
  fetchImpl: typeof fetch = fetch,
): Promise<ImageCandidate | undefined> {
  for (const candidate of candidates) {
    try {
      const response = await fetchImpl(candidate.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) return candidate;
    } catch {
      // Unreachable: try the next one.
    }
  }
  return undefined;
}
