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

  it('every page starts with a service-hero section and ends with an faq section', () => {
    for (const page of servicePages) {
      expect(page.sections[0]?.kind).toBe('service-hero');
      expect(page.sections[page.sections.length - 1]?.kind).toBe('faq');
    }
  });

  it('every intro-kind block has an explicit variant', () => {
    for (const page of servicePages) {
      const introBlocks = page.sections.filter((s) => s.kind === 'intro');
      expect(introBlocks.length).toBe(4);
      for (const block of introBlocks) {
        if (block.kind === 'intro') {
          expect(['credibility', 'checklist']).toContain(block.content.variant);
        }
      }
    }
  });

  it('the "what we help with" and "who we help" blocks use the checklist variant with a full bullet list', () => {
    for (const page of servicePages) {
      const whatWeHelpWith = page.sections.find((s) => s.id === 'what-we-help-with');
      const whoWeHelp = page.sections.find((s) => s.id === 'who-we-help');
      for (const block of [whatWeHelpWith, whoWeHelp]) {
        expect(block?.kind).toBe('intro');
        if (block?.kind === 'intro') {
          expect(block.content.variant).toBe('checklist');
          expect(block.content.bulletPoints?.length).toBeGreaterThan(0);
        }
      }
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
      const hero = page.sections.find((s) => s.kind === 'service-hero');
      expect(hero?.kind).toBe('service-hero');
      if (hero?.kind === 'service-hero') {
        expect(hero.content.primaryCta.href).toBe(`/quote?service=${page.serviceId}`);
      }
    }
  });

  it('every service-hero has a non-empty heroImage and heroImageAlt', () => {
    for (const page of servicePages) {
      const hero = page.sections.find((s) => s.kind === 'service-hero');
      expect(hero?.kind).toBe('service-hero');
      if (hero?.kind === 'service-hero') {
        expect(hero.content.heroImage.length).toBeGreaterThan(0);
        expect(hero.content.heroImageAlt.length).toBeGreaterThan(0);
      }
    }
  });

  it('every service-hero image path is unique across the 5 pages', () => {
    const images = servicePages.map((page) => {
      const hero = page.sections.find((s) => s.kind === 'service-hero');
      return hero?.kind === 'service-hero' ? hero.content.heroImage : undefined;
    });
    expect(new Set(images).size).toBe(servicePages.length);
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
