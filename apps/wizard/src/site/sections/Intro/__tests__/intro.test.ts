import { describe, it, expect } from 'vitest';
import type { IntroContent } from '../types';

describe('IntroContent', () => {
  it('requires heading and body', () => {
    const content: IntroContent = {
      heading: 'Built by Specialists. Trusted Locally.',
      body: 'We have been providing services since 2008.',
    };
    expect(content.heading.length).toBeGreaterThan(0);
    expect(content.body.length).toBeGreaterThan(0);
  });

  it('bulletPoints is optional and defaults to undefined', () => {
    const content: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
    };
    expect(content.bulletPoints).toBeUndefined();
  });

  it('accepts a non-empty bulletPoints array', () => {
    const content: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
      bulletPoints: ['Fully insured', 'Fast turnaround', 'Local & reliable'],
    };
    expect(content.bulletPoints?.length).toBe(3);
    expect(content.bulletPoints?.[0]).toBe('Fully insured');
  });

  it('cta is optional', () => {
    const withCta: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
      cta: { label: 'Get a free quote', href: '/quote' },
    };
    const withoutCta: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
    };
    expect(withCta.cta?.href).toBe('/quote');
    expect(withoutCta.cta).toBeUndefined();
  });
});
