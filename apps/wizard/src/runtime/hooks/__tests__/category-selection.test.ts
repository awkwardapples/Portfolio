import { describe, it, expect } from 'vitest';

import { isCategoryFilterActive } from '../useCategorySelection';

describe('isCategoryFilterActive', () => {
  it('returns true when a category id is set', () => {
    expect(isCategoryFilterActive('landscaping')).toBe(true);
  });

  it('returns false when no category is selected (null)', () => {
    expect(isCategoryFilterActive(null)).toBe(false);
  });

  it('returns true for any non-null category id', () => {
    expect(isCategoryFilterActive('handyman')).toBe(true);
    expect(isCategoryFilterActive('decorating')).toBe(true);
    expect(isCategoryFilterActive('exterior-cleaning')).toBe(true);
  });
});
