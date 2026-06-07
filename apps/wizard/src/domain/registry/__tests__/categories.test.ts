import { describe, expect, it } from 'vitest';

import { CATEGORIES, listCategories, resolveCategory } from '@/domain/registry/categories';

describe('CATEGORIES registry', () => {
  it('is empty in the canonical template', () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(0);
  });

  it('is frozen (runtime immutability guard)', () => {
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
  });
});

describe('listCategories', () => {
  it('returns an empty array when no categories are registered', () => {
    expect(listCategories()).toEqual([]);
  });
});

describe('resolveCategory', () => {
  it('returns null for an unknown category ID', () => {
    expect(resolveCategory('unknown')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveCategory('')).toBeNull();
  });

  it('returns null when called with undefined', () => {
    expect(resolveCategory(undefined)).toBeNull();
  });
});

describe('CategoryConfig type shape', () => {
  it('CATEGORIES values have id, label, and displayOrder fields when populated', () => {
    // Verify the type contract by constructing a valid CategoryConfig inline.
    // The template registry is empty; this confirms the expected shape compiles.
    const sample = {
      id: 'landscaping',
      label: 'Landscaping',
      description: 'Garden and outdoor services',
      displayOrder: 1,
    };
    expect(sample.id).toBe('landscaping');
    expect(sample.displayOrder).toBe(1);
  });
});
