/**
 * What the music page and the homepage's music band can show (spec G.5,
 * K.1), gathered from the content: music entries (`kind: music`) with their
 * Spotify releases, YouTube videos and footage loops, and the profile's
 * music photographs. Pure, so it is unit-tested; the page and the band exist
 * only once there is something here.
 */

interface MediaItem {
  type: string;
  [key: string]: unknown;
}

export interface MusicEntryLike {
  id: string;
  data: {
    kind: string;
    title: string;
    date: Date | string;
    media: readonly MediaItem[];
  };
}

export interface MusicContent<E extends MusicEntryLike> {
  releases: { entry: E; url: string; title: string }[];
  videos: { entry: E; id: string; title: string }[];
  loop?: { name: string; title: string } | undefined;
}

const time = (date: Date | string) => (date instanceof Date ? date.getTime() : 0);

export function musicContent<E extends MusicEntryLike>(entries: readonly E[]): MusicContent<E> {
  const music = entries
    .filter((entry) => entry.data.kind === 'music')
    .sort((a, b) => time(b.data.date) - time(a.data.date));
  const releases: MusicContent<E>['releases'] = [];
  const videos: MusicContent<E>['videos'] = [];
  let loop: MusicContent<E>['loop'];
  for (const entry of music) {
    for (const item of entry.data.media) {
      if (item.type === 'spotify')
        releases.push({ entry, url: String(item.url), title: String(item.title) });
      if (item.type === 'youtube')
        videos.push({ entry, id: String(item.id), title: String(item.title) });
      if (item.type === 'video' && item.loop === true && !loop) {
        loop = { name: String(item.name), title: String(item.title) };
      }
    }
  }
  return { releases, videos, loop };
}

export function hasMusic(content: MusicContent<MusicEntryLike>): boolean {
  return content.releases.length > 0 || content.videos.length > 0 || content.loop !== undefined;
}
