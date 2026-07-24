import { describe, it, expect } from 'vitest';
import type { ServiceHeroContent } from '../types';

describe('ServiceHeroContent', () => {
  it('requires heading, subheading, primaryCta, heroImage and heroImageAlt', () => {
    const content: ServiceHeroContent = {
      heading: 'Fence Panel Repair & Replacement in Guildford',
      subheading: 'Broken or storm-damaged fence panels replaced quickly.',
      primaryCta: { label: 'Get Your Free Quote', href: '/quote?service=fencing' },
      heroImage: '/images/service-hero-fencing.jpg',
      heroImageAlt: 'Timber fence panel being repaired in a Guildford garden',
    };
    expect(content.heading.length).toBeGreaterThan(0);
    expect(content.subheading.length).toBeGreaterThan(0);
    expect(content.primaryCta.href).toBe('/quote?service=fencing');
    expect(content.heroImage.length).toBeGreaterThan(0);
    expect(content.heroImageAlt.length).toBeGreaterThan(0);
  });

  it('secondaryCta is optional', () => {
    const withSecondary: ServiceHeroContent = {
      heading: 'Heading',
      subheading: 'Subheading',
      primaryCta: { label: 'Get a quote', href: '/quote' },
      secondaryCta: { label: 'Call Now', href: 'tel:07776066965' },
      heroImage: '/images/service-hero-fencing.jpg',
      heroImageAlt: 'Alt text',
    };
    const withoutSecondary: ServiceHeroContent = {
      heading: 'Heading',
      subheading: 'Subheading',
      primaryCta: { label: 'Get a quote', href: '/quote' },
      heroImage: '/images/service-hero-fencing.jpg',
      heroImageAlt: 'Alt text',
    };
    expect(withSecondary.secondaryCta?.href).toBe('tel:07776066965');
    expect(withoutSecondary.secondaryCta).toBeUndefined();
  });
});
