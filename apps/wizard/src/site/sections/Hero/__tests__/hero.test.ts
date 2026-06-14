import { describe, it, expect } from 'vitest';
import type { HeroContent } from '../types';

describe('HeroContent', () => {
  it('requires heading, subheading, and primaryCta', () => {
    const content: HeroContent = {
      heading: 'Acme Fencing',
      subheading: 'Professional fencing across the south east',
      primaryCta: { label: 'Get a free quote', href: '/quote' },
    };
    expect(content.heading).toBe('Acme Fencing');
    expect(content.subheading.length).toBeGreaterThan(0);
    expect(content.primaryCta.href).toBe('/quote');
  });

  it('accepts an optional secondaryCta', () => {
    const content: HeroContent = {
      heading: 'Acme Fencing',
      subheading: 'Professional fencing',
      primaryCta: { label: 'Get a free quote', href: '/quote' },
      secondaryCta: { label: 'Call us', href: 'tel:01234567890' },
    };
    expect(content.secondaryCta?.label).toBe('Call us');
    expect(content.secondaryCta?.href).toBe('tel:01234567890');
  });

  it('secondaryCta is absent when not provided', () => {
    const content: HeroContent = {
      heading: 'Test',
      subheading: 'Sub',
      primaryCta: { label: 'CTA', href: '/quote' },
    };
    expect(content.secondaryCta).toBeUndefined();
  });

  it('accepts optional backgroundImage and alt text', () => {
    const content: HeroContent = {
      heading: 'Test',
      subheading: 'Sub',
      primaryCta: { label: 'CTA', href: '/quote' },
      backgroundImage: '/images/hero.jpg',
      backgroundImageAlt: 'Workers installing a fence',
    };
    expect(content.backgroundImage).toBe('/images/hero.jpg');
    expect(content.backgroundImageAlt).toBe('Workers installing a fence');
  });
});
