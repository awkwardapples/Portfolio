import { describe, expect, it } from 'vitest';

import { embedFor, loneImage, loneLink } from './embeds';

describe('embedFor', () => {
  it('recognises YouTube links in their usual forms', () => {
    for (const href of [
      'https://www.youtube.com/watch?v=wWAGaOdlyMw',
      'https://youtu.be/wWAGaOdlyMw',
      'https://m.youtube.com/watch?v=wWAGaOdlyMw&t=1m5s',
      'https://www.youtube.com/shorts/wWAGaOdlyMw',
      'https://www.youtube-nocookie.com/embed/wWAGaOdlyMw',
    ]) {
      expect(embedFor(href, href), href).toMatchObject({ type: 'youtube', id: 'wWAGaOdlyMw' });
    }
    expect(embedFor('https://youtu.be/wWAGaOdlyMw?t=65', '')).toMatchObject({ start: 65 });
    expect(embedFor('https://www.youtube.com/watch?v=wWAGaOdlyMw&t=1m5s', '')).toMatchObject({
      start: 65,
    });
  });

  it('uses the link text as the title, unless it is the URL', () => {
    const href = 'https://youtu.be/wWAGaOdlyMw';
    expect(embedFor(href, 'Output verification')).toMatchObject({ title: 'Output verification' });
    expect(embedFor(href, href)).toMatchObject({ title: 'Video on YouTube' });
  });

  it('recognises Spotify tracks, albums and playlists', () => {
    expect(embedFor('https://open.spotify.com/intl-de/track/abc123', 'Song')).toEqual({
      type: 'spotify',
      url: 'https://open.spotify.com/intl-de/track/abc123',
      title: 'Song',
    });
    expect(embedFor('https://open.spotify.com/user/abc', 'x')).toBeUndefined();
  });

  it('recognises links to documents', () => {
    expect(embedFor('/documents/kerr-microscopy-dissertation.pdf', 'The dissertation')).toEqual({
      type: 'document',
      file: 'kerr-microscopy-dissertation.pdf',
      title: 'The dissertation',
    });
    expect(embedFor('./neural-network-iris-report.pdf', '')).toMatchObject({ type: 'document' });
  });

  it('leaves ordinary links alone', () => {
    for (const href of [
      'https://github.com/awkwardapples',
      'http://youtu.be/wWAGaOdlyMw',
      'https://youtu.be/short',
      '/work/kerr-microscopy-dissertation',
      'mailto:someone@example.com',
    ]) {
      expect(embedFor(href, 'x'), href).toBeUndefined();
    }
  });
});

describe('loneLink and loneImage', () => {
  it('finds a paragraph that is a single link', () => {
    expect(loneLink('<a href="https://youtu.be/x?a=1&amp;b=2">Watch</a>')).toEqual({
      href: 'https://youtu.be/x?a=1&b=2',
      text: 'Watch',
    });
    expect(loneLink('See <a href="https://youtu.be/x">this</a>.')).toBeUndefined();
    expect(loneLink('<a href="/a"><em>x</em></a>')).toBeUndefined();
  });

  it('finds a paragraph that is a single image and takes its title as the caption', () => {
    expect(loneImage('<img src="/_astro/a.webp" alt="A bench" title="The rig, 2025">')).toEqual({
      img: '<img src="/_astro/a.webp" alt="A bench">',
      caption: 'The rig, 2025',
    });
    expect(loneImage('Text <img src="a">')).toBeUndefined();
  });
});
