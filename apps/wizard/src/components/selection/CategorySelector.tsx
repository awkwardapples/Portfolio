import type { ReactElement } from 'react';

import type { CategoryConfig, CategoryId } from '@/domain/registry';

interface CategorySelectorProps {
  /** Ordered list of categories to display. */
  readonly categories: readonly CategoryConfig[];
  /** Called when the user selects a category. */
  readonly onSelect: (categoryId: CategoryId) => void;
}

/**
 * Category selection screen (Step 5.5a / ADR-0017).
 *
 * Shown before service selection when enableCategoryNavigation is true. The user
 * picks a category; the parent then filters services to that category and shows
 * ServiceSelector.
 *
 * Empty canonical template: CATEGORIES is empty in the reference repo. This
 * component renders nothing meaningful until a client fork populates CATEGORIES.
 *
 * Follows the same accessibility and style conventions as ServiceSelector:
 * semantic heading, real <ul>, full-width <button> elements.
 */
export function CategorySelector({ categories, onSelect }: CategorySelectorProps): ReactElement {
  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-text">What type of work do you need?</h1>
      <p className="mt-2 text-base text-text-muted">Choose a category to see relevant services.</p>
      <ul className="mt-6 space-y-3" role="list">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onSelect(category.id)}
              className="w-full rounded border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="block text-base font-medium text-text">{category.label}</span>
              {category.description !== undefined && (
                <span className="mt-1 block text-sm text-text-muted">{category.description}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
