import { describe, expect, it } from 'vitest';

import { CATEGORIES, listCategories, resolveCategory } from '@/domain/registry/categories';

describe('CATEGORIES registry', () => {
  it('has exactly 4 categories (landscaping, decorating, exterior-cleaning, handyman)', () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(4);
    expect(CATEGORIES['landscaping']).toBeDefined();
    expect(CATEGORIES['decorating']).toBeDefined();
    expect(CATEGORIES['exterior-cleaning']).toBeDefined();
    expect(CATEGORIES['handyman']).toBeDefined();
  });

  it('is frozen (runtime immutability guard)', () => {
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
  });

  it('each category has id, label, and displayOrder', () => {
    for (const cat of Object.values(CATEGORIES)) {
      expect(typeof cat.id).toBe('string');
      expect(cat.id.length).toBeGreaterThan(0);
      expect(typeof cat.label).toBe('string');
      expect(cat.label.length).toBeGreaterThan(0);
      expect(typeof cat.displayOrder).toBe('number');
    }
  });

  it('category ids match their registry keys', () => {
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      expect(cat.id).toBe(key);
    }
  });
});

describe('listCategories', () => {
  it('returns 4 categories', () => {
    expect(listCategories()).toHaveLength(4);
  });

  it('returns categories sorted by displayOrder ascending', () => {
    const cats = listCategories();
    const orders = cats.map((c) => c.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('landscaping is first (displayOrder 1)', () => {
    expect(listCategories()[0]?.id).toBe('landscaping');
  });
});

describe('resolveCategory', () => {
  it("resolves 'landscaping' to its CategoryConfig", () => {
    const result = resolveCategory('landscaping');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('landscaping');
    expect(result?.label).toBe('Landscaping');
  });

  it("resolves 'handyman' to its CategoryConfig", () => {
    const result = resolveCategory('handyman');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('handyman');
  });

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
  it('CATEGORIES values have id, label, and displayOrder fields', () => {
    const sample = CATEGORIES['landscaping'];
    expect(sample).toBeDefined();
    expect(sample!.id).toBe('landscaping');
    expect(sample!.displayOrder).toBe(1);
  });
});
