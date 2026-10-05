import { describe, expect, it } from 'vitest';

import { hasMusic, musicContent, type MusicEntryLike } from './music';

const entry = (id: string, kind: string, date: string, media: MusicEntryLike['data']['media']) => ({
  id,
  data: { kind, title: id, date: new Date(date), media },
});

describe('musicContent (spec K.1)', () => {
  it('gathers releases, videos and the first loop from music entries, newest first', () => {
    const content = musicContent([
      entry('older', 'music', '2024-01-01', [
        { type: 'spotify', url: 'https://open.spotify.com/track/a', title: 'Old song' },
      ]),
      entry('newer', 'music', '2026-01-01', [
        { type: 'spotify', url: 'https://open.spotify.com/track/b', title: 'New song' },
        { type: 'youtube', id: 'wWAGaOdlyMw', title: 'Video' },
        { type: 'video', name: 'stage', title: 'On stage', loop: true },
      ]),
      entry('code', 'software', '2026-02-01', [
        { type: 'youtube', id: 'xxxxxxxxxxx', title: 'Demo' },
      ]),
    ]);
    expect(content.releases.map((release) => release.title)).toEqual(['New song', 'Old song']);
    expect(content.videos.map((video) => video.id)).toEqual(['wWAGaOdlyMw']);
    expect(content.loop).toEqual({ name: 'stage', title: 'On stage' });
    expect(hasMusic(content)).toBe(true);
  });

  it('is empty, and the page stays unbuilt, without music entries', () => {
    const content = musicContent([entry('code', 'software', '2026-02-01', [])]);
    expect(hasMusic(content)).toBe(false);
  });
});
