import { describe, expect, it } from 'vitest';

import { chooseSources, mayAutoplay } from './footage';

/** Footage loop behaviour (spec K.3; Pass 8 acceptance: reduced motion and Save-Data). */
describe('mayAutoplay', () => {
  it('plays by itself on a normal connection without reduced motion', () => {
    expect(mayAutoplay({ reducedMotion: false })).toBe(true);
    expect(mayAutoplay({ reducedMotion: false, effectiveType: '4g' })).toBe(true);
  });

  it('never plays by itself with reduced motion, Save-Data or a slow connection', () => {
    expect(mayAutoplay({ reducedMotion: true })).toBe(false);
    expect(mayAutoplay({ reducedMotion: false, saveData: true })).toBe(false);
    for (const effectiveType of ['slow-2g', '2g', '3g']) {
      expect(mayAutoplay({ reducedMotion: false, effectiveType }), effectiveType).toBe(false);
    }
  });
});

describe('chooseSources', () => {
  const base = '/media/video/stage';

  it('offers AV1 first and H.264 second', () => {
    const sources = chooseSources(base, { width: 1440, pixelRatio: 1, portrait: false }, false);
    expect(sources.map((source) => source.src)).toEqual([
      '/media/video/stage/1080.av1.mp4',
      '/media/video/stage/1080.h264.mp4',
    ]);
    expect(sources[0]?.type).toContain('av01');
  });

  it('uses 720p where 1080p would be wasted, and the portrait crop on upright phones', () => {
    expect(
      chooseSources(base, { width: 1024, pixelRatio: 1, portrait: false }, false)[0]?.src,
    ).toBe('/media/video/stage/720.av1.mp4');
    expect(chooseSources(base, { width: 390, pixelRatio: 3, portrait: true }, true)[0]?.src).toBe(
      '/media/video/stage/portrait-720.av1.mp4',
    );
    // Without a portrait crop, an upright phone gets the landscape file.
    expect(chooseSources(base, { width: 390, pixelRatio: 3, portrait: true }, false)[0]?.src).toBe(
      '/media/video/stage/720.av1.mp4',
    );
  });
});
