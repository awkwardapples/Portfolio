import { describe, expect, it } from 'vitest';

import { intentCtas, selectWork, type HomeSection } from './home';

const entry = (id: string) => ({ id });

describe('selectWork', () => {
  it('keeps featured entries first and in order', () => {
    const featured = [entry('b'), entry('a')];
    expect(selectWork(featured, [entry('a'), entry('c'), entry('b')]).map((e) => e.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('fills to four with the newest other entries, without repeats', () => {
    const newest = ['n1', 'f1', 'n2', 'n3', 'n4'].map(entry);
    expect(selectWork([entry('f1')], newest).map((e) => e.id)).toEqual(['f1', 'n1', 'n2', 'n3']);
  });

  it('never shows more than four', () => {
    const featured = ['a', 'b', 'c', 'd', 'e'].map(entry);
    expect(selectWork(featured, [])).toHaveLength(4);
  });
});

describe('intentCtas', () => {
  const noPages = { contact: false, research: false, music: false, growtrades: false };
  const sections = (...ids: HomeSection[]) => new Set<HomeSection>(ids);

  it('links only to what exists while pages are still being built', () => {
    const ctas = intentCtas({
      sections: sections('intro', 'selected-work', 'research', 'get-in-touch'),
      pages: noPages,
    });
    expect(ctas.looking).toEqual([
      { label: 'See selected work', href: '#selected-work' },
      { label: 'Get in touch', href: '#get-in-touch' },
    ]);
    expect(ctas.research[0]).toEqual({ label: 'Read the research', href: '#research' });
    // No CV, no GrowTrades section and no music yet: those answers use the default set.
    expect(ctas.hiring).toEqual(ctas.looking);
    expect(ctas.website).toEqual(ctas.looking);
    expect(ctas.music).toEqual(ctas.looking);
  });

  it('uses the pages and the CV once they exist (spec G.1)', () => {
    const ctas = intentCtas({
      sections: sections('selected-work', 'research', 'growtrades', 'music', 'get-in-touch'),
      cv: { href: '/cv.pdf', size: '140 kB' },
      pages: { contact: true, research: true, music: true, growtrades: true },
    });
    expect(ctas.hiring).toEqual([
      { label: 'Download CV (PDF, 140 kB)', href: '/cv.pdf', download: true },
      { label: 'Start a conversation', href: '/contact?intent=hiring' },
    ]);
    expect(ctas.research[0]?.href).toBe('/research');
    expect(ctas.website).toEqual([
      { label: 'See GrowTrades', href: '/work/growtrades' },
      { label: 'Talk about your website', href: '/contact?intent=website' },
    ]);
    expect(ctas.music).toEqual([
      { label: 'Listen', href: '/music' },
      { label: 'Get in touch', href: '/contact?intent=music' },
    ]);
  });

  it('falls back to the homepage sections before their pages exist', () => {
    const ctas = intentCtas({
      sections: sections('growtrades', 'music', 'get-in-touch'),
      pages: noPages,
    });
    expect(ctas.website[0]).toEqual({ label: 'See GrowTrades', href: '#growtrades' });
    expect(ctas.music[0]).toEqual({ label: 'Listen', href: '#music' });
    // Without a selected-work section the default set is just the conversation.
    expect(ctas.looking).toEqual([{ label: 'Get in touch', href: '#get-in-touch' }]);
  });
});
