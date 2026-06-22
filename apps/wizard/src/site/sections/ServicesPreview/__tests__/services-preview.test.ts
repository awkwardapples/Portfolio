import { describe, it, expect } from 'vitest';
import type { ServicesPreviewContent, ServicesPreviewItem } from '../types';
import { ICON_MAP } from '../icons';

describe('ServicesPreviewContent', () => {
  it('requires heading and a services array', () => {
    const content: ServicesPreviewContent = {
      heading: 'Our Services',
      services: [],
    };
    expect(content.heading).toBe('Our Services');
    expect(Array.isArray(content.services)).toBe(true);
  });

  it('each service item requires serviceId, name, and description', () => {
    const item: ServicesPreviewItem = {
      serviceId: 'fencing',
      name: 'Fencing',
      description: 'Garden, boundary, and security fencing.',
    };
    expect(item.serviceId).toBe('fencing');
    expect(item.name.length).toBeGreaterThan(0);
    expect(item.description.length).toBeGreaterThan(0);
  });

  it('service item link and iconOrImage are optional', () => {
    const minimal: ServicesPreviewItem = {
      serviceId: 'decking',
      name: 'Decking',
      description: 'Garden decking in all materials.',
    };
    expect(minimal.link).toBeUndefined();
    expect(minimal.iconOrImage).toBeUndefined();
  });

  it('cta and subheading are optional on the section', () => {
    const content: ServicesPreviewContent = {
      heading: 'Our Services',
      services: [{ serviceId: 'fencing', name: 'Fencing', description: 'Fencing services.' }],
    };
    expect(content.cta).toBeUndefined();
    expect(content.subheading).toBeUndefined();
  });
});

describe('ICON_MAP', () => {
  it('contains all 11 service icon keys', () => {
    const expected = [
      'fencing',
      'decking',
      'painting',
      'patio',
      'driveway',
      'steps',
      'jetwash',
      'general-repairs',
      'plumbing',
      'electrical',
      'carpentry',
    ];
    expect(Object.keys(ICON_MAP)).toEqual(expected);
  });

  it('every icon in ICON_MAP is a function (React component)', () => {
    for (const [key, icon] of Object.entries(ICON_MAP)) {
      expect(typeof icon, `${key} icon should be a function`).toBe('function');
    }
  });

  it('ICON_MAP is frozen (immutable)', () => {
    expect(Object.isFrozen(ICON_MAP)).toBe(true);
  });
});
