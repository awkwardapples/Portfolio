import { describe, it, expect } from 'vitest';
import { siteContent } from '@/site/content/site-content';
import { services } from '@/site/content/services-content';
import { works } from '@/site/content/work-content';

describe('site-content', () => {
  it('has a non-empty businessName', () => {
    expect(siteContent.businessName.length).toBeGreaterThan(0);
  });

  it('contact fields are non-empty strings', () => {
    expect(siteContent.contact.phone.length).toBeGreaterThan(0);
    expect(siteContent.contact.email.length).toBeGreaterThan(0);
    expect(siteContent.contact.address.length).toBeGreaterThan(0);
    expect(siteContent.contact.hours.length).toBeGreaterThan(0);
  });

  it('home heading and subheading are non-empty', () => {
    expect(siteContent.home.heading.length).toBeGreaterThan(0);
    expect(siteContent.home.subheading.length).toBeGreaterThan(0);
  });

  it('nav ctaLabel is non-empty', () => {
    expect(siteContent.nav.ctaLabel.length).toBeGreaterThan(0);
  });
});

describe('services content', () => {
  it('contains at least one service', () => {
    expect(services.length).toBeGreaterThan(0);
  });

  it('every service has non-empty id, name, summary, description', () => {
    for (const s of services) {
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.summary.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it('service ids are unique', () => {
    const ids = services.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('works content', () => {
  it('every work entry references a real service id', () => {
    const serviceIds = new Set(services.map((s) => s.id));
    for (const w of works) {
      expect(serviceIds.has(w.serviceId)).toBe(true);
    }
  });

  it('work ids are unique', () => {
    const ids = works.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
