import { describe, it, expect } from 'vitest';
import { homePageContent } from '../home-page-content';

describe('homePageContent', () => {
  it('contains exactly 7 sections', () => {
    expect(homePageContent).toHaveLength(7);
  });

  it('contains each of the 7 expected section kinds', () => {
    const kinds = homePageContent.map((s) => s.kind);
    expect(kinds).toContain('hero');
    expect(kinds).toContain('intro');
    expect(kinds).toContain('services-preview');
    expect(kinds).toContain('process');
    expect(kinds).toContain('projects');
    expect(kinds).toContain('why-choose-us');
    expect(kinds).toContain('faq');
  });

  it('section IDs are all unique', () => {
    const ids = homePageContent.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hero is the first section and faq is the last', () => {
    expect(homePageContent[0]?.kind).toBe('hero');
    expect(homePageContent[homePageContent.length - 1]?.kind).toBe('faq');
  });

  it('every section has a non-empty id', () => {
    for (const section of homePageContent) {
      expect(section.id.length).toBeGreaterThan(0);
    }
  });
});
