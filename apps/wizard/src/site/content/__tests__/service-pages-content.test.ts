import { describe, it, expect } from 'vitest';
import { servicePages } from '../service-pages-content';
import { services } from '../services-content';

describe('servicePages', () => {
  it('contains exactly 5 landing pages', () => {
    expect(servicePages).toHaveLength(5);
  });

  it('every slug matches its path (path is /services/{slug})', () => {
    for (const page of servicePages) {
      expect(page.path).toBe(`/services/${page.slug}`);
    }
  });

  it('slugs and paths are unique', () => {
    expect(new Set(servicePages.map((p) => p.slug)).size).toBe(servicePages.length);
    expect(new Set(servicePages.map((p) => p.path)).size).toBe(servicePages.length);
  });

  it('every navLabel is non-empty and contains no location name', () => {
    const locations = ['guildford', 'surrey'];
    for (const page of servicePages) {
      expect(page.navLabel.length).toBeGreaterThan(0);
      const lower = page.navLabel.toLowerCase();
      for (const location of locations) {
        expect(lower).not.toContain(location);
      }
    }
  });

  it('every serviceId matches a real service in services-content.ts', () => {
    const validIds = new Set(services.map((s) => s.id));
    for (const page of servicePages) {
      expect(validIds.has(page.serviceId)).toBe(true);
    }
  });

  it('every page starts with a hero section and ends with an faq section', () => {
    for (const page of servicePages) {
      expect(page.sections[0]?.kind).toBe('hero');
      expect(page.sections[page.sections.length - 1]?.kind).toBe('faq');
    }
  });

  it('section IDs are unique within each page', () => {
    for (const page of servicePages) {
      const ids = page.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every page has a non-empty SEO title and description', () => {
    for (const page of servicePages) {
      expect(page.seo.title.length).toBeGreaterThan(0);
      expect(page.seo.description.length).toBeGreaterThan(0);
    }
  });

  it('every hero primaryCta deep-links to /quote with the page serviceId', () => {
    for (const page of servicePages) {
      const hero = page.sections.find((s) => s.kind === 'hero');
      expect(hero?.kind).toBe('hero');
      if (hero?.kind === 'hero') {
        expect(hero.content.primaryCta.href).toBe(`/quote?service=${page.serviceId}`);
      }
    }
  });

  it('every faq cta deep-links to /quote with the page serviceId', () => {
    for (const page of servicePages) {
      const faq = page.sections.find((s) => s.kind === 'faq');
      expect(faq?.kind).toBe('faq');
      if (faq?.kind === 'faq') {
        expect(faq.content.cta?.href).toBe(`/quote?service=${page.serviceId}`);
      }
    }
  });
});
