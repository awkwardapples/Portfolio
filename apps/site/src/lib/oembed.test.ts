import { describe, expect, it, vi } from 'vitest';

import {
  fetchOembed,
  firstAvailable,
  parseOembed,
  spotifyOembedUrl,
  youtubeOembedUrl,
} from './oembed';

/** Build-time oEmbed with fallbacks (spec K.2: never fail the build for this). */
describe('oembed', () => {
  it('builds the provider endpoints', () => {
    expect(youtubeOembedUrl('wWAGaOdlyMw')).toBe(
      'https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DwWAGaOdlyMw',
    );
    expect(spotifyOembedUrl('https://open.spotify.com/track/abc')).toBe(
      'https://open.spotify.com/oembed?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2Fabc',
    );
  });

  it('reads the title and thumbnail', () => {
    expect(
      parseOembed(
        {
          title: ' Output verification ',
          thumbnail_url: 'https://i.ytimg.com/vi/x/hqdefault.jpg',
          thumbnail_width: 480,
          thumbnail_height: 360,
        },
        'Fallback',
      ),
    ).toEqual({
      title: 'Output verification',
      thumbnail: { url: 'https://i.ytimg.com/vi/x/hqdefault.jpg', width: 480, height: 360 },
    });
  });

  it('falls back to the content title and no thumbnail on anything odd', () => {
    expect(parseOembed({ title: '', thumbnail_url: 'http://insecure' }, 'Fallback')).toEqual({
      title: 'Fallback',
      thumbnail: undefined,
    });
    expect(parseOembed(null, 'Fallback')).toEqual({ title: 'Fallback', thumbnail: undefined });
  });

  it('never throws when the provider is unreachable, and asks only once', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    const log = vi.fn();
    const endpoint = youtubeOembedUrl('unreachable1');
    expect(await fetchOembed(endpoint, 'From content', fetchImpl, log)).toEqual({
      title: 'From content',
    });
    expect(await fetchOembed(endpoint, 'From content', fetchImpl, log)).toEqual({
      title: 'From content',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^oembed: using the content's title/));
  });
});

describe('firstAvailable', () => {
  const candidates = [
    { url: 'https://i.ytimg.com/vi/x/maxresdefault.jpg', width: 1280, height: 720 },
    { url: 'https://i.ytimg.com/vi/x/sddefault.jpg', width: 640, height: 480 },
  ];

  it('returns the first image that exists, checking with HEAD', async () => {
    const fetchImpl = vi.fn(
      async (url: string) => new Response(null, { status: url.includes('maxres') ? 404 : 200 }),
    );
    expect(await firstAvailable(candidates, fetchImpl as unknown as typeof fetch)).toEqual(
      candidates[1],
    );
    expect((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].method).toBe('HEAD');
  });

  it('returns nothing when none can be reached, so the build carries on', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('offline');
    });
    expect(await firstAvailable(candidates, fetchImpl as unknown as typeof fetch)).toBeUndefined();
  });
});
