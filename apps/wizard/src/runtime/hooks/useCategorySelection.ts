import { useState } from 'react';

import type { CategoryId } from '@/domain/registry';

export interface CategorySelectionState {
  readonly selectedCategoryId: CategoryId | null;
  readonly selectCategory: (id: CategoryId) => void;
  readonly resetCategory: () => void;
}

/**
 * Manages category selection state for the page-level category navigation
 * phase (ADR-0017). State is local to the QuotePage mount; navigating away
 * and back resets the selection.
 */
export function useCategorySelection(): CategorySelectionState {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);

  return {
    selectedCategoryId,
    selectCategory: setSelectedCategoryId,
    resetCategory: () => setSelectedCategoryId(null),
  };
}

/**
 * Returns true when a category filter is active (i.e., the user has selected
 * a category and the service list is filtered to that category). Used to
 * determine whether the "← All categories" back button should be displayed.
 */
export function isCategoryFilterActive(categoryId: CategoryId | null): boolean {
  return categoryId !== null;
}
