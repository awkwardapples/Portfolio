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
