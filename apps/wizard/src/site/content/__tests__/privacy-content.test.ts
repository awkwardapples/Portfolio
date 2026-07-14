import { describe, it, expect } from 'vitest';
import { privacyContent } from '@/site/content/privacy-content';
import { siteContent } from '@/site/content/site-content';

describe('privacy-content', () => {
  it('has a non-empty lastUpdated string', () => {
    expect(privacyContent.lastUpdated.length).toBeGreaterThan(0);
  });

  it('contains at least the 10 UK GDPR-required disclosure sections', () => {
    expect(privacyContent.sections.length).toBeGreaterThanOrEqual(10);
  });

  it('section ids are unique', () => {
    const ids = privacyContent.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every section has a non-empty heading and at least one non-empty body paragraph', () => {
    for (const section of privacyContent.sections) {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(0);
      for (const paragraph of section.body) {
        expect(paragraph.length).toBeGreaterThan(0);
      }
    }
  });

  it('includes the required disclosure topics', () => {
    const ids = privacyContent.sections.map((s) => s.id);
    expect(ids).toContain('who-we-are');
    expect(ids).toContain('what-we-collect');
    expect(ids).toContain('why-we-collect-it');
    expect(ids).toContain('how-we-use-it');
    expect(ids).toContain('who-we-share-it-with');
    expect(ids).toContain('how-long-we-keep-it');
    expect(ids).toContain('your-rights');
    expect(ids).toContain('exercising-your-rights');
    expect(ids).toContain('contact-us');
    expect(ids).toContain('policy-changes');
  });

  it('interpolates the business name and contact email from site-content', () => {
    const whoWeAre = privacyContent.sections.find((s) => s.id === 'who-we-are');
    expect(whoWeAre?.body[0]).toContain(siteContent.businessName);

    const howToExercise = privacyContent.sections.find((s) => s.id === 'exercising-your-rights');
    expect(howToExercise?.body[0]).toContain(siteContent.contact.email);
  });
});
