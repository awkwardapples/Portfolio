/**
 * Category registry for grouping wizard services.
 *
 * Optional capability: when enableCategoryNavigation is false in PublicConfig,
 * this registry is inert. When true, the wizard presents a category selection
 * step before service selection, and services declare their categoryId.
 *
 * Categories are pure data — no behavior, no special rendering rules.
 * Populated in Step 5.9 with the 4 standard handyman template categories.
 */

/** Stable identifier for a category. Same constraints as service IDs. */
export type CategoryId = string;

export interface CategoryConfig {
  /** Stable registry key. Must match the key it lives under. */
  readonly id: CategoryId;
  /** Human-readable label shown in the category selector. */
  readonly label: string;
  /** Optional subtitle or description shown below the label. */
  readonly description?: string;
  /** Controls display order in the category selector (ascending). */
  readonly displayOrder: number;
}

/**
 * The closed category registry.
 *
 * Four standard categories for a handyman template (ADR-0021).
 * Category navigation is disabled by default (enableCategoryNavigation: false).
 * Client forks enable it via PublicConfig when their service breadth warrants it.
 */
export const CATEGORIES: Readonly<Record<CategoryId, CategoryConfig>> = Object.freeze({
  landscaping: {
    id: 'landscaping',
    label: 'Landscaping',
    description: 'Outdoor structures, fencing, patios, and driveways.',
    displayOrder: 1,
  },
  decorating: {
    id: 'decorating',
    label: 'Decorating',
    description: 'Interior painting and decoration.',
    displayOrder: 2,
  },
  'exterior-cleaning': {
    id: 'exterior-cleaning',
    label: 'Exterior Cleaning',
    description: 'Pressure washing and outdoor surface cleaning.',
    displayOrder: 3,
  },
  handyman: {
    id: 'handyman',
    label: 'Handyman Services',
    description: 'General repairs and trades work around the home.',
    displayOrder: 4,
  },
});

/**
 * Return all categories sorted by displayOrder ascending.
 */
export function listCategories(): readonly CategoryConfig[] {
  return Object.values(CATEGORIES).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Resolve a category by ID. Returns null when the ID is not in the registry.
 */
export function resolveCategory(categoryId: CategoryId | undefined): CategoryConfig | null {
  if (categoryId === undefined) return null;
  return CATEGORIES[categoryId] ?? null;
}
