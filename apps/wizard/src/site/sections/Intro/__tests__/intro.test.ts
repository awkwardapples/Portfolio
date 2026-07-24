import { describe, it, expect } from 'vitest';
import type { IntroContent } from '../types';

describe('IntroContent', () => {
  it('requires heading and body', () => {
    const content: IntroContent = {
      heading: 'Built by Specialists. Trusted Locally.',
      body: 'We have been providing services since 2008.',
      variant: 'checklist',
    };
    expect(content.heading.length).toBeGreaterThan(0);
    expect(content.body.length).toBeGreaterThan(0);
  });

  it('bulletPoints is optional and defaults to undefined', () => {
    const content: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
      variant: 'checklist',
    };
    expect(content.bulletPoints).toBeUndefined();
  });

  it('accepts a non-empty bulletPoints array', () => {
    const content: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
      bulletPoints: ['Fully insured', 'Fast turnaround', 'Local & reliable'],
      variant: 'checklist',
    };
    expect(content.bulletPoints?.length).toBe(3);
    expect(content.bulletPoints?.[0]).toBe('Fully insured');
  });

  it('cta is optional', () => {
    const withCta: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
      variant: 'checklist',
      cta: { label: 'Get a free quote', href: '/quote' },
    };
    const withoutCta: IntroContent = {
      heading: 'About us',
      body: 'We do great work.',
      variant: 'checklist',
    };
    expect(withCta.cta?.href).toBe('/quote');
    expect(withoutCta.cta).toBeUndefined();
  });

  it('variant distinguishes credibility (featured panel) from checklist (full list)', () => {
    const credibility: IntroContent = {
      heading: 'Established 2006',
      body: 'Trusted locally.',
      bulletPoints: ['Merrist Wood trained', '20 years experience'],
      variant: 'credibility',
    };
    const checklist: IntroContent = {
      heading: 'Services Include',
      body: 'We help with:',
      bulletPoints: ['Item one', 'Item two'],
      variant: 'checklist',
    };
    expect(credibility.variant).toBe('credibility');
    expect(checklist.variant).toBe('checklist');
  });
});
